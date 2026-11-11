const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(process.argv[2] || path.join(__dirname, '../index.html'), 'utf8');

function segment(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing source section: ${start}`);
  return source.slice(a, b);
}

function chatContext() {
  const nodes = new Map(), properties = new Map(), styles = [];
  const doc = { activeElement: null, documentElement: { style: { setProperty: (k, v) => properties.set(k, v) } } };
  class Element {
    constructor() {
      this.listeners = new Map(); this.value = ''; this.children = []; this.style = {}; this.dataset = {};
      const classes = new Set();
      this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) };
    }
    set id(value) { this._id = value; nodes.set(value, this); }
    get id() { return this._id; }
    set innerHTML(value) { for (const match of value.matchAll(/id="([^"]+)"/g)) { const child = new Element(); child.id = match[1]; this.children.push(child); } }
    setAttribute() {}
    appendChild(child) { this.children.push(child); if (child.textContent) styles.push(child.textContent); }
    addEventListener(type, callback) { this.listeners.set(type, [...(this.listeners.get(type) || []), callback]); }
    dispatch(type) { for (const callback of this.listeners.get(type) || []) callback({ target: this, preventDefault() {}, stopPropagation() {} }); }
    focus() { doc.activeElement = this; this.dispatch('focus'); }
    blur() { if (doc.activeElement === this) doc.activeElement = null; this.dispatch('blur'); }
    contains(el) { return el === this || this.children.includes(el); }
  }
  Object.assign(doc, { head: new Element(), body: new Element(), createElement: () => new Element(), getElementById: id => nodes.get(id), addEventListener() {} });
  const legacy = new Element(); legacy.id = 'msg';
  const ctx = { document: doc, window: { innerHeight: 800, visualViewport: { height: 450, offsetTop: 0 } }, $: id => nodes.get(id), els: {}, CinemaAudio: { updateButton() {}, setMuted() {} }, K: { w: 1 }, endpoint: () => '', Math };
  vm.createContext(ctx);
  vm.runInContext(segment('function qaKeyboardInset()', 'if(window.visualViewport)') + segment('function makeUI(){', 'function setStatus('), ctx);
  ctx.makeUI();
  return { ctx, nodes, properties, styles };
}

test('the rendered chat input moves with the keyboard, clears held movement and resets on X', () => {
  const { ctx, nodes, properties, styles } = chatContext();
  nodes.get('mpinput').focus();
  assert.equal(properties.get('--qa-keyboard-offset'), '350px');
  assert.equal(ctx.K.w, 0);
  const rules = styles.join('\n').match(/#mpchat\{[^}]*bottom:[^}]*\}/g);
  assert.equal(rules.length, 2);
  for (const rule of rules) assert(rule.includes('var(--qa-keyboard-offset,0px)'));
  nodes.get('mpinput').value = 'draft';
  nodes.get('mpclose').dispatch('click');
  assert.equal(properties.get('--qa-keyboard-offset'), '0px');
  assert.equal(nodes.get('mpinput').value, '');
});

function customer() {
  return { position: { x: 0, y: 0, z: 8 }, rotation: { y: 0 }, userData: { path: [{ x: 3, z: 8 }], after() {}, spot: null } };
}

function flowerContext() {
  const me = customer(), vendor = customer(), panel = { hidden: false }, messages = [];
  vendor.position.x = 1.6; vendor.position.z = 9;
  let resolveAd, rejectAd;
  const ad = new Promise((resolve, reject) => { resolveAd = resolve; rejectAd = reject; });
  const ctx = {
    Math, me, K: { w: 1 }, ORD: { v: 'vendor', q: { rose1: 1 } }, VSTAFF: { vendor },
    VENDS: [{ v: vendor, dir: 1, cx: 1.6, z0: 8.6, z1: 15.4, hb: { userData: { act: { pt: {} } } } }],
    HELD: [], VEN: { vendor: { name: '꽃가게' } }, IT: { rose1: ['rose', '장미 한 송이'] }, A: {},
    AdService: { show: () => ad }, closePanel: () => { panel.hidden = true; },
    curZone: () => 'L0', $: () => panel, performance: { now: () => 1000 }, space: 0, targetY: () => 0,
    idlePose() {}, walkPose() {}, say() {}, sayB() {}, notice() {}, hudUpd() {}, refreshMe() {}, objectParticle: () => '를',
    toast: text => messages.push(text), SPEED: 2,
    move(c, x, z) { c.position.x = x; c.position.z = z; return true; }
  };
  vm.createContext(ctx);
  const start = source.indexOf(' obuy:async()=>{') + ' obuy:'.length;
  const end = source.indexOf('\n oad:', start);
  assert(start >= ' obuy:'.length && end > start);
  const buy = source.slice(start, end).trim().replace(/,$/, '');
  ctx.buy = vm.runInContext('(' + buy + ')', ctx);
  vm.runInContext(segment('function vendTick(dt)', 'var DOOR_T=') + segment('function qaManualMove(', '/* ---------- loop ---------- */'), ctx);
  return { ctx, me, vendor, resolveAd, rejectAd, messages };
}

test('the seller and customer stay still while the ad hides the purchase panel, then resume', async () => {
  const { ctx, me, vendor, resolveAd } = flowerContext();
  const originalPath = me.userData.path, originalAfter = me.userData.after;
  const pending = ctx.buy();
  assert.equal(me.userData.flowerPurchase, true);
  assert.equal(vendor.userData.flowerPurchase, true);
  const before = { x: vendor.position.x, z: vendor.position.z };
  ctx.vendTick(.5);
  ctx.qaManualMove(me, 1, 0, .1);
  assert.deepEqual({ x: vendor.position.x, z: vendor.position.z }, before);
  assert.equal(me.position.x, 0);
  resolveAd(true); await pending;
  assert.equal(me.userData.flowerPurchase, false);
  assert.equal(vendor.userData.flowerPurchase, false);
  assert.deepEqual(Array.from(me.userData.path), originalPath);
  assert.equal(me.userData.after, originalAfter);
  assert.equal(ctx.HELD.length, 1);
  ctx.vendTick(.5);
  assert.notEqual(vendor.position.z, before.z);
});

test('a rejected ad releases both movement locks without giving a flower', async () => {
  const { ctx, me, vendor, rejectAd, messages } = flowerContext();
  const pending = ctx.buy(); rejectAd(new Error('offline')); await pending;
  assert.equal(me.userData.flowerPurchase, false);
  assert.equal(vendor.userData.flowerPurchase, false);
  assert.equal(me.userData.path.length, 1);
  assert.equal(ctx.HELD.length, 0);
  assert(messages.some(s => s.includes('불러오지 못했어요')));
});

function movementContext() {
  const ctx = { Math, SPEED: 2, idlePose() {}, move(c, x, z) { c.position.x = x; c.position.z = z; return true; } };
  vm.createContext(ctx); vm.runInContext(segment('function qaManualMove(', '/* ---------- loop ---------- */'), ctx);
  return ctx;
}

test('keyboard movement accelerates and brakes gradually rather than jumping or snapping', () => {
  const ctx = movementContext(), c = customer(), dt = 1 / 60;
  ctx.qaManualMove(c, 1, 0, dt);
  const first = c.position.x;
  assert(first > 0 && first < ctx.SPEED * dt);
  assert(c.rotation.y > 0 && c.rotation.y < Math.PI / 2);
  for (let i = 0; i < 40; i++) ctx.qaManualMove(c, 1, 0, dt);
  const fullSpeed = c.userData.manualVX, x = c.position.x;
  ctx.qaManualMove(c, 0, 0, dt);
  assert(c.position.x > x);
  assert(c.userData.manualVX > 0 && c.userData.manualVX < fullSpeed);
  for (let i = 0; i < 60; i++) ctx.qaManualMove(c, 0, 0, dt);
  assert.equal(c.userData.manualVX, 0);
  assert.equal(c.userData.manualDrift, false);
});

test('braking yields to a new tap path and collision cannot leave residual motion', () => {
  const ctx = movementContext(), c = customer();
  ctx.qaManualMove(c, 1, 0, .05);
  const route = [{ x: 5, z: 8 }]; c.userData.path = route;
  const x = c.position.x;
  ctx.qaManualMove(c, 0, 0, .05);
  assert.equal(c.position.x, x); assert.equal(c.userData.path, route);
  ctx.move = () => false;
  ctx.qaManualMove(c, 1, 0, .05);
  assert.equal(c.position.x, x); assert.equal(c.userData.manualVX, 0);
});
