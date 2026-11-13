const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
function part(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing section ${start}`); return source.slice(a, b);
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function writingContext() {
  const data = new Map(), nodes = new Map(), panels = [], notices = [];
  const ctx = { URL, location: { href: 'https://qa.example/?old=value#old' }, window: { MYNAME: '테스트 관객' },
    store: { get: k => data.get(k), set: (k, v) => data.set(k, v) }, $: k => nodes.get(k),
    A: {}, PANELS: { club() {} }, CLUBSEED: [{ n: '토토', f: '영화', t: '영화 이야기' }],
    panel: html => panels.push(html), toast: s => notices.push(s), esc, navigator: { clipboard: { writeText: async v => { ctx.copied = v; } } } };
  vm.createContext(ctx); vm.runInContext(part('function cleanClubNote(', '/* 아지트 연속 상영:'), ctx);
  return { ctx, data, nodes, panels, notices };
}
test('a postcard link preserves Korean text and line breaks without saving before consent', () => {
  const { ctx, data } = writingContext(), note = { n: '관객', f: '영화 제목', t: '한 문장\n그리고 다음 문장' };
  const link = ctx.clubPostcardUrl(note); assert(link.startsWith('https://qa.example/?postcard='));
  assert(!link.includes('old=value')); assert(!link.includes('#old'));
  ctx.location.href = link;
  assert.deepEqual(JSON.parse(JSON.stringify(ctx.readSharedClubNote())), note); assert.equal(data.size, 0);
});
test('malformed and oversized shared payloads are rejected and fields are bounded', () => {
  const { ctx } = writingContext();
  for (const v of ['{broken', 'null', '[]', '"text"', '{"f":"","t":"hello"}', 'x'.repeat(2049)]) {
    ctx.location.href = 'https://qa.example/?postcard=' + encodeURIComponent(v); assert.equal(ctx.readSharedClubNote(), null);
  }
  const n = ctx.cleanClubNote({ f: 'f'.repeat(100), t: 't'.repeat(500), n: 'n'.repeat(40) });
  assert.equal(n.f.length, 40); assert.equal(n.t.length, 300); assert.equal(n.n.length, 14);
});
test('postcard display escapes markup and preserves the full body', () => {
  const { ctx, panels } = writingContext(); ctx.showClubPostcard({ f: '<script>x</script>', t: '<img src=x onerror=1>\n다음 줄', n: '<b>나</b>' });
  const html = panels.at(-1); assert(!html.includes('<script>')); assert(!html.includes('<img'));
  assert(html.includes('&lt;img src=x onerror=1&gt;\n다음 줄')); assert(html.includes('엽서 링크 복사하기'));
});
test('shared postcards save only on explicit action, deduplicate, and survive a new context', async () => {
  const { ctx, data } = writingContext(); ctx.showClubPostcard({ f: '영화', t: '단상', n: '관객' }, true);
  assert.equal(data.size, 0); ctx.A.clubsavecard(); ctx.A.clubsavecard();
  assert.equal(data.get('aic.clubnotes').length, 1); await ctx.A.clubshare();
  const next = writingContext(); next.ctx.location.href = ctx.copied;
  assert.equal(next.ctx.readSharedClubNote().t, '단상'); assert.equal(next.data.size, 0);
});
test('damaged stored notes cannot break the board or inject unsafe markup', () => {
  const { ctx, data } = writingContext(); data.set('aic.clubnotes', { f: 'bad' }); assert.equal(ctx.clubNotes(false).length, 0);
  data.set('aic.clubnotes', [null, { f: 3, t: 4 }, { f: '영화', t: '단상' }]); assert.equal(ctx.clubNotes(false).length, 1);
});
test('blank quotes do not save; valid quotes retain 300 characters and cap history at 30', () => {
  const { ctx, data, nodes } = writingContext(); nodes.set('quoteText', { value: '  ' }); nodes.set('quoteFilm', { value: '' });
  ctx.A.quotesave(); assert.equal(data.size, 0);
  nodes.get('quoteText').value = '긴 대사'.repeat(100); nodes.get('quoteFilm').value = '영화';
  for (let i = 0; i < 35; i++) ctx.A.quotesave();
  const saved = data.get('aic.clubquotes.v1'); assert.equal(saved.length, 30); assert.equal(saved[0].text.length, 300);
  assert.equal(ctx.clubQuotes().length, 30);
});
test('quote detail opens the whole escaped text rather than truncating it', () => {
  const { ctx, data, panels } = writingContext(), text = '<b>대사</b>\n' + '긴 문장 '.repeat(30);
  data.set('aic.clubquotes.v1', [{ text, film: '영화', by: '관객' }]); ctx.A.quoteview({ i: '0' });
  assert(panels.at(-1).includes(esc(text.trim()))); assert(!panels.at(-1).includes('<b>대사'));
  const count = panels.length; ctx.A.quoteview({ i: '999' }); assert.equal(panels.length, count);
});

function adContext() {
  const nodes = new Map(), intervals = new Map(), messages = []; let nextId = 0;
  for (const id of ['ad', 'adbt', 'adx']) nodes.set(id, { hidden: true, innerHTML: '', outerHTML: '', querySelectorAll: () => [] });
  const ctx = { CFG: { AD: { seconds: 3, provider: 'mock', fallback: false } }, $: id => nodes.get(id),
    adReward: () => '보상', lucide: () => '', IT: { pop: ['🍿', '팝콘'] }, window: {},
    toast: t => messages.push(t), setTimeout: () => 1, clearTimeout() {},
    setInterval: fn => { const id = ++nextId; intervals.set(id, fn); return id; }, clearInterval: id => intervals.delete(id) };
  vm.createContext(ctx); vm.runInContext(part('const AdService=', 'const KSTEP=') + '\nthis.service=AdService;', ctx);
  return { ctx, nodes, intervals, messages, tick: () => { for (const fn of [...intervals.values()]) fn(); } };
}
for (const kind of ['ticket', 'order', 'vend', 'quiz']) test(`completed ${kind} example ad closes automatically and grants once`, async () => {
  const f = adContext(), pending = f.ctx.service.show({ kind, label: '테스트' }); let grants = 0; pending.then(v => { if (v) grants++; });
  assert.equal(f.nodes.get('ad').hidden, false); f.tick(); f.tick(); assert.equal(f.nodes.get('ad').hidden, false);
  f.tick(); assert.equal(await pending, true); assert.equal(f.nodes.get('ad').hidden, true); assert.equal(f.intervals.size, 0);
  f.tick(); f.nodes.get('adx').onclick(); await Promise.resolve(); assert.equal(grants, 1);
});
test('an early ad close cancels the timer and grants nothing', async () => {
  const f = adContext(), p = f.ctx.service.show({ kind: 'ticket', label: '테스트' }); f.tick(); f.nodes.get('adx').onclick();
  assert.equal(await p, false); assert.equal(f.intervals.size, 0); assert.equal(f.ctx.service.busy, false);
});
test('a simultaneous ad and an unavailable provider cannot grant a reward', async () => {
  const f = adContext(), first = f.ctx.service.show({ kind: 'ticket', label: '테스트' });
  assert.equal(await f.ctx.service.show({ kind: 'ticket', label: '테스트' }), false);
  f.nodes.get('adx').onclick(); await first;
  f.ctx.service.providers.empty = { show: async () => null }; f.ctx.CFG.AD.provider = 'empty';
  assert.equal(await f.ctx.service.show({ kind: 'ticket', label: '테스트' }), false);
});

function cupContext(data = new Map()) {
  const ctx = { store: { get: k => data.get(k), set: (k, v) => data.set(k, v) }, Math, A: {}, PANELS: {}, panel: html => { ctx.html = html; }, window: {} };
  vm.createContext(ctx); vm.runInContext(part('const WCF=', '/* 필름 한 편 상영 종료') + '\nthis.state=()=>WC;', ctx); return { ctx, data };
}
test('all 15 world cup matches finish and the champion and ranking persist on reload', () => {
  const { ctx, data } = cupContext(); ctx.A.wcstart();
  for (let i = 0; i < 15; i++) { const wc = ctx.state(); assert(wc); ctx.A.wcpick({ i: wc.round[wc.k * 2] }); }
  assert.equal(ctx.state(), null); assert(ctx.html.includes('CHAMPION'));
  const records = data.get('aic.wcup'); assert.equal(records.length, 1); assert.equal(records[0].pts[records[0].w], 11);
  const again = cupContext(data); assert.equal(JSON.stringify(again.ctx.wcRank()), JSON.stringify(ctx.wcRank()));
  again.ctx.PANELS.wcup(); assert.equal((again.ctx.html.match(/class="wcri"/g) || []).length, 10);
});
test('world cup rejects picks that are not one of the two current films', () => {
  const { ctx, data } = cupContext(); ctx.A.wcstart(); const state = JSON.stringify(ctx.state());
  for (const i of [-1, 99, 'bad', 1.5]) ctx.A.wcpick({ i });
  assert.equal(JSON.stringify(ctx.state()), state); assert.equal(data.size, 0);
});

function videoContext() {
  const videos = [], mesh = { userData: {}, material: { old: true }, scale: { x: 1, y: 1 } }, toasts = [];
  const ctx = { window: { __clubPoolInit: true, CLUBSCR: mesh }, CLUBSCR: mesh, me: {}, curZone: () => 'B',
    R: { outputEncoding: 'sRGB' }, Date: { now: () => 0 }, console: { warn() {} }, toast: t => toasts.push(t),
    clubStart() {}, clubSync() {}, ytLayer() {},
    THREE: { VideoTexture: class { dispose() {} }, MeshBasicMaterial: class { constructor(o) { Object.assign(this, o); } dispose() {} }, LinearFilter: 1 },
    document: { createElement: () => { const v = { listeners: {}, paused: true, videoWidth: 1920, videoHeight: 1080, setAttribute() {}, removeAttribute() {},
      addEventListener(e, fn) { (this.listeners[e] ||= []).push(fn); }, emit(e) { (this.listeners[e] || []).forEach(fn => fn()); },
      load() {}, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } }; videos.push(v); return v; } } };
  vm.createContext(ctx); vm.runInContext(`var CLUBQUEUE=Array.from({length:13},(_,i)=>'media/'+i+'.mp4'),CLUBI=0,YTL=null,CLV=null,CLVSRC='',CLVTEX=null,CLVACTIVE=false,CLVFAILED=false,CLVRETRY=0,CLVSYNC=0;function clubUrl(){return CLUBQUEUE[CLUBI%CLUBQUEUE.length]}` + part('function clubVid(active=false)', 'function clubVidPos()') + '\nthis.failed=()=>CLVFAILED;this.current=()=>CLUBI;', ctx);
  return { ctx, videos, mesh, toasts };
}
test('club videos advance through all 13 files and wrap to the first', () => {
  const f = videoContext(); f.ctx.clubVid(true); const v = f.videos[0]; assert.equal(v.src, 'media/0.mp4');
  for (let i = 1; i <= 26; i++) { v.emit('ended'); assert.equal(v.src, `media/${i % 13}.mp4`); }
  assert.equal(f.videos.length, 1); assert.equal(v.loop, false);
});
test('portrait and wide films fit inside the same screen without cropping', () => {
  const f = videoContext(); f.ctx.clubVid(true); const v = f.videos[0];
  v.videoWidth = 1080; v.videoHeight = 1920; v.emit('loadedmetadata'); assert(f.mesh.scale.x < 0.32); assert.equal(f.mesh.scale.y, 1);
  v.videoWidth = 2390; v.videoHeight = 1000; v.emit('loadedmetadata'); assert.equal(f.mesh.scale.x, 1); assert(f.mesh.scale.y < 0.75);
});
test('an all-missing playlist stops after one bounded pass instead of retrying forever', () => {
  const f = videoContext(); f.ctx.clubVid(true); const v = f.videos[0];
  for (let i = 0; i < 13; i++) v.emit('error'); assert.equal(f.ctx.failed(), true); assert.equal(f.toasts.length, 1); assert.equal(f.mesh.material.old, true);
});
test('successful media loading resets the error streak; leaving pauses decoding', () => {
  const f = videoContext(); f.ctx.clubVid(true); const v = f.videos[0];
  for (let i = 0; i < 12; i++) v.emit('error'); v.emit('loadeddata'); v.emit('error'); assert.equal(f.ctx.failed(), false);
  f.ctx.clubVid(false); assert.equal(v.paused, true); assert.equal(v.muted, true); f.ctx.clubVid(true); assert.equal(f.videos.length, 1);
});
test('every referenced local script and every registered MP4 is an actual file of the right type', () => {
  const root = path.join(__dirname, '..');
  for (const m of source.matchAll(/<script\b[^>]*src="([^"]+)"/g)) if (!/^https?:/.test(m[1])) {
    const body = fs.readFileSync(path.join(root, m[1]), 'utf8'); assert(!/^\s*</.test(body), m[1]); new vm.Script(body);
  }
  const films = JSON.parse(source.match(/const CLUBFILMS=(\[.*?\]);/)[1]); assert.equal(films.length, 13); assert.equal(new Set(films.map(f => f.src)).size, 13);
  for (const f of films) { const b = fs.readFileSync(path.join(root, decodeURIComponent(f.src))); assert.equal(b.toString('ascii', 4, 8), 'ftyp', f.src); }
});
