const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function part(a, b) { const start = source.indexOf(a), end = source.indexOf(b, start + a.length); assert(start >= 0 && end > start); return source.slice(start, end); }

function loaderContext(ready = false) {
  const timers = [], frames = [], classes = [], children = [], caption = {}, el = { classList: { add: x => classes.push(x) }, querySelector: () => caption, appendChild: x => children.push(x), remove: () => { el.removed = true; } };
  const ctx = { location: { href: 'https://qa.example/' }, performance: { now: () => ctx.time }, time: 0,
    document: { documentElement: { dataset: ready ? { cinemaReady: 'qa10-reference-20261112' } : {} }, getElementById: () => el, createElement: () => ({}) },
    window: { setTimeout: (fn, ms) => timers.push({ fn, ms }), requestAnimationFrame: fn => frames.push(fn) } };
  vm.createContext(ctx);
  vm.runInContext(part('<script id="cine-loading-reveal">', '</script>').replace('<script id="cine-loading-reveal">', ''), ctx);
  return { ctx, timers, frames, classes, children, caption, el };
}
test('the welcome loader waits for successful initialization and two rendered frames', () => {
  const x = loaderContext(); assert.equal(x.timers[0].ms, 700);
  x.timers.shift().fn(); assert.equal(x.frames.length, 0); assert.equal(x.classes.length, 0);
  x.ctx.document.documentElement.dataset.cinemaReady = 'qa10-reference-20261112';
  x.timers.shift().fn(); assert.equal(x.frames.length, 1);
  x.frames.shift()(); assert.equal(x.classes.length, 0);
  x.frames.shift()(); assert.deepEqual(x.classes, ['cine-loaded']);
  assert.equal(x.el.removed, undefined); x.timers.shift().fn(); assert.equal(x.el.removed, true);
});
test('a startup failure leaves a visible retry link without falsely revealing a working lobby', () => {
  const x = loaderContext(); x.ctx.time = 12001; x.timers.shift().fn();
  assert.match(x.caption.textContent, /불러오지 못했어요/); assert.equal(x.children[0].href, 'https://qa.example/');
  assert.equal(x.children[0].textContent, '다시 불러오기'); assert.deepEqual(x.classes, []); assert.equal(x.frames.length, 0);
});

function sceneContext() {
  const boxes = [], planes = [], images = [], labels = [];
  class Vector { set(x, y, z) { Object.assign(this, { x, y, z }); return this; } setScalar(v) { this.set(v, v, v); } }
  class Node { constructor(geometry, material) { this.geometry = geometry; this.material = material; this.position = new Vector(); this.rotation = new Vector(); this.scale = new Vector(); this.children = []; this.userData = {}; } add(x) { this.children.push(x); } }
  class Material { constructor(options) { Object.assign(this, options); } clone() { return new Material({ ...this }); } }
  class Geometry { constructor(...args) { this.args = args; } }
  const texture = () => ({ repeat: { set() {} }, clone: texture });
  const drawing = new Proxy({}, { get: (o, k) => k in o ? o[k] : k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'fillText' ? text => labels.push(text) : () => {}, set: (o, k, v) => (o[k] = v, true) });
  const ctx = { Math, S: new Node(), LW: 9, WAL: 1, WD: 2, BR: 3, WAL2: 4, BRM_C: 5, TM: {}, MAHO: texture(), WMARB: texture(), BRM: new Material(), glassM: new Material(),
    CFG: { HALLS: [{ id: 1 }] }, nowFilm: () => ({ color: '#9fd8c9' }), setInterval() {}, layBeg: () => [],
    mat: color => new Material({ color }), art: (w, h, fn) => { fn(drawing, w, h); return texture(); }, halo() {}, hitbox() {}, openPanel() {}, CHD: [],
    B: (...a) => { const node = new Node(); boxes.push(a); return node; },
    plane: (...a) => { const node = new Node(); planes.push(a); return node; },
    THREE: { Group: Node, Mesh: Node, MeshPhongMaterial: Material, MeshBasicMaterial: Material, MeshLambertMaterial: Material, PointLight: Node,
      CylinderGeometry: Geometry, CircleGeometry: Geometry, PlaneGeometry: Geometry, SphereGeometry: Geometry, TorusGeometry: Geometry, BoxGeometry: Geometry,
      TextureLoader: class { load(url) { images.push(url); return texture(); } }, DoubleSide: 2, sRGBEncoding: 3001 } };
  vm.createContext(ctx); return { ctx, boxes, planes, images, labels };
}
test('the complete ticket booth initializes with scoped reference geometry and real embedded poster images', () => {
  const x = sceneContext();
  vm.runInContext(part('const _lB=layBeg();', '/* Staff sits behind'), x.ctx);
  assert(x.labels.includes('BILLETS')); assert.equal(x.images.length, 3);
  for (const url of x.images) { assert(url.startsWith('data:image/jpeg;base64,')); const bytes = Buffer.from(url.split(',')[1], 'base64'); assert(bytes.length > 10000); assert.equal(bytes.readUInt16BE(0), 0xffd8); assert.equal(bytes.readUInt16BE(bytes.length - 2), 0xffd9); }
  for (const [, , , , y, z] of x.planes.slice(-3)) {
    assert.equal(y, 3.1); assert(z - .34 > 6.05, 'keep clear of the tall bookshelf');
    assert(z + .34 < 9.65, 'keep clear of the booth and the clock above it');
  }
});
test('the restored ticket facade leaves the counter opening clear and keeps the reachable interaction', () => {
  const x = sceneContext(); vm.runInContext(part('const _lB=layBeg();', '/* Staff sits behind'), x.ctx);
  const faceX = -7.5 + 1.55 + .10;
  assert(!x.boxes.some(([w, h, d, , px]) => px === faceX && h >= 1.9 && d > 3));
  const edgeFrames = x.boxes.filter(([w, h, d, , px]) => px === faceX && h === 2 && d === .13);
  assert.equal(edgeFrames.length, 2); assert(source.includes("pt:{x:cx+r+.7,z:cz,zone:'L0'}"));
});
test('the central chandelier builds all eight opal lamps without referencing later declarations', () => {
  const x = sceneContext(); vm.runInContext(part('/* QA10_REFERENCE_1:', '/* 유백색 유리 볼 펜던트 */'), x.ctx);
  assert.equal(x.ctx.CHD.length, 1); const fixture = x.ctx.CHD[0];
  assert.equal(fixture.position.y, 8.45); assert(fixture.children.length >= 37);
  assert.equal(fixture.children.filter(o => o.material?.color === 0xfff5de).length, 9);
});
test('concession signage contains only current snacks while the separate club cafe retains coffee', () => {
  const shop = part('/* 03 REFRESHMENTS:', 'const stM=');
  assert(shop.includes("c.fillText('BUVETTE'"));
  for (const obsolete of ["['COLA'", "['SODA'", "['COFFEE'", "c.fillText('COFFEE'", 'Popcorn+Soda', '커피 머신: 드립']) assert(!shop.includes(obsolete), obsolete);
  assert(source.includes("cafe:['americano','latte','tea','cake','croi']"));
  assert(source.includes("FLOORT=diamondT(31,'#f2f0e7','#a4af96'"));
});
