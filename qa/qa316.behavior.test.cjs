/* QA316~317 동작 테스트 — 코드 글자가 아니라 실제 동작을 확인
   · 말풍선: 내가 건 말과 대답은 즉시, NPC 혼잣말만 차례로
   · 다가가기: NPC가 어느 쪽을 보든 내 쪽에서 다가감(카운터 직원·다른 유저는 정면) */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing source section: ${start}`);
  return source.slice(a, b);
}
function actor(name = '관객') {
  return { visible: true, position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 }, userData: { displayName: name, lvl: 0 } };
}

function bubbleContext() {
  let now = 100000; const shown = [], ticks = [], store = {};
  const ctx = { performance: { now: () => now }, setInterval: f => { ticks.push(f); return 1; }, ACTOR_SESSION: null, me: { position: { x: 0, z: 0 } }, curZone: () => 'L0',
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } }, JSON, Math, Date };
  ctx.window = ctx;
  ctx.say = (c, t) => { shown.push({ who: c.n, t, at: now }); };
  ctx.sayB = (c, t) => { shown.push({ who: c.n, t, at: now }); };
  vm.createContext(ctx);
  const open = '<script id="qa291-queue">';
  vm.runInContext(section(open, '</script>').slice(open.length), ctx);
  const advance = ms => { const end = now + ms; while (now < end) { now = Math.min(end, now + 240); ticks.forEach(f => f()); } };
  const npc = (n, x = 1) => ({ n, visible: true, position: { x, z: 0 }, userData: { displayName: n }, remove() {} });
  return { ctx, shown, advance, t0: now, clock: () => now, npc };
}

test('말을 걸면 내 말풍선과 NPC 대답이 기다리지 않고 바로 뜬다', () => {
  const { ctx, shown, advance, t0, npc } = bubbleContext(), me = npc('나'), g = npc('마들렌');
  ctx.sayB(g, '자기소개', 8);
  advance(480);
  ctx.sayB(me, '반가워요!', 3);
  advance(900);
  ctx.sayB(g, '대답', 6);
  assert.deepEqual(shown.map(x => x.t), ['자기소개', '반가워요!', '대답']);
  assert.equal(shown[1].at - t0, 480);
  assert.equal(shown[2].at - shown[1].at, 900);
});

test('QA421 NPC 혼잣말은 10초 간격으로 차례로, NPC마다 하루 한 번만', () => {
  const { ctx, shown, advance, npc } = bubbleContext();
  const a = npc('a'), b = npc('b');
  ctx.sayAmb(a, '혼잣말 a'); ctx.sayAmb(b, '혼잣말 b');
  assert.equal(shown.length, 1);
  advance(9600); assert.equal(shown.length, 1);
  advance(720); assert.equal(shown.length, 2);
  assert(shown[1].at - shown[0].at >= 10000);
  advance(11000); ctx.sayAmb(a, '또 a'); advance(11000);
  assert.equal(shown.length, 2);                 // 오늘은 이미 말함
});

test('QA421 멀리 있는 NPC는 혼잣말하지 않고, 대화 중에는 끼어들지 않는다', () => {
  const { ctx, shown, advance, npc } = bubbleContext();
  ctx.sayAmb(npc('far', 20), '먼 곳'); assert.equal(shown.length, 0);
  ctx.ACTOR_SESSION = { target: {} };
  ctx.sayBAmb(npc('b'), '대화 중 혼잣말');
  advance(4000); assert.equal(shown.length, 0);
  ctx.ACTOR_SESSION = null; advance(480);
  assert.equal(shown.length, 1);
});

function frontContext(over = {}) {
  const me = actor('나');
  const ctx = Object.assign({ Math, me, curZone: () => 'L0', zoneOf: () => 'L0', blocked: () => false, furnitureRoute: () => [{}] }, over);
  vm.createContext(ctx);
  vm.runInContext(section('function actorFrontPoint(target)', '/* CINE_QA12_FIVE_REQUESTS'), ctx);
  return { ctx, me };
}
const offFront = (t, p) => { const a = Math.atan2(p.x - t.position.x, p.z - t.position.z) - t.rotation.y; return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); };

test('벽을 보고 선 NPC도 내가 있는 쪽에서 다가간다', () => {
  const { ctx, me } = frontContext(), npc = actor('앙드레');
  npc.rotation.y = Math.PI / 2;            // +x(벽)를 봄
  me.position.x = -6;                      // 나는 등 뒤쪽
  const p = ctx.actorFrontPoint(npc);
  assert(p.x < 0, '내 쪽(-x)으로 가야 함');
  assert(Math.abs(Math.hypot(p.x, p.z) - 1.4) < 1e-9);
});

test('이미 말 걸 만한 거리면 걷지 않는다', () => {
  const { ctx, me } = frontContext(), npc = actor('앙드레');
  npc.rotation.y = Math.PI / 2; me.position.x = -1.2; me.position.z = 1.3;
  const p = ctx.actorFrontPoint(npc);
  assert.equal(p.x, me.position.x); assert.equal(p.z, me.position.z);
});

test('앉아 있는 NPC는 등 뒤로 가지 않고 옆·앞으로 돌아간다', () => {
  const { ctx, me } = frontContext(), npc = actor('에밀 감독');
  npc.userData.seat = {}; npc.rotation.y = 0; // +z를 보고 앉음
  me.position.z = -6;                          // 바로 등 뒤
  const p = ctx.actorFrontPoint(npc);
  assert(p, '자리를 찾아야 함');
  assert(offFront(npc, p) <= 1.9 + 1e-9, '고개를 돌려 볼 수 있는 범위 안');
});

test('카운터 직원과 다른 유저는 예전처럼 정면으로 다가간다', () => {
  for (const flag of ['counterStaff', 'remote']) {
    const { ctx, me } = frontContext(), t = actor('직원');
    t.userData[flag] = true; t.rotation.y = Math.PI / 2; me.position.x = -6;
    const p = ctx.actorFrontPoint(t);
    assert(Math.abs(p.x - 1.4) < 1e-9 && Math.abs(p.z) < 1e-9, flag + ' 정면');
  }
});

test('내 쪽이 막혀 있으면 갈 수 있는 다른 쪽을 고른다', () => {
  const { ctx, me } = frontContext({ blocked: (x) => x < -0.2 }), npc = actor('앙드레');
  npc.rotation.y = Math.PI / 2; me.position.x = -6;
  const p = ctx.actorFrontPoint(npc);
  assert(p && p.x >= -0.2);
});
