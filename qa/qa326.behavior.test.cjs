/* QA326 동작 테스트 — 실제 계산·흐름을 돌려 확인
   · HUD: 산사 실측 치수가 규칙의 숫자에서 그대로 나오는지(하단 바 356, 액션 칩 자리) · 탑바 높이 46, 오른쪽은 분리된 원형 버튼
   · 채널 표시: 로비 01, 02 … · 접속 인원은 표시하지 않음
   · 이름표: 카메라 기본 거리에서 알약 28px · 글자 11px, 다른 라벨(자판기 등)의 모양은 그대로
   · 설정 파일: force 에 적힌 항목만 관리자 브라우저의 더 나중 저장보다 우선
   · 조명: 전체는 100%로, 등불은 지금보다 10% 밝게 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../site-config.json'), 'utf8'));
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, `Missing source section: ${start}`);
  return source.slice(a, b);
}
const hud = section('<style id="hud">', '</style>');
const rule = sel => { const i = hud.indexOf('\n' + sel + '{'); assert(i >= 0, `HUD rule missing: ${sel}`); return hud.slice(i + sel.length + 2, hud.indexOf('}', i)); };
const px = (css, prop) => { const m = css.match(new RegExp('(?:^|;)' + prop + ':([^;]+)')); assert(m, `${prop} missing in ${css}`); return m[1]; };
const num = s => parseFloat(s);

test('하단 바: 칸 4개 × 86.5 + 안쪽 여백 + 테두리 = 356 — 폭 402 화면에서 좌우 23', () => {
  const act = rule('.bar #act'), btn = rule('#act button');
  const pad = px(act, 'padding').split(' ').map(num)[1], col = num(px(btn, 'width'));
  assert.equal(4 * col + 2 * pad + 2 * 1, 356);
  assert.equal(px(act, 'max-width'), 'calc(100vw - 46px)');
  assert(hud.includes('@media (max-width:600px){.bar #act{width:calc(100vw - 46px)}'));
  assert.equal(402 - 46, 356);
});

test('하단 바 안: 아이콘 중심은 위에서 22.7, 라벨 중심은 44.3(산사 실측)', () => {
  const btn = rule('#act button'), svg = rule('#act button svg');
  const top = 1 + num(px(btn, 'padding-top')), icon = num(px(svg, 'width')), gap = num(px(btn, 'gap')), line = num(px(btn, 'font').match(/\/(\d+(?:\.\d+)?)px/)[1]);
  assert(Math.abs(top + icon / 2 - 22.7) < 0.1, String(top + icon / 2));
  assert(Math.abs(top + icon + gap + line / 2 - 44.3) < 0.1, String(top + icon + gap + line / 2));
  assert.equal(px(btn, 'font').startsWith('500 12px'), true, '버튼 글자는 미디움(QA232)');
});

test('탑바: 높이 46 — 왼쪽 칩과 오른쪽의 분리된 원형 버튼(46×46)이 같은 높이', () => {
  const b = rule('#lobbyMusic,#qa267share');
  assert.equal(px(rule('#chip'), 'height'), '46px'); assert.equal(px(b, 'width'), '46px'); assert.equal(px(b, 'height'), '46px');
  assert.equal(px(rule('#mpbar'), 'gap'), '8px');
  /* 버튼마다 유리 재질(원형) — 한 캡슐로 묶지 않음 */
  assert(hud.includes('\n#chip,#lobbyMusic,#qa267share,.bar #act,#ctxbar button,#actorMenu button{box-sizing:border-box;border:1px solid var(--glass-line);border-radius:999px;'));
  assert(!/#mpbar\{[^}]*(background|border)/.test(hud));
});

test('바 위에 뜨는 것들은 바의 변수에서 자리를 얻는다(액션 칩 11 · 안내 문구 10 · 대화 입력줄 12)', () => {
  const vars = hud.slice(hud.indexOf('body{--glass'), hud.indexOf('}', hud.indexOf('body{--glass')));
  assert(vars.includes('--bar-h:64px') && vars.includes('+ 14px + var(--qa-keyboard-offset,0px))') && vars.includes('--bar-top:calc(var(--bar-b) + var(--bar-h))'));
  for (const id of ['#actorMenu', '#ctxbar', '#qa17cta']) assert.equal(source.split(id + '{position:fixed;').length - 1, 1, id);
  assert.equal(source.split('bottom:calc(var(--bar-top) + 11px);').length - 1, 3);
  assert(source.includes('.hint{position:fixed;left:0;right:0;bottom:calc(var(--bar-top) + 10px);'));
  assert(source.includes('#mpchat{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(var(--bar-top) + 12px);'));
  /* 14 + 64 + 11 + 칩 줄의 안쪽 여백 2 = 91 → 칩 아래와 바 위 사이 13(산사 실측) */
  assert.equal(14 + 64 + 11 + 2 - (14 + 64), 13);
});

test('덮어쓰던 예전 규칙은 남아 있지 않다', () => {
  for (const gone of ['id="qa319-css"', 'id="qa120-music"', 'html body .bar #act', 'html body:not(.qa220h) .bar #act', '#lobbyMusic[data-state=on]{', 'const look=()=>{const m=document.getElementById(\'lobbyMusic\')', '#chip.chip', 'html body #chip', '#act button svg.lucide', 'QA44: 모바일 하단 네비 5칸 균등 배치'])
    assert(!source.includes(gone), `남아 있음: ${gone}`);
  /* 하단 바의 기본 자리 규칙은 한 번만 정의 */
  assert.equal(source.split('\n.bar{').length - 1, 1);
  assert(!/(^|[\n}])\.bar\{[^}]*!important/.test(source), '.bar 기본 규칙에 !important 가 남아 있음');
});

function chipContext(zone) {
  const el = { chtx: { textContent: '' }, cnt: { textContent: '' } };
  const ctx = { $: id => el[id], me: {}, curZone: () => zone, HALLN: { 1: { seats: Array.from({ length: 64 }, (_, i) => ({ taken: i < 8 })) } }, hallCfg: () => ({ name: '1관' }), HCH: {}, NPCS: Array(9), CFG: { CHANNELS: [{ id: 'CH01', cap: 30 }] } };
  vm.createContext(ctx);
  vm.runInContext(section('const chNo=i=>', 'setInterval(()=>{try{updChip()') + ';this.chNo=chNo;this.updChip=updChip', ctx);
  return { ctx, el };
}

test('채널 표시: 로비에서는 「로비 01」만 — 접속 인원은 나오지 않는다', () => {
  const { ctx, el } = chipContext('L0'); ctx.updChip();
  assert.equal(el.chtx.textContent, '로비'); assert.equal(el.cnt.textContent, '01');
  assert.deepEqual([0, 1, 9, 10].map(ctx.chNo), ['01', '02', '10', '11']);
  assert(!/관객 \$\{NPCS\.length\+1\}명/.test(source));
});

test('채널 표시: 상영관에서는 관 이름과 좌석 안내 그대로', () => {
  const { ctx, el } = chipContext('H1'); ctx.updChip();
  assert.equal(el.chtx.textContent, '1관'); assert.equal(el.cnt.textContent, '좌석 64석 · 착석 8석');
});

test('채널 목록과 안내 문구도 「로비」로 부른다(방 이름 CH01 은 서버 연결용으로 그대로)', () => {
  assert(source.includes('<b>로비 ${chNo(i)}</b>') && source.includes("toast('로비 이동은 서버 연동 후 지원돼요')") && source.includes('같은 로비 관객과 만나요'));
  assert(source.includes("CHANNELS:[{id:'CH01',cap:30}"));
  assert(source.includes('<div id="chip" data-a="chan"><b id="chtx">로비</b><span id="cnt">01</span>'));
});

function tagContext() {
  const drawn = [];
  const canvas = () => ({ width: 0, height: 0, getContext: () => ({ font: '', measureText: t => ({ width: t.length * 30, actualBoundingBoxAscent: 24, actualBoundingBoxDescent: 4 }), beginPath() {}, roundRect() {}, rect() {}, fill() {}, arc(x, y, r) { drawn.push(['arc', x, y, r]); }, fillText(t, x) { drawn.push(['text', t, x, this.font]); } }) });
  class Sprite { constructor(m) { this.material = m; this.scale = { set: (x, y) => { this.sx = x; this.sy = y; } }; this.userData = {}; } }
  const ctx = { drawn, document: { createElement: canvas }, THREE: { Sprite, SpriteMaterial: class { constructor(o) { Object.assign(this, o); } }, CanvasTexture: class { constructor(c) { this.image = c; } } },
    emoW: (x, t) => t.length * 30, emoDraw: (x, t, tx) => drawn.push(['name', t, tx]), Math };
  vm.createContext(ctx);
  vm.runInContext('let QA78_K=1;' + section('function qa78Fix(', '/* 부모(아바타)의 크기 배율이') + section('function tag(t,bg,fg,fs', 'function art(w,h,fn)') + ';this.tag=tag;this.nameTag=nameTag;this.NAMETAG=NAMETAG', ctx);
  return ctx;
}

test('이름표: 카메라 기본 거리(배율 1.15)에서 알약 높이 28px · 글자 11px', () => {
  const ctx = tagContext(), t = ctx.nameTag('다정한 나무', false), [w, h] = t.userData.px;
  assert(Math.abs(h * 1.15 - 28) < 0.01, String(h * 1.15));
  assert(Math.abs(ctx.NAMETAG.fs * ctx.NAMETAG.k * 1.15 - 11) < 0.01);
  /* 글자 좌우 여백 11 · 10.7(산사 실측 11 · 10.8) */
  const im = t.material.map.image, textW = 6 * 30;
  assert.equal(im.width, textW + 33 + 32); assert.equal(ctx.drawn.find(d => d[0] === 'name')[2], 33);
  assert.equal(t.material.sizeAttenuation, false, '화면에서 같은 크기로 보이는 방식 그대로');
});

test('내 이름표: 「나」 원은 지름 19px, 왼쪽 5.7 · 글자와 6.7 간격', () => {
  const ctx = tagContext(); ctx.nameTag('하나', true);
  const arc = ctx.drawn.find(d => d[0] === 'arc'), name = ctx.drawn.find(d => d[0] === 'name'), s = 3;
  assert.equal(arc[3] * 2 / s, 19); assert(Math.abs((arc[1] - arc[3]) / s - 5.7) < 0.1); assert(Math.abs((name[2] - (arc[1] + arc[3])) / s - 6.7) < 0.1);
});

test('다른 라벨(자판기 등)은 예전 모양 그대로: 높이 글자+20, 좌우 여백 14', () => {
  const ctx = tagContext(), t = ctx.tag('COFFEE', '#fff', '#000', 26, .6, true), im = t.material.map.image;
  assert.equal(im.height, 46); assert.equal(im.width, 6 * 30 + 28); assert.equal(ctx.drawn.find(d => d[0] === 'name')[2], 14);
});

function loadConfig({ file, local = {} }) {
  const ls = new Map(Object.entries(local));
  const ctx = { location: { protocol: 'https:' }, Date, JSON, Array, String, localStorage: { getItem: k => ls.has(k) ? ls.get(k) : null, setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) },
    XMLHttpRequest: class { open() {} send() { this.status = 200; this.responseText = JSON.stringify(file); } } };
  vm.createContext(ctx);
  vm.runInContext(section('const SITE_KEYS=', 'function siteExport()'), ctx);
  return ls;
}
const FILE = { rev: '2026-11-21T18:27:57.311Z', force: ['aic.lobbyLighting'], data: { 'aic.lobbyLighting': { b: 100, k: 4800 }, 'aic.layout': { v: 2, from: 'file' } } };

test('설정 파일: 처음 온 방문자는 파일 값을 모두 받는다', () => {
  const ls = loadConfig({ file: FILE });
  assert.deepEqual(JSON.parse(ls.get('aic.lobbyLighting')), { b: 100, k: 4800 }); assert.equal(JSON.parse(ls.get('aic.layout')).from, 'file');
  assert.equal(ls.get('aic.siteRev'), FILE.rev);
});

test('설정 파일: 관리자가 더 나중에 저장한 브라우저에서는 force 항목만 바뀌고 나머지 입력값은 그대로', () => {
  const later = String(Date.parse(FILE.rev) + 86400000);
  const ls = loadConfig({ file: FILE, local: { 'aic.localRev': later, 'aic.siteRev': '2026-11-21T18:27:57.310Z', 'aic.lobbyLighting': JSON.stringify({ b: 110, k: 4800 }), 'aic.layout': JSON.stringify({ v: 2, from: 'admin' }) } });
  assert.deepEqual(JSON.parse(ls.get('aic.lobbyLighting')), { b: 100, k: 4800 });
  assert.equal(JSON.parse(ls.get('aic.layout')).from, 'admin', '관리자가 넣은 배치가 지워지면 안 됨');
});

test('설정 파일: 같은 판을 이미 받은 브라우저는 다시 덮어쓰지 않는다', () => {
  const ls = loadConfig({ file: FILE, local: { 'aic.siteRev': FILE.rev, 'aic.lobbyLighting': JSON.stringify({ b: 120, k: 4800 }) } });
  assert.equal(JSON.parse(ls.get('aic.lobbyLighting')).b, 120);
});

test('올려 둔 설정: 크림 타일은 아이보리, 밝기 100% — 두 항목만 고쳐 올린 판', () => {
  assert.equal(config.data['aic.lobbyPalette'].floorCream, '#E1DBD1');
  assert.deepEqual(config.data['aic.lobbyLighting'], { b: 100, k: 4800 });
  assert.deepEqual(config.force, ['aic.lobbyPalette', 'aic.lobbyLighting']);
  assert.equal(config.rev, '2026-11-21T18:27:57.311Z');
  /* 그 밖의 관리자 입력값은 그대로 */
  assert.deepEqual(Object.keys(config.data), ['aic.clubfilmRevision', 'aic.layout', 'aic.posters', 'aic.filmInfo', 'aic.durs', 'aic.lobbyPalette', 'aic.lobbyLighting']);
  assert.equal(config.data['aic.lobbyPalette'].floorPink, '#D2BDA3'); assert.equal(config.data['aic.lobbyPalette'].wallWood, '#865A32');
});

test('조명: 전체 밝기는 110→100%, 등불(점광원)은 지금보다 10% 밝게', () => {
  const lamp = +source.match(/const LP_LAMP=([.\d]+),LP_GLOW=([.\d]+);/)[1], glow = +source.match(/const LP_LAMP=([.\d]+),LP_GLOW=([.\d]+);/)[2];
  /* 예전: 세기 배율 .399 × 밝기 1.10 → 지금: 배율 × 밝기 1.00 */
  assert(Math.abs(lamp * 1.00 / (.399 * 1.10) - 1.10) < 0.005, String(lamp / (.399 * 1.10)));
  assert.equal(glow, 1.1);
  assert(source.includes('const LP_LDEF={b:100,k:4800}'));
  assert.equal(source.split('LOBBY_HC').length - 1, 4, '로비 반구광 색은 한 이름으로(정의 1 + 쓰는 곳 3)');
  assert.equal(source.split('LOBBY_DC').length - 1, 4);
  assert(!source.includes('.setHex(0xfff0e0)') && !source.includes(':0xfff0e0)'));
});

test('QA327: 좌석표(모바일) — 하단 바 위 13px, 접힘이 기본, 액션 칩이 뜨면 한 줄 위, 공유 아이콘은 종이비행기', () => {
  assert(source.includes('#qa127map{--map-b:calc(var(--bar-top) + 13px);position:fixed;left:12px;bottom:var(--map-b)'));
  assert(source.includes("el.classList.toggle('min',MOB.matches)"));
  assert(source.includes('body:not(.cineseat):has(#ctxbar:not([hidden])) #qa127map{--map-b:calc(var(--bar-top) + 63px)}'));
  assert(source.includes('#qa127map:not(.min){transform:scale(.64);transform-origin:0 100%}'));
  assert(source.includes("lucide('share',16)") && !source.includes('share2'));
  assert(hud.includes("#chip b{padding-top:4px;"));
});
