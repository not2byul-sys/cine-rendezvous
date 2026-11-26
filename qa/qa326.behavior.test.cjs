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

test('탑바: 높이 46 — 왼쪽 칩과 오른쪽의 분리된 원형 버튼(46×46)이 같은 높이', () => {
  const b = rule('#lobbyMusic,#qa267share');
  assert.equal(px(rule('#chip'), 'height'), '46px'); assert.equal(px(b, 'width'), '46px'); assert.equal(px(b, 'height'), '46px');
  assert.equal(px(rule('#mpbar'), 'gap'), '8px');
  /* 버튼마다 유리 재질(원형) — 한 캡슐로 묶지 않음 */
  assert(hud.includes('\n#chip,#lobbyMusic,#qa267share{box-sizing:border-box;border:1px solid var(--glass-line);border-radius:999px;'));
  assert(!/#mpbar\{[^}]*(background|border)/.test(hud));
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

test('이름표: 카메라 기본 거리(배율 1.15)에서 알약 높이 27px · 글자 12px(QA395)', () => {
  const ctx = tagContext(), t = ctx.nameTag('다정한 나무', false), [w, h] = t.userData.px;
  assert(Math.abs(h * 1.15 - 27) < 0.01, String(h * 1.15));
  assert(Math.abs(ctx.NAMETAG.fs * ctx.NAMETAG.k * 1.15 - 12) < 0.01);
  /* 글자 좌우 여백 9 · 8.7(QA388: 2px씩 줄임) */
  const im = t.material.map.image, textW = 6 * 30;
  assert.equal(im.width, textW + 27 + 26); assert.equal(ctx.drawn.find(d => d[0] === 'name')[2], 27);
  assert.equal(t.material.sizeAttenuation, false, '화면에서 같은 크기로 보이는 방식 그대로');
});

test('내 이름표: 「나」 표시 없음(QA388)', () => {
  const ctx = tagContext(); ctx.nameTag('하나', true);
  assert(!ctx.drawn.find(d => d[0] === 'arc'));
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

test('올려 둔 설정: 크림 타일은 아이보리, 밝기 95% — 두 항목만 고쳐 올린 판', () => {
  assert.equal(config.data['aic.lobbyPalette'].floorCream, '#E1DBD1');
  assert.deepEqual(config.data['aic.lobbyLighting'], { b: 95, k: 4200 });
  assert.deepEqual(config.force, ['aic.lobbyPalette', 'aic.lobbyLighting']);
  assert.equal(config.rev, '2026-11-24T04:02:35.000Z');
  /* 그 밖의 관리자 입력값은 그대로 */
  assert.deepEqual(Object.keys(config.data), ['aic.clubfilmRevision', 'aic.layout', 'aic.posters', 'aic.filmInfo', 'aic.durs', 'aic.lobbyPalette', 'aic.lobbyLighting']);
  assert.equal(config.data['aic.lobbyPalette'].floorPink, '#D2BDA3'); assert.equal(config.data['aic.lobbyPalette'].wallWood, '#865A32');
});

test('조명: 전체 밝기는 110→100%, 등불(점광원)은 지금보다 10% 밝게', () => {
  const lamp = +source.match(/const LP_LAMP=([.\d]+),LP_GLOW=([.\d]+);/)[1], glow = +source.match(/const LP_LAMP=([.\d]+),LP_GLOW=([.\d]+);/)[2];
  /* 예전: 세기 배율 .399 × 밝기 1.10 → 지금: 배율 × 밝기 1.00 */
  assert(Math.abs(lamp * 1.00 / (.399 * 1.10) - 1.10) < 0.005, String(lamp / (.399 * 1.10)));
  assert.equal(glow, 1.1);
  assert(source.includes('const LP_LDEF={b:95,k:4200}'));
  assert.equal(source.split('LOBBY_HC').length - 1, 4, '로비 반구광 색은 한 이름으로(정의 1 + 쓰는 곳 3)');
  assert.equal(source.split('LOBBY_DC').length - 1, 4);
  assert(!source.includes('.setHex(0xfff0e0)') && !source.includes(':0xfff0e0)'));
});


test('QA327: 모바일 좌석표 — 접힘이 기본, 줄일 때 transform(하단 바와 안 겹침), 칩이 뜨면 한 줄 위 · 공유 아이콘은 종이비행기 · 로비 글자 가운데', () => {
  assert(source.includes("el.classList.add('min')/* QA371"));// QA371: B안 — PC·모바일 모두 처음엔 닫힘
  assert(source.includes('#qa127map:not(.min){transform:scale(.64);transform-origin:0 100%}'));
  assert(source.includes('body:not(.cineseat):has(#ctxbar:not([hidden])) #qa127map{bottom:calc(env(safe-area-inset-bottom,0px) + 116px)}'));
  assert(source.includes("lucide('share',16)") && !source.includes('share2'));
  assert(hud.includes("#chip b,#chip span{font:500 12px/1 'Noto Sans KR',sans-serif}"));
});

test('하단 퀵바·액션 칩은 예전 규칙 그대로(탑바 규칙 블록에 들어 있지 않다)', () => {
  assert(!/\n\.bar[ {]|\n#act /.test(hud) && !hud.includes('#ctxbar') && !hud.includes('--bar-'));
});
