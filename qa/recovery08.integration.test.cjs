const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function part(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing section: ${start}`);
  return source.slice(a, b);
}
function avatar(name = '관객') { return { visible: true, userData: { displayName: name, lvl: 0, path: [] }, position: { x: 0, z: -4 }, rotation: { y: 0 } }; }

test('startup registers action handlers after A exists, preventing the reverted QA07 TDZ', () => {
  assert(source.indexOf('const A={') < source.indexOf('Object.assign(A,'));
  assert(source.indexOf('const CinemaAudio=') < source.indexOf("function beep()"));
  assert(!source.includes('Object.assign(A,{lobmute:'));
  for (const script of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (script[1].trim()) new vm.Script(script[1]);
});

function lookContext() {
  const ctx = { SK: { lt: 1, md: 2, tn: 3, dk: 4 }, Math };
  vm.createContext(ctx);
  vm.runInContext(part('const hash=s=>', 'const isAud=') + part('const USER_LOOK50=', 'function enterNow(nm)'), ctx);
  return ctx;
}
test('50 complete looks remain distinct and the same nickname is stable across independent clients', () => {
  const a = lookContext(), b = lookContext();
  assert.equal(vm.runInContext('new Set(USER_LOOK50.map(x=>JSON.stringify(x))).size', a), 50);
  const names = ['현기증', '멋진 인생', '대부', '하나 그리고 둘'];
  const looks = names.map(name => JSON.stringify(a.qaUserLook(name)));
  assert.equal(new Set(looks).size, names.length);
  names.forEach((name, i) => assert.equal(JSON.stringify(b.qaUserLook(name)), looks[i]));
  assert.equal(JSON.stringify(a.qaUserLook('  멋진   인생 ')), JSON.stringify(a.qaUserLook('멋진 인생')));
  assert.equal(JSON.stringify(a.qaUserLook('현기증'.normalize('NFD'))), JSON.stringify(a.qaUserLook('현기증')));
});

test('self and peer builders receive matching full appearance without the shared ME preset', () => {
  const ctx = lookContext(), built = [], nodes = new Map([['nsave', { checked: false }], ['join', {}]]);
  function vector() { return { x: 0, y: 0, z: 0, set(x, y, z) { Object.assign(this, { x, y, z }); }, copy(p) { Object.assign(this, { x: p.x, y: p.y, z: p.z }); } }; }
  Object.assign(ctx, { window: {}, VISITS: 1, readSharedClubNote: () => null, localStorage: { setItem() {}, removeItem() {} }, $: id => nodes.get(id),
    mk(name, color, options) { const c = { userData: {}, position: vector(), rotation: { y: 0 } }; built.push({ name, color, options, c }); return c; },
    spw: () => ({ x: 0, z: 10, r: Math.PI }), updChip() {}, Multiplayer: { start() {} }, myId: 'self', peers: new Map(), AVATAR_HITS: [], THREE: { Vector3: class { constructor() { Object.assign(this, vector()); } } } });
  vm.runInContext(part('function enterNow(nm)', '/* 랜덤:') + part('function upsert(data)', 'function connect()'), ctx);
  ctx.enterNow('현기증'); ctx.upsert({ id: 'peer', name: '현기증', x: 1, y: 0, z: 10, r: 0, zone: 'L0' });
  const clean = value => { const { me, ...rest } = value; return JSON.stringify(rest); };
  assert.equal(clean(built[0].options), clean(built[1].options));
  assert.equal(built[0].options.ch, undefined); assert.equal(built[1].options.ch, undefined);
  assert.equal(built[0].c.userData.avatarId, built[1].c.userData.avatarId);
});

test('NPC answers are quoted, topic-aware, and use the character voice', () => {
  const ctx = { CHARINFO: { '비토 콜레오네': '저는 비토입니다.', '마커스 교수': '저는 영화를 연구하는 마커스 교수입니다.' } };
  vm.createContext(ctx); vm.runInContext(part('function npcReplyText(', 'function actorTalk()'), ctx);
  const vito = avatar('비토 콜레오네'), marcus = avatar('마커스 교수');
  for (const text of ['안녕하세요', '영화 추천', '장미', '무지개 팝콘', '비밀 클럽', '고마워요', '누구세요', '다른 이야기']) {
    const reply = ctx.npcReplyText(vito, text); assert(reply.startsWith('“친구여, ')); assert(reply.endsWith('”'));
  }
  assert(ctx.npcReplyText(marcus, '소개해 주세요').includes('마커스 교수'));
  assert(ctx.npcReplyText(vito, '초대장이 궁금해요').includes('알프레도'));
  assert(ctx.npcReplyText(vito, '무지개').includes('무지개빛'));
});

function chatContext() {
  const nodes = new Map(), timers = [], documentListeners = new Map(), sent = [], bubbles = [], replies = [];
  class Element {
    constructor() { this.style = {}; this.dataset = {}; this.value = ''; this.attrs = {}; this.listeners = new Map(); const classes = new Set(); this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) }; }
    set id(v) { this._id = v; nodes.set(v, this); } get id() { return this._id; }
    set innerHTML(v) { for (const m of v.matchAll(/id="([^"]+)"/g)) { const child = new Element(); child.id = m[1]; } }
    setAttribute(k, v) { this.attrs[k] = v; } appendChild() {} addEventListener(k, fn) { this.listeners.set(k, fn); }
    focus() {} blur() {} contains(el) { return el === this; }
  }
  const ctx = { Math, document: { createElement: () => new Element(), head: new Element(), body: new Element(), getElementById: id => nodes.get(id), addEventListener: (k, fn) => documentListeners.set(k, fn) },
    els: {}, CinemaAudio: { updateButton() {}, setMuted() {} }, qaKeyboardInset() {}, K: {}, endpoint: () => '',
    socket: { readyState: 1, send: value => sent.push(value) }, WebSocket: { OPEN: 1 }, me: avatar('나'),
    setTimeout: f => timers.push(f), showBubble: (target, text) => bubbles.push(text), sayB: (target, text) => replies.push(text),
    curZone: () => 'L0', npcReplyText: (target, text) => '“반가워요! ' + text + '”', setStatus() {}, connect() {}, toast() {} };
  vm.createContext(ctx); vm.runInContext(part('function makeUI(){', 'function setStatus(') + part('function openChat(', 'return {start,tick,openChat};'), ctx); ctx.makeUI();
  return { ctx, nodes, timers, documentListeners, sent, bubbles, replies };
}
test('NPC chat answers locally and never broadcasts the conversation to other users', () => {
  const { ctx, nodes, timers, sent, bubbles, replies } = chatContext();
  ctx.openChat(avatar('비토 콜레오네')); nodes.get('mpinput').value = '안녕하세요'; nodes.get('mpform').onsubmit({ preventDefault() {} });
  assert.equal(sent.length, 0); assert.equal(bubbles[0], '안녕하세요'); assert(nodes.get('mpchat').classList.contains('open'));
  timers[0](); assert(replies[0].includes('반가워요')); assert(nodes.get('npcChatReply').textContent.includes('비토'));
});
test('closing the conversation cancels a pending NPC reply and clears the target', () => {
  const { ctx, nodes, timers, replies } = chatContext(); ctx.openChat(avatar()); nodes.get('mpinput').value = '안녕하세요'; nodes.get('mpform').onsubmit({ preventDefault() {} });
  nodes.get('mpinput').listeners.get('keydown')({ key: 'Escape', preventDefault() {} }); timers[0](); assert.equal(replies.length, 0); assert.equal(ctx.els.talkTarget, null);
});
test('public user chat keeps its existing transport and outside touch closes the input', () => {
  const { ctx, nodes, sent, documentListeners } = chatContext(), peer = avatar(); peer.userData.remote = true; ctx.openChat(peer);
  nodes.get('mpinput').value = '테스트 초안'; nodes.get('mpform').onsubmit({ preventDefault() {} }); assert.equal(JSON.parse(sent[0]).text, '테스트 초안');
  ctx.openChat(); documentListeners.get('pointerdown')({ target: { closest: () => false } }); assert(!nodes.get('mpchat').classList.contains('open'));
});

function objectContext(blocked = (x, z) => Math.abs(x) < .7 && Math.abs(z) < .7) {
  const walks = [], calls = [], ctx = { Math, me: avatar(), THREE: { Vector3: class {} }, bounds: () => [-6, 6, -6, 6], zoneOf: () => 'L0', curZone: () => 'L0', blocked, toast: x => calls.push(x), walkTo: (...args) => walks.push(args) };
  vm.createContext(ctx); vm.runInContext(part('function furnitureRoute(', 'function walkTo(') + part('function approachObject(', "R.domElement.addEventListener('pointerup'"), ctx);
  return { ctx, walks, calls };
}
test('object interaction finds a reachable point and acts only after arriving', () => {
  const { ctx, walks } = objectContext(); let opened = 0; const act = { pt: { x: 0, z: 0, zone: 'L0' }, fn: () => opened++ };
  ctx.approachObject(act, { getWorldPosition: () => ({ x: 0, z: 0 }) }); assert.equal(opened, 0); assert.equal(walks.length, 1);
  const [me, x, z, zone, opts] = walks[0]; assert.equal(ctx.blocked(x, z), false); assert.equal(zone, 'L0'); assert.equal(opts.avoidFurniture, true);
  me.position.x = x; me.position.z = z; opts.after(); assert.equal(opened, 1);
});
test('an unreachable object never opens remotely or walks into a blocked location', () => {
  const { ctx, walks, calls } = objectContext(() => true); let opened = false;
  ctx.approachObject({ pt: { x: 0, z: 0, zone: 'L0' }, fn: () => opened = true }, null);
  assert.equal(opened, false); assert.equal(walks.length, 0); assert.equal(calls.length, 1);
});
test('the wall clock approaches from in front of the ticket booth rather than behind its counter', () => {
  const { ctx, walks } = objectContext((x, z) => x < -5.55 && z > 9.1 && z < 13.3);
  ctx.bounds = () => [-8.5, 8.5, .45, 21]; ctx.me.position.x = 0; ctx.me.position.z = 10.8;
  let opened = 0;
  Object.assign(ctx, { X: -8.84, Z: 11.2, clockHit: { userData: {} }, PANELS: { admlogin: () => opened++ } });
  vm.runInContext(source.split('\n').find(l => l.includes('clockHit.userData.act=')), ctx);
  ctx.approachObject(ctx.clockHit.userData.act, { getWorldPosition: () => ({ x: -8.84, z: 11.2 }) });
  assert.equal(walks.length, 1); assert.equal(opened, 0);
  const [me, x, z, zone, opts] = walks[0]; assert(x > -5.55); assert.equal(ctx.blocked(x, z), false);
  me.position.x = x; me.position.z = z; opts.after(); assert.equal(opened, 1);
});

function audioContext(muted = false) {
  const nodes = [], saved = new Map([['aic.audio.muted', muted]]), voiceCalls = [], muteButton = { setAttribute(k, v) { this[k] = v; } };
  class Param { constructor() { this.value = 0; } setValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } exponentialRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
  class Node { constructor(kind) { this.kind = kind; this.gain = new Param(); this.frequency = new Param(); this.Q = new Param(); this.connections = []; nodes.push(this); } connect(to) { this.connections.push(to); } disconnect() {} start() { this.started = true; } stop() { this.stopped = true; if (this.onended) this.onended(); } }
  class AudioCtx { constructor() { this.currentTime = 0; this.sampleRate = 1000; this.state = 'running'; this.destination = {}; } createGain() { return new Node('gain'); } createBufferSource() { return new Node('buffer'); } createBiquadFilter() { return new Node('filter'); } createOscillator() { return new Node('oscillator'); } createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } resume() { return Promise.resolve(); } }
  const bgm = { ctx: { currentTime: 0 }, g: { gain: new Param() }, vol() {} };
  const ctx = { Math, Set, Float32Array, store: { get: k => saved.get(k), set: (k, v) => saved.set(k, v) }, BGM: bgm, me: avatar(), curZone: () => 'L0', nowS: () => 100, $: id => id === 'lobbyMute' ? muteButton : null,
    window: { AudioContext: AudioCtx, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } }, speechSynthesis: { getVoices: () => [{ lang: 'fr-FR', name: 'French' }], cancel: () => voiceCalls.push('cancel'), speak: u => voiceCalls.push(u) } }, addEventListener() {} };
  vm.createContext(ctx); vm.runInContext(part('const CinemaAudio=', '/* ===== 사이트 설정 파일'), ctx);
  const audio = vm.runInContext('CinemaAudio', ctx); return { ctx, audio, nodes, saved, voiceCalls, muteButton, bgm };
}
test('all generated effects route through the shared gain and mute stops sound and French speech', () => {
  const { audio, nodes, saved, voiceCalls, bgm } = audioContext(); audio.effect('shelf'); audio.effect('register'); audio.effect('punch');
  assert(nodes.some(n => n.kind === 'buffer' && n.started)); assert(nodes.some(n => n.kind === 'oscillator' && n.started));
  for (const node of nodes) if (node !== audio.master) assert(!node.connections.includes(audio.ctx.destination));
  const count = nodes.length; audio.setMuted(true); audio.effect('shelf'); audio.speak('Voici votre billet.');
  assert.equal(nodes.length, count); assert.equal(audio.master.gain.value, 0); assert.equal(bgm.g.gain.value, 0); assert.equal(saved.get('aic.audio.muted'), true); assert(voiceCalls.includes('cancel'));
  audio.setMuted(false); audio.speak('Voici votre billet.'); const speech = voiceCalls.at(-1); assert.equal(speech.lang, 'fr-FR'); assert.equal(speech.voice.lang, 'fr-FR');
});
test('preparation sound starts once per order and is stopped when preparation finishes', () => {
  const { audio, nodes } = audioContext(), order = { readyAt: 104.2 }; audio.prep(order); const count = nodes.length; audio.prep(order); assert.equal(nodes.length, count);
  audio.prep(null); assert(nodes.filter(n => n.kind === 'buffer' || n.kind === 'oscillator').every(n => n.stopped));
});
test('saved mute preference and the accessible lobby button remain in sync', () => {
  const { audio, muteButton, nodes, ctx } = audioContext(true); audio.updateButton(); assert.equal(muteButton['aria-pressed'], 'true'); assert.equal(muteButton['aria-label'], '소리 켜기'); assert.equal(muteButton.hidden, false);
  audio.effect('punch'); assert.equal(nodes.length, 0); audio.setMuted(false); assert.equal(muteButton['aria-pressed'], 'false');
  ctx.curZone = () => 'H1'; audio.updateButton(); assert.equal(muteButton.hidden, true);
});
test('ticket delivery plays only the punch sound, without drawer or speech (QA17)', async () => {
  const calls = [], tasks = [], p = { hidden: true, innerHTML: '' }, ticket = { classList: { add() {} } };
  const ctx = { CinemaAudio: { effect: k => calls.push(k), speak: (text, lang) => calls.push([text, lang]) }, sayB: (c, text) => calls.push([c, text]), setTimeout: (f, delay) => tasks.push({ f, delay }), $: id => id === 'punch' ? p : { querySelector: () => ticket }, TCPAL: { 1: ['pink'] }, tc3: () => '', tcNo: () => '', qa13Punch: () => { calls.push('punch'); return { x: 0, y: 0 }; }, API: { tickets: () => [] }, store: { set() {} } };
  vm.createContext(ctx); vm.runInContext(part('function showPunch(', 'let ENTER_TK='), ctx); const pending = ctx.showPunch({ hall: 1 });
  assert(!calls.includes('register')); tasks.find(t => t.delay === 200).f(); assert.deepEqual(calls, ['punch']);
  tasks.find(t => t.delay === 1900).f(); await pending; assert.equal(p.hidden, true);
});
test('flower clue is visibly quoted and the tooltip contains action buttons without a nickname heading', () => {
  assert(source.includes('<br>“알프레도 할아버지와 대화하면 비밀 클럽에 대한 정보를 얻을 수 있어요.”'));
  const menu = part('function showActorMenu(', 'function selectAvatar('); assert(!menu.includes("<b>")); assert(menu.includes('말걸기')); assert(menu.includes('선물주기'));
});
