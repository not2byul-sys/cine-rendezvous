const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const nav = fs.readFileSync(path.join(__dirname, '../qa11-navigation.js'), 'utf8');
const winter = fs.readFileSync(path.join(__dirname, '../qa11-winter.js'), 'utf8');
function part(a, b) { const i = source.indexOf(a), j = source.indexOf(b, i + a.length); assert(i >= 0 && j > i, a); return source.slice(i, j); }
function navContext(walls = [], limits = [-8, 8, -8, 8]) {
  const ctx = { Math, Map, Set, OBS: walls, obsBuild() { ctx.OBS = walls; }, bounds: () => limits,
    zoneOf: (x, z) => x >= limits[0] && x <= limits[1] && z >= limits[2] && z <= limits[3] ? 'L0' : null,
    curZone: () => 'L0', blocked(x, z, level) { return ctx.OBS.some(r => r[4] === level && x > r[0] && x < r[1] && z > r[2] && z < r[3]); } };
  vm.createContext(ctx); vm.runInContext(nav, ctx); return ctx;
}
function avatar(x, z) { return { position: { x, z }, userData: { lvl: 0 } }; }
function verifyPath(start, route, walls) {
  assert(route?.length); let a = start;
  for (const b of route) { const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / .025)); for (let k = 1; k <= n; k++) {
    const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n;
    assert(!walls.some(r => x > r[0] + 1e-5 && x < r[1] - 1e-5 && z > r[2] + 1e-5 && z < r[3] - 1e-5), `crossed furniture at ${x}, ${z}`);
  } a = b; }
}

test('all new scripts parse and ready is set after the added dependencies initialize', () => {
  new vm.Script(nav); new vm.Script(winter);
  assert(!source.includes("dataset.cinemaReady='qa11-winter-layout-20261112'"));
  assert(source.indexOf('src="qa11-navigation.js"') < source.indexOf('src="qa11-winter.js"'));
  assert(winter.indexOf('qa11ChristmasDisplay();') < winter.indexOf('dataset.cinemaReady='));
});
test('furniture routing goes around multiple obstacles and reaches the requested point', () => {
  const walls = [[-1.1, 1.1, -2.8, 1.8, 0], [-4, -2.7, 1, 4, 0], [2.7, 4, -4, 0, 0]], ctx = navContext(walls), c = avatar(-5, 5);
  const route = ctx.qa11Route(c, 5, -5, 'L0'); verifyPath(c.position, route, walls);
  assert.equal(route.at(-1).x, 5); assert.equal(route.at(-1).z, -5); assert(route.length > 1);
});
test('standing inside chair safety padding can escape without crossing the physical chair', () => {
  const walls = [[-.26, 1.26, -.26, 1.26, 0, [0, 1, 0, 1]]], ctx = navContext(walls), c = avatar(1.05, .5);
  const route = ctx.qa11Route(c, 3, .5, 'L0'); verifyPath(c.position, route, [[0, 1, 0, 1]]);
  assert(route[0].x >= 1.26); assert.equal(route.at(-1).x, 3);
  assert.equal(ctx.qa11Route(avatar(.5, .5), 3, .5, 'L0'), null);
});
test('a narrow open gap falls back to a finer route without cutting its corners', () => {
  const walls = [[-2, -.06, -.1, .1, 0], [.06, 2, -.1, .1, 0]], ctx = navContext(walls, [-2, 2, -2, 2]), c = avatar(.13, 1);
  const route = ctx.qa11Route(c, .13, -1, 'L0'); verifyPath(c.position, route, walls);
  assert(route.some(p => Math.abs(p.x) < .06));
});
test('tapping an occupied point resolves to a reachable nearby edge', () => {
  const walls = [[-1, 1, -1, 1, 0]], ctx = navContext(walls), c = avatar(-4, 0);
  assert.equal(ctx.qa11Route(c, 0, 0, 'L0'), null);
  const route = ctx.qa11Destination(c, 0, 0, 'L0', true); verifyPath(c.position, route, walls);
  assert(Math.hypot(route.at(-1).x, route.at(-1).z) < 1.6);
});
test('an actually sealed destination remains unreachable and never gains a teleport path', () => {
  const walls = [[-.7, .7, -4, 4, 0]], ctx = navContext(walls, [-3, 3, -3, 3]);
  assert.equal(ctx.qa11Route(avatar(-2, 0), 2, 0, 'L0'), null);
});
test('ordinary floor movement uses the same obstacle route as interactions', () => {
  const walls = [[-1, 1, -2, 2, 0]], ctx = navContext(walls), c = avatar(-4, 0);
  Object.assign(ctx, { me: c, HZ: {}, releaseSeatCamera() {}, inStair: () => false, route: () => [{ x: 4, z: 0 }] });
  vm.runInContext(part('function walkTo(c,', 'function walkToSpot('), ctx);
  ctx.walkTo(c, 4, 0, 'L0'); verifyPath(c.position, c.userData.path, walls);
  assert(c.userData.path.length > 1); assert.equal(c.userData.navRequest.x, 4);
});
test('an interrupted move replans around a new obstacle and retries remain bounded', () => {
  const walls = [[-1, 1, -2, 2, 0]], ctx = navContext(walls), c = avatar(-4, 0);
  c.userData.navRequest = { x: 4, z: 0, zone: 'L0', nearest: true, retries: 0 };
  assert(ctx.qa11Retry(c)); verifyPath(c.position, c.userData.path, walls);
  c.userData.navRequest.retries = 3; assert.equal(ctx.qa11Retry(c), false);
});
test('standing up exits the chair sideways instead of stepping into its table', () => {
  const walls = [[-.5,.5,-.4,.4,0,[-.3,.3,-.2,.2]],[-.6,.6,.45,1.6,0]], ctx=navContext(walls), c=avatar(0, .9);
  assert(ctx.qa11SeatExit(c,{x:0,z:0,rot:0,zone:'L0'}));
  assert(Math.abs(c.position.x)>=.8); assert(!ctx.blocked(c.position.x,c.position.z,0));
  verifyPath(c.position,ctx.qa11Route(c,3,3,'L0'),walls);
  assert(!part('function standUp(', 'const LINES=').includes('u.path=[{x:sp.x'));
});
test('leaving a chair cannot pass through a surrounding solid enclosure', () => {
  const walls=[[-.4,.4,-.4,.4,0],[-2,2,.45,.7,0],[-2,2,-.7,-.45,0],[.45,.7,-2,2,0],[-.7,-.45,-2,2,0]],ctx=navContext(walls),c=avatar(0,0);
  assert.equal(ctx.qa11SeatExit(c,{x:0,z:0,rot:0,zone:'L0'}),false);
  assert.equal(c.position.x,0);assert.equal(c.position.z,0);
});

function sceneContext() {
  class Vec { constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); } set(x, y, z) { Object.assign(this, { x, y, z }); return this; } copy(p) { return this.set(p.x, p.y, p.z); } clone() { return new Vec(this.x, this.y, this.z); } }
  class Quaternion { constructor() { this.angle = 0; } setFromAxisAngle(axis, angle) { this.angle = angle; return this; } premultiply(q) { this.angle += q.angle; return this; } }
  class Node { constructor(geometry, material) { this.geometry = geometry; this.material = material; this.position = new Vec(); this.rotation = new Vec(); this.quaternion = new Quaternion(); this.scale = { set() {}, y: 1 }; this.children = []; this.userData = {}; } add(o) { this.children.push(o); } clone() { const n = new Node(this.geometry, this.material); n.position.copy(this.position); return n; } }
  class Geometry { constructor(...args) { this.args = args; } }
  class Material { constructor(p) { Object.assign(this, p); } }
  const ctx = { Math, Set, OBS: null, X: 500, Z: 0, BCX: 500, CBW: 9, CBD: 7.5, LD: 20, S: new Node(), INTER: [], chosen: [],
    mat: c => new Material({ color: c }), WD: 2, WD2: 3, BR: 4, CLUBFILMS: Array.from({ length: 13 }, (_, i) => ({ title: '영화 ' + i })),
    art: () => ({}), clubPick: i => ctx.chosen.push(i),
    THREE: { Quaternion, Vector3: Vec, Mesh: Node, Group: Node, MeshLambertMaterial: Material, MeshBasicMaterial: Material, CylinderGeometry: Geometry, CircleGeometry: Geometry, BoxGeometry: Geometry, SphereGeometry: Geometry },
    bb(w, h, d, color, x, y, z) { const n = new Node(new Geometry(w, h, d), color); n.position.set(ctx.X + x, y, ctx.Z + z); ctx.S.add(n); return n; } };
  vm.createContext(ctx); vm.runInContext(part('function relocateClubPieces(', '/* 지하 영화클럽 아지트 */'), ctx); return ctx;
}
test('all 13 film hitboxes and approach targets move to the left of the screen together', () => {
  const ctx = sceneContext(); vm.runInContext(part('const filmCornerMark=', '/* 한줄평 보드(11/9 리디자인):'), ctx);
  assert.equal(ctx.INTER.length, 13);
  ctx.INTER.forEach((hit, i) => { assert(hit.position.x > 492 && hit.position.x < 496); assert(hit.position.z < -6.9); assert(Math.abs(hit.userData.act.pt.z + 5.92) < .001); hit.userData.act.fn(); assert.equal(ctx.chosen[i], i); });
});
test('a shared cafe approach target moves exactly once even if two hitboxes reference it', () => {
  const ctx = sceneContext(), point = { x: 494, z: -5.4 }, a = { userData: { act: { pt: point } } }, b = { userData: { act: { pt: point } } };
  ctx.INTER.push(a, b); ctx.relocateClubPieces([0, 0], { x: 494, z: -6.4 }, { x: 492.1, z: 1.6 }, Math.PI / 2);
  assert(Math.abs(point.x - 493.1) < .001); assert(Math.abs(point.z - 1.6) < .001);
});
test('the ticket side table registers two facing usable seats in the same layout item', () => {
  const seats = [], items = [], ctx = sceneContext();
  Object.assign(ctx, { layBeg: () => [], layEnd: (...x) => items.push(x), bentwoodChair: (...x) => seats.push(x), B() {}, wallTex() {}, hitbox() {}, plane: () => ({ rotation: {} }) });
  vm.runInContext(part('/* QA11: a leaflet table beside', '/* 발코니 카페 테이블 */'), ctx);
  assert.equal(seats.length, 2); assert(seats[0][1] < 16.6 && seats[1][1] > 16.6); assert.equal(seats[0][2], 0); assert.equal(seats[1][2], Math.PI);
  assert.equal(items[0][1], 'ticket-side-table'); assert(seats.every(p => p[1] > 13.3));
});
test('long NPC speech keeps every character across wrapped lines with no generated ellipsis', () => {
  const printed = [], drawing = { measureText: s => ({ width: Array.from(s).length * 24 }), beginPath() {}, roundRect() {}, fill() {}, fillText: t => printed.push(t) },
    ctx = { Math, document: { createElement: () => ({ getContext: () => drawing }) }, THREE: { CanvasTexture: class {}, SpriteMaterial: class {}, Sprite: class { constructor() { this.scale = { set() {} }; } } } };
  vm.createContext(ctx); vm.runInContext(part('function bubble(t)', 'function sayB('), ctx);
  const text = '안녕하세요. 저는 영화관에서 여러분을 기다리고 있었어요. 이 긴 자기소개는 끝까지 보이며 마침표까지 모두 남아 있어야 합니다.';
  ctx.bubble(text); assert.equal(printed.join(''), text); assert(printed.length > 2); assert(!printed.join('').includes('…'));
});
test('winter snow ground stays outside the lobby boundary', () => {
  const ctx = sceneContext(); vm.runInContext(winter.slice(winter.indexOf('function qa11WinterStreet()'), winter.indexOf('window.NYOVR=')), ctx);
  ctx.qa11WinterStreet(); assert.equal(ctx.S.children.length, 35);
  assert(ctx.S.children.every(o => o.position.z > ctx.LD + .3));
});
test('carol playback schedules a bounded original phrase and resumes without a background backlog', () => {
  const ctx = { Math }; vm.createContext(ctx); vm.runInContext(winter.slice(0, winter.indexOf('function qa11ChristmasDisplay()')), ctx);
  const notes = [], bells = [], player = { ctx: { currentTime: 0 }, t: .1, bar: 0, note: (...v) => notes.push(v), bell: (...v) => bells.push(v), ride() {} };
  ctx.qa11CarolSchedule.call(player); assert.equal(player.bar, 1); assert.equal(bells.length, 6); assert(notes.every(n => n[1] >= 0 && n[2] > .35));
  player.ctx.currentTime = 3600; ctx.qa11CarolSchedule.call(player); assert(player.bar < 4); assert(player.t > 3600);
});
