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
  let now = 100000; const shown = [], ticks = [];
  const ctx = { performance: { now: () => now }, setInterval: f => { ticks.push(f); return 1; }, ACTOR_SESSION: null, me: {}, curZone: () => 'L0' };
  ctx.window = ctx;
  ctx.say = (c, t) => { shown.push({ who: c.n, t, at: now }); };
  ctx.sayB = (c, t) => { shown.push({ who: c.n, t, at: now }); };
  vm.createContext(ctx);
  const open = '<script id="qa291-queue">';
  vm.runInContext(section(open, '</script>').slice(open.length), ctx);
  const advance = ms => { const end = now + ms; while (now < end) { now = Math.min(end, now + 240); ticks.forEach(f => f()); } };
  return { ctx, shown, advance, t0: now, clock: () => now, npc: n => ({ n, visible: true }) };
}

test('말을 걸면 내 말풍선과 NPC 대답이 기다리지 않고 바로 뜬다', () => {
  const { ctx, shown, advance, t0, npc } = bubbleContext(), me = npc('나'), g = npc('마들렌');
  ctx.sayB(g, '자기소개', 8);            // 누르면 뜨는 자기소개
  advance(480);
  ctx.sayB(me, '반가워요!', 3);          // 말걸기
  advance(900);
  ctx.sayB(g, '대답', 6);                // 0.9초 뒤 대답
  assert.deepEqual(shown.map(x => x.t), ['자기소개', '반가워요!', '대답']);
  assert.equal(shown[1].at - t0, 480);   // 누른 순간
  assert.equal(shown[2].at - shown[1].at, 900); // 예약된 0.9초 그대로 — 대기열 지연 없음
});

test('NPC 혼잣말은 한 번에 하나씩, 간격을 두고 차례로 뜬다', () => {
  const { ctx, shown, advance, t0, npc } = bubbleContext();
  ['a', 'b', 'c'].forEach(n => ctx.sayAmb(npc(n), '혼잣말 ' + n));
  assert.equal(shown.length, 1);
  advance(2400); assert.equal(shown.length, 1);
  advance(480); assert.equal(shown.length, 2);
  advance(2640); assert.equal(shown.length, 3);
  assert.deepEqual(shown.map(x => x.who), ['a', 'b', 'c']);
  assert(shown[1].at - shown[0].at >= 2600 && shown[2].at - shown[1].at >= 2600);
});

test('대화 직후와 대화 중에는 혼잣말이 끼어들지 않고, 너무 늦은 혼잣말은 버린다', () => {
  const { ctx, shown, advance, npc } = bubbleContext(), me = npc('나');
  ctx.say(me, '안녕하세요');
  ctx.sayAmb(npc('a'), '끼어들기');
  assert.equal(shown.length, 1);                 // 직접 대화 직후 2.2초는 대기
  advance(2400); assert.equal(shown.length, 2);
  ctx.ACTOR_SESSION = { target: {} };            // NPC와 대화 메뉴가 열려 있는 동안
  advance(3000);
  ctx.sayBAmb(npc('b'), '대화 중 혼잣말');
  advance(4000); assert.equal(shown.length, 2);
  ctx.ACTOR_SESSION = null; advance(480);
  assert.equal(shown.length, 3);                 // 대화가 끝나면 이어서
  ctx.ACTOR_SESSION = { target: {} };
  ctx.sayAmb(npc('c'), '아주 늦은 혼잣말');
  advance(10000); ctx.ACTOR_SESSION = null; advance(1000);
  assert.equal(shown.length, 3);                 // 9초 넘게 밀린 말은 버림
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
