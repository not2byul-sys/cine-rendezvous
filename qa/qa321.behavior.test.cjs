/* QA321~325 동작 테스트 — 실제 계산·흐름을 돌려 확인
   · 본편 시작: 인트로 동안 유튜브 본편을 멈추지 않고 소리만 끈 채 돌려 둠 → 시작할 때 처음으로 되감음(멈췄다 다시 틀면 유튜브 UI가 뜸)
   · 아이폰: 손대지 않은 '소리 켜기'를 시도하지 않고 '소리 켜기' 칩으로
   · 카메라: 로비에서는 벽·사물 때문에 거리가 줄지 않음 */
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

/* 가짜 유튜브 플레이어: 상태 -1 대기, 1 재생, 2 멈춤, 3 버퍼링 */
function fakeYT(state = -1) {
  const y = { state, muted: false, time: 37, log: [],
    getPlayerState() { return y.state; }, getCurrentTime() { return y.time; }, isMuted() { return y.muted; },
    mute() { y.muted = true; y.log.push('mute'); }, unMute() { y.muted = false; y.log.push('unMute'); },
    playVideo() { y.log.push('play'); if (y.canPlay !== false) y.state = 1; }, pauseVideo() { y.log.push('pause'); y.state = 2; },
    seekTo(t) { y.log.push('seek' + t); y.time = t; }, setVolume(v) { y.vol = v; } };
  return y;
}
function filmContext({ ua = 'Mozilla/5.0 (Windows NT 10.0)', muted = false, local = false, yt = fakeYT(1) } = {}) {
  const st = { clock: 0, classes: [], chips: [], watchHidden: true };
  const vf = { hidden: !local, paused: !local, muted: false, volume: 1, currentTime: 12, log: [], pause() { this.paused = true; this.log.push('pause'); }, play() { this.paused = false; this.log.push('play'); return { catch() {} }; } };
  const ctx = { st, vf, yt, ytMuted: muted, hudUpd() {}, Math, Promise,
    navigator: { userAgent: ua, maxTouchPoints: 0 }, performance: { now: () => st.clock },
    setInterval: () => 1, clearInterval() {},
    document: { body: { classList: { add: c => st.classes.push(c) } }, createElement: () => ({ remove() {}, isConnected: true }) },
    $: id => id === 'cine' ? { appendChild: b => st.chips.push(b) } : id === 'watch' ? { set hidden(v) { st.watchHidden = v; } } : null };
  vm.createContext(ctx);
  vm.runInContext(`let RUN=1,CMODE='full';const wait=ms=>{st.clock+=ms;return Promise.resolve()},MUTED=()=>ytMuted,VOL=()=>.85;` +
    section(' /* QA323 본편 제어', ' function clip(box,src)') + section(' /* QA175: 소리 있는 자동 재생이 막히면', ' /* 엔딩: 자막이 올라가고') +
    ';this.api={holdFilm,startFilm,ensure,rolling,audible,setRun:v=>RUN=v,setMode:v=>CMODE=v}', ctx);
  return { ctx, st, vf, yt, api: ctx.api };
}
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X)';

test('인트로 동안 유튜브 본편은 멈추지 않고 소리만 끈 채 돌려 둔다', () => {
  const { api, yt, st } = filmContext({ yt: fakeYT(1) });
  api.holdFilm(); st.clock += 200; api.holdFilm();
  assert(yt.muted);
  assert(!yt.log.includes('pause'), '멈추면 다시 틀 때 유튜브 재생 UI가 뜸');
  assert.equal(yt.state, 1);
});

test('본편이 멈춰 있거나 아직 시작 전이면 다시 재생시키되, 1초에 한 번만 시도한다', () => {
  const { api, yt, st } = filmContext({ yt: Object.assign(fakeYT(2), { canPlay: false }) });
  st.clock = 5000; for (let i = 0; i < 6; i++) { api.holdFilm(); st.clock += 200; }   // 1초 동안 6번 호출
  assert.equal(yt.log.filter(x => x === 'play').length, 1);
  st.clock += 1000; api.holdFilm();
  assert.equal(yt.log.filter(x => x === 'play').length, 2);
});

test('업로드 영상이 본편이면 예전처럼 멈춰 두고, 뒤에 남은 유튜브 플레이어는 깨우지 않는다', () => {
  const { api, yt, vf } = filmContext({ local: true, yt: fakeYT(1) });
  api.holdFilm();
  assert(vf.paused && vf.muted);
  assert.deepEqual(yt.log, ['mute', 'pause']);
});

test('본편 시작: 처음으로 되감고 소리를 켠 뒤, 실제로 재생 중일 때 막을 걷는다', async () => {
  const { api, yt, st } = filmContext({ yt: fakeYT(1) });
  await api.startFilm(1);
  assert.deepEqual(yt.log, ['seek0', 'unMute', 'play']);
  assert.equal(st.clock, 0, '이미 처음부터 돌고 있으면 기다리지 않음');
  const slow = filmContext({ yt: Object.assign(fakeYT(3), { canPlay: false }) });   // 되감은 뒤 버퍼링이 길어지는 경우
  await slow.api.startFilm(1);
  assert.equal(slow.st.clock, 2500, '최대 2.5초까지만 기다림');
});

test('함께 보기(시간표) 모드에서는 되감지 않는다', async () => {
  const { api, yt } = filmContext({ yt: fakeYT(1) });
  api.setMode('live'); await api.startFilm(1);
  assert(!yt.log.some(x => x.startsWith('seek')));
});

test('아이폰에서는 손대지 않은 소리 켜기를 시도하지 않고, 재생은 그대로 둔 채 소리 켜기 칩을 띄운다', async () => {
  const { api, yt, st } = filmContext({ ua: IPHONE, yt: fakeYT(1) });
  await api.startFilm(1);
  assert(!yt.log.includes('unMute'));
  yt.muted = true; await api.ensure(1);
  assert.equal(st.chips.length, 1, '소리 켜기 칩');
  assert.equal(st.clock, 0, '기다리지 않고 바로');
  assert(!yt.log.includes('pause') && !st.classes.includes('qa141need'));
});

test('소리까지 정상이면 아무것도 띄우지 않고, 소리만 막혔으면 칩, 재생 자체가 안 되면 영화 보기 버튼', async () => {
  const ok = filmContext({ yt: fakeYT(1) }); await ok.api.ensure(1);
  assert.equal(ok.st.chips.length, 0); assert(ok.st.watchHidden);
  const quiet = filmContext({ yt: Object.assign(fakeYT(1), { muted: true }) }); await quiet.api.ensure(1);
  assert.equal(quiet.st.chips.length, 1); assert(!quiet.st.classes.includes('qa141need'));
  const dead = filmContext({ yt: Object.assign(fakeYT(2), { canPlay: false }) }); await dead.api.ensure(1);
  assert(dead.st.classes.includes('qa141need')); assert.equal(dead.st.watchHidden, false); assert.equal(dead.st.chips.length, 0);
});

test('소리를 꺼 둔 사용자는 소리 켜기 칩을 보지 않는다', async () => {
  const { api, st } = filmContext({ muted: true, yt: Object.assign(fakeYT(1), { muted: true }) });
  await api.ensure(1);
  assert.equal(st.chips.length, 0);
});

/* 카메라 스프링 암 */
function armContext(hitAt) {
  const me = { visible: true, userData: {} };
  class V { set() { return this; } multiplyScalar() { return this; } }
  const ctx = { Math, me, LAYED: false, S: { traverse() {} }, setTimeout() {}, setInterval() {}, performance: { now: () => 0 },
    THREE: { Raycaster: class { set() {} intersectObjects() { return hitAt == null ? [] : [{ distance: hitAt, object: { visible: true, material: {} } }]; } }, Vector3: V, Box3: class {} },
    blocked: () => false };
  ctx.window = ctx; vm.createContext(ctx);
  const open = '<script id="qa279-cam">';
  vm.runInContext(section(open, '</script>').slice(open.length), ctx);
  return { ctx, me };
}

test('상영 전 뉴스 영상은 본편 숨김 규칙에 걸리지 않는다', () => {
  assert(source.includes('body.cineseat:not(.qa135play) #cine:not(:has(#qa110pre))>iframe,body.cineseat:not(.qa135play) #cine:not(:has(#qa110pre))>video{opacity:0!important}'));
  assert(!source.includes('body.cineseat:not(.qa135play) #cine iframe,'), '자손 선택자면 뉴스 영상까지 투명해짐');
});

test('메뉴 카드: 폰에서는 PC와 같은 크기로 옆으로 넘기고, 덮어쓰던 규칙은 남아 있지 않다', () => {
  assert(source.includes('@media (max-width:600px){.qa115-car{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x mandatory;'));
  assert(source.includes('.qa115-car .qa115-c{flex-basis:166px;scroll-snap-align:start}'));
  assert(!source.includes('html body #pn .qa115-car{flex-wrap:wrap!important'));
  assert(source.includes('--ik:#5d211c;color:var(--ik);background:#fbf3e2;'), '카드 글자색은 카드가 직접 정함');
});

test('트리 별의 십자 광선과 쓰이지 않던 반짝이 코드는 지워졌다', () => {
  assert(!/GL\.fl\b/.test(source)); assert(!source.includes('qa34Dust'));
  assert(source.includes('GL.pool.material.opacity=.75*k;'));
});

test('상영관 벽등의 빛 번짐은 전구 재질로 바뀌지 않고(크림색 네모로 보이던 문제), 상영 중에는 벽등과 함께 꺼진다', () => {
  assert(source.includes('else if(m.material===sconce.W.m)m.material=wm;else if(m.material.isMeshBasicMaterial)m.material=bm'));
  assert(source.includes('HALL_SC[id]=[sm,bm,wm]') && source.includes('HALL_SC[space][2].opacity=sconce.W.m.opacity*HLF'));
});
