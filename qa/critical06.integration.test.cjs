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
  return { visible: true, position: { x: 0, y: 0, z: 0, clone() { return { ...this, project() {} }; } }, rotation: { y: 0 }, scale: { y: 1 }, userData: { displayName: name, lvl: 0, path: [{ x: 4, z: 2 }], spot: null, after: null } };
}
function actorContext() {
  const nodes = new Map(), calls = [], me = actor('나'); me.position.z = -20;
  nodes.set('pn', { hidden: true });
  nodes.set('mpchat', { classList: { contains: () => false } });
  const ctx = { Math, me, GIFT_TARGET: null, HELD: [], A: {}, K: { w: 1 }, C: {}, innerWidth: 900, innerHeight: 700,
    $: id => nodes.get(id), esc: x => x, hudUpd() {}, curZone: () => 'L0', zoneOf: () => 'L0', blocked: () => false,
    furnitureRoute: (c, x, z) => [{ x, z }], performance: { now: () => 1000 },
    VSTAFF: {}, toast: text => calls.push(['toast', text]), npcCard: target => calls.push(['talk', target]),
    Multiplayer: { openChat: () => calls.push(['chat']) }, giftMenu: () => calls.push(['gift']),
    openPanel: name => { nodes.get('pn').hidden = false; calls.push(['panel', name]); },
    opanel: name => { nodes.get('pn').hidden = false; calls.push(['purchase', name]); },
    walkTo(c, x, z, zone, opt) { c.userData.path = [{ x, z }]; c.userData.after = opt.after; calls.push(['walk', x, z, zone]); },
    document: { addEventListener() {}, body: { appendChild: el => nodes.set(el.id, el) }, createElement() { return { style: {}, setAttribute(k,v) { this[k]=v; }, remove() { nodes.delete(this.id); } }; } }
  };
  vm.createContext(ctx); vm.runInContext(section('let ACTOR_SESSION=null;', 'function giftMenu()'), ctx);
  function arrive() { const p = me.userData.path.at(-1); me.position.x = p.x; me.position.z = p.z; me.userData.path = []; const f = me.userData.after; me.userData.after = null; f(); }
  return { ctx, me, calls, nodes, arrive };
}

test('a far touch pauses immediately and approaches the facing side before opening a menu', () => {
  const { ctx, me, nodes, arrive } = actorContext(), target = actor(); target.userData.remote = true; target.rotation.y = Math.PI / 2;
  const oldPath = target.userData.path;
  ctx.selectAvatar(target);
  assert.equal(target.userData.interactionPause, true);
  assert.equal(target.userData.path.length, 0);
  assert.equal(ctx.K.w, 0);
  assert.equal(me.userData.path[0].x, 1.4);
  assert(Math.abs(me.userData.path[0].z) < 1e-9);
  assert.equal(nodes.has('actorMenu'), false);
  arrive();
  assert(nodes.get('actorMenu').innerHTML.includes('말걸기'));
  assert(!nodes.get('actorMenu').innerHTML.includes('선물주기'));
  ctx.dismissActor();
  assert.equal(nodes.has('actorMenu'), false);
  assert.equal(target.userData.interactionPause, false);
  assert.deepEqual(Array.from(target.userData.path), oldPath);
});

test('a new selection cancels the previous approach and its stale completion callback', () => {
  const { ctx, me, nodes, arrive } = actorContext(), a = actor('A'), b = actor('B');
  a.userData.remote = b.userData.remote = true;
  ctx.selectAvatar(a); const oldFinish = me.userData.after;
  ctx.selectAvatar(b); oldFinish();
  assert.equal(a.userData.interactionPause, false);
  assert.equal(b.userData.interactionPause, true);
  assert.equal(nodes.has('actorMenu'), false);
  arrive(); assert.equal(nodes.get('actorMenu')['aria-label'], 'B 선택 메뉴'); assert(!nodes.get('actorMenu').innerHTML.includes('<b>'));
});

test('NPC touch introduces the character directly, without a social tooltip', () => {
  const { ctx, calls, nodes, arrive } = actorContext(), target = actor('이자벨');
  ctx.selectAvatar(target); assert.equal(calls.some(x => x[0] === 'talk'), false);
  arrive(); assert(calls.some(x => x[0] === 'talk' && x[1] === target));
  /* QA20: 소개 말풍선과 함께 하단 컨텍스트 액션 바(글자 칩)를 띄움 */
  assert(nodes.get('actorMenu').innerHTML.includes('말걸기')); assert(!nodes.get('actorMenu').innerHTML.includes('<svg'));
});

test('the flower seller and Alfredo use the same immediate pause and approach', () => {
  for (const [flag, action, panel] of [['trayVendor', 'purchase', 'vendor'], ['buff', 'panel', 'quiz']]) {
    const { ctx, calls, arrive } = actorContext(), target = actor(); target.userData[flag] = true;
    ctx.selectAvatar(target);
    assert.equal(target.userData.interactionPause, true);
    assert(!calls.some(c => c[0] === action));
    arrive(); assert(!calls.some(c => c[0] === action)); /* QA20: 도착하면 액션 칩(꽃 사기·퀴즈 풀기)을 먼저 보여줌 */
    ctx.actorUse(); assert(calls.some(c => c[0] === action && c[1] === panel));
  }
});

test('gift menu depends on held inventory and talking opens the existing chat', () => {
  const { ctx, nodes, calls, arrive } = actorContext(), target = actor(); target.userData.remote = true;
  ctx.HELD.push({ k: 'rose1' }); ctx.selectAvatar(target); arrive();
  assert(nodes.get('actorMenu').innerHTML.includes('선물하기'));
  ctx.actorTalk();
  assert.equal(nodes.has('actorMenu'), false);
  assert(calls.some(c => c[0] === 'chat'));
  assert(!calls.some(c => c[0] === 'talk'));
});

test('blocked approach and disappearing target release pause and selection', () => {
  const { ctx, me, nodes } = actorContext(), target = actor(); ctx.blocked = () => true;
  ctx.selectAvatar(target); assert.equal(target.userData.interactionPause, false);
  ctx.blocked = () => false; ctx.selectAvatar(target); const finish = me.userData.after;
  target.visible = false; ctx.actorMenuTick(); finish();
  assert.equal(nodes.has('actorMenu'), false);
  assert.equal(target.userData.interactionPause, false);
});

test('a selected NPC cannot advance its route or restart autonomous wandering', () => {
  const ctx = { idlePose() {}, clearNpcFromBoard() { throw Error('paused actor advanced'); } };
  vm.createContext(ctx); vm.runInContext(section('function upd(c,dt,t)', 'let seatCamera='), ctx);
  const c = actor(); c.userData.interactionPause = true; c.children = [{}];
  ctx.upd(c, .1, 5); assert.equal(c.position.x, 0);
});

test('ordinary movement preserves camera heading, while a space transition aligns once', () => {
  const ctx = { Math, SPEED: 2, idlePose() {}, move(c, x, z) { c.position.x = x; c.position.z = z; return true; }, releaseSeatCamera() {}, curZone: () => 'L0' };
  vm.createContext(ctx);
  vm.runInContext('let camYaw=.75,camYawS=.75,camPitch=.3,camPitchT=.3,yawV=0,snapCam=false;' + section('function qaManualMove(', '/* ---------- loop ---------- */') + section('function alignSpaceCamera(', 'const PTR='), ctx);
  const c = actor(); for (let i = 0; i < 60; i++) ctx.qaManualMove(c, 1, 0, 1 / 60);
  assert.equal(vm.runInContext('camYaw', ctx), .75);
  ctx.alignSpaceCamera(c); assert.equal(vm.runInContext('camYaw', ctx), c.rotation.y);
  assert.equal(vm.runInContext('yawV', ctx), 0);
  assert(!source.includes('const mv=K.w'));
  assert(!source.includes('상영관 입장 시점 고정:'));
  assert(source.includes('window.__lzn!==zn&&!s)alignSpaceCamera(me)'));
});

test('interaction routing goes around a table and every segment stays outside furniture', () => {
  const ctx = { Math, bounds: () => [-6, 6, -6, 6], zoneOf: () => 'L0', blocked: (x, z) => x > -1 && x < 1 && z > -1.5 && z < 1.5 };
  vm.createContext(ctx); vm.runInContext(section('function furnitureRoute(', 'function walkTo('), ctx);
  const c = actor(); c.position.x = -4; const path = ctx.furnitureRoute(c, 4, 0, 'L0');
  assert(path && path.length > 1); let previous = c.position;
  for (const point of path) { for (let k = 1; k <= 100; k++) assert(!ctx.blocked(previous.x + (point.x - previous.x) * k / 100, previous.z + (point.z - previous.z) * k / 100)); previous = point; }
  assert.equal(path.at(-1).x, 4); assert.equal(path.at(-1).z, 0);
});

test('an unreachable interaction returns no route instead of walking through a wall', () => {
  const ctx = { Math, bounds: () => [-3, 3, -3, 3], zoneOf: () => 'L0', blocked: (x, z) => Math.abs(x) < .5 };
  vm.createContext(ctx); vm.runInContext(section('function furnitureRoute(', 'function walkTo('), ctx);
  const c = actor(); c.position.x = -2; assert.equal(ctx.furnitureRoute(c, 2, 0, 'L0'), null);
});

function doorContext() {
  let invitation = false, entered = 0;
  const ctx = { Math, CinemaAudio: { effect() {} }, INTER: [], OBS: null, LW: 10, LD: 20,
    hasInv: () => invitation, toast() {}, clubEnter: () => entered++,
    SHELF: { g: { position: { z: 6 } }, sl: { position: { x: 0 } }, SL: 2.75, hb: { position: { z: 6 }, userData: { act: { pt: {} } } } },
    TRAP: { position: {}, userData: { hb: { position: {}, userData: { act: { pt: {} } } }, leaf: { rotation: { y: 0 } }, hl: { material: { opacity: 0 } } } }
  }; ctx.window = { SHELF: ctx.SHELF }; vm.createContext(ctx);
  vm.runInContext(section('var DOOR_T=', '/* 지하 영화클럽 아지트 */'), ctx);
  return { ctx, invite: value => invitation = value, entered: () => entered };
}

test('touching the shelf slides it away and leaves the revealed club door closed without an invitation', () => {
  const { ctx, entered } = doorContext();
  assert.equal(ctx.TRAP.visible, false); ctx.trapShow(true);
  for (let i = 0; i < 25; i++) ctx.doorTick(.1);
  assert.equal(ctx.TRAP.visible, true);
  assert.equal(ctx.SHELF.sl.position.x, -2.75);
  assert.equal(Math.abs(ctx.TRAP.userData.leaf.rotation.y), 0);
  assert(ctx.INTER.includes(ctx.TRAP.userData.hb));
  assert(!ctx.INTER.includes(ctx.SHELF.hb));
  ctx.openClubDoor(); ctx.doorTick(2); assert.equal(entered(), 0);
  assert(!source.includes("openPanel('mags')"));
  assert(!source.includes('PANELS.mags='));
});

test('an invitation permits door animation and entry only after the animation completes', () => {
  const { ctx, invite, entered } = doorContext(); ctx.trapShow(true); invite(true); ctx.openClubDoor();
  ctx.doorTick(.5); assert.equal(entered(), 0); assert(ctx.TRAP.userData.leaf.rotation.y < 0);
  ctx.doorTick(.8); assert.equal(entered(), 1);
});

test('a missing or revoked invitation cannot enter through either door action', () => {
  const { ctx, invite, entered } = doorContext(); const notices = []; ctx.me = actor();
  Object.assign(ctx, { closePanel() {}, curZone: () => 'L0', notice: (...args) => notices.push(args), walkTo() { throw Error('unauthorized walk'); } });
  const action = vm.runInContext('({' + section(' godown:', '\n clubstop:') + '}).godown', ctx);
  action(); assert(notices[0][1].includes('초대장이 있어야'));
  invite(true); ctx.openClubDoor(); invite(false); ctx.doorTick(2);
  assert.equal(entered(), 0); assert.equal(Math.abs(ctx.TRAP.userData.leaf.rotation.y), 0);
});

function quizContext(values = new Map()) {
  const ctx = { Date, Math, store: { get: k => values.get(k), set: (k, v) => values.set(k, v) } };
  vm.createContext(ctx); vm.runInContext(section('const QUIZ=[', 'const hasInv='), ctx);
  return { ctx, values };
}
test('quiz attempts are high, medium, then always low, including after reload', () => {
  const { ctx, values } = quizContext();
  for (const level of ['high', 'medium', 'low', 'low', 'low']) assert.equal(ctx.nextQuiz().level, level);
  const fresh = quizContext(values); const round = fresh.ctx.nextQuiz();
  assert.equal(round.level, 'low'); assert.equal(round.attempt, 6);
  assert.equal(vm.runInContext('todayQ()', fresh.ctx), round.q);
});

test('a wrong answer provides a direct retry and stale right-answer timers cannot open an invitation', () => {
  const { ctx } = quizContext(), tasks = [], calls = [], buttons = [{ classList: { add() {} } }, { classList: { add() {} } }];
  const pn = { hidden: false, dataset: { k: 'quiz' }, querySelector: () => ({ insertAdjacentHTML: (...args) => calls.push(args) }) };
  Object.assign(ctx, { A: {}, BUFF: null, document: { querySelectorAll: () => buttons }, $: () => pn, toast() {}, sayB() {}, setTimeout: f => tasks.push(f), openPanel: k => calls.push(k) });
  vm.runInContext('Object.assign(A,{' + section(' quizans:d=>', '\n invaccept:') + '});', ctx);
  let round = ctx.nextQuiz(); ctx.A.quizans({ i: (round.q[2] + 1) % 4 });
  assert(calls.some(x => Array.isArray(x) && x[1].includes('quizretry')));
  ctx.A.quizretry(); assert(calls.includes('quiz'));
  round = ctx.nextQuiz(); ctx.A.quizans({ i: round.q[2] }); ctx.nextQuiz(); tasks[0]();
  assert(!calls.includes('invite'));
});

function adminContext(values = new Map()) {
  const calls = [], input = { value: 'wrong', focus() {} };
  const ctx = { store: { get: k => values.get(k), set: (k, v) => values.set(k, v) }, $: () => input, admInit: () => calls.push('init'), PANELS: { adm: () => calls.push('admin'), tt: () => calls.push('schedule') }, panel: () => calls.push('password'), toast() {}, setTimeout() {}, window: { CinemaCloud: { clearSecret: () => calls.push('clearSecret') } } };
  vm.createContext(ctx);
  vm.runInContext(section('const ADMIN_SESSION_KEY=', '\n') + section('PANELS.admlogin=()', '\n'), ctx);
  const login = vm.runInContext('({' + section(' admlogin:()=>', '\n adout:') + '}).admlogin', ctx);
  const logoutSource = source.split('\n').find(x => x.includes('adout:()=>'));
  const logout = vm.runInContext('({' + logoutSource + '}).adout', ctx);
  return { ctx, values, calls, input, login, logout };
}
test('admin authentication survives refresh and clock access, without saving the password', () => {
  const { ctx, input, login, values } = adminContext(); login(); assert.equal(values.size, 0);
  input.value = vm.runInContext('ADMPW', ctx); login();
  assert.deepEqual([...values.values()], [true]);
  const fresh = adminContext(values); fresh.ctx.PANELS.admlogin();
  assert(fresh.calls.includes('admin')); assert(!fresh.calls.includes('password'));
  fresh.logout(); assert(fresh.calls.includes('clearSecret'));
  const loggedOut = adminContext(values); loggedOut.ctx.PANELS.admlogin(); assert(loggedOut.calls.includes('password'));
});

test('flower purchase provides the Alfredo clue and remote gifts consume items only after the receiver confirms', () => {
  assert.equal(source.split('알프레도 할아버지와 대화하면 비밀 클럽에 대한 정보를 얻을 수 있어요.').length - 1, 2);
  const calls = [], toasts = [], rose = { k: 'rose1', _giving: 2 };
  const target = { visible: true, position: { x: 1, z: 0 }, rotation: { y: 0 }, userData: { remote: true, peerId: 'p2' } };
  const ctx = { GIFT_TARGET: target, HELD: [rose], me: { position: { x: 0, z: 0 }, rotation: { y: 0 }, userData: {} }, IT: { rose1: ['', '장미 한 송이'] }, Math, performance: { now: () => 0 },
    closePanel() {}, toast: m => toasts.push(m), curZone: () => 'L0', refreshMe() {}, rainbowTick() {}, hudUpd() {}, objectParticle: () => '를', EAT: null, SLOW: null,
    window: { qa15GiftToPeer: (peer, key, done) => calls.push({ peer, key, done }) } };
  vm.createContext(ctx); vm.runInContext(section('function giveItem(index)', 'function giftTick('), ctx);
  ctx.giveItem(0); assert.equal(ctx.HELD.length, 1); assert.equal(calls.length, 1); assert.equal(calls[0].peer, 'p2'); assert.equal(calls[0].key, 'rose1');
  calls[0].done(false, 'timeout'); assert.equal(ctx.HELD.length, 1);
  ctx.GIFT_TARGET = target; rose._giving = 2; ctx.giveItem(0); calls[1].done(true, ''); assert.equal(ctx.HELD.length, 0); assert(toasts.at(-1).includes('건넸어요'));
});
