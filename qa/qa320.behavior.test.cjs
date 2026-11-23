/* QA320 동작 테스트 — 시점 회전이 손가락을 바로 따라오는지(코드 글자가 아니라 실제 계산을 돌려 확인)
   · 직접 돌린 회전: 손을 떼면 0.5초 안에 끝남(전에는 남은 회전이 초당 40°로 묶여 몇 초씩 혼자 돌았음)
   · 게임이 돌리는 시점(걷기 따라가기·선물): 예전처럼 초당 40° 이하 */
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
const DEG = Math.PI / 180;
function yawContext() {
  const ctx = { Math };
  vm.createContext(ctx);
  vm.runInContext('const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));' + section('let camUserT=0;function qa320Yaw(', 'function alignSpaceCamera('), ctx);
  return ctx;
}
/* 프레임 간격(dts)대로 돌리면서, 스와이프(시작 시각·길이·각도) 동안 목표 각도를 올리고 손이 닿아 있음(active)을 알려 줌 */
function run(dts, swipes) {
  const ctx = yawContext(); let t = 0, target = 0, shown = 0; const rows = [];
  for (const dt of dts) {
    const t0 = t; t += dt; let active = false;
    for (const s of swipes) {
      const a0 = Math.max(t0, s.at), a1 = Math.min(t, s.at + s.dur);
      if (a1 > a0) { target += s.deg * DEG * (a1 - a0) / s.dur; active = true; }
    }
    const next = ctx.qa320Yaw(shown, target, dt, active);
    rows.push({ t, step: (next - shown) / DEG, gap: (target - next) / DEG, active });
    shown = next;
  }
  return rows;
}
const fps = (n, sec) => Array(Math.round(n * sec)).fill(1 / n);
/* 실제 폰 영상에서 잰 것과 같은 고르지 못한 화면 간격(평균 약 42장/초, 가끔 67ms 멈춤) */
const phone = sec => { const out = []; let t = 0, k = 0; while (t < sec) { const dt = k % 17 === 9 ? 4 / 60 : k % 3 === 2 ? 2 / 60 : 1 / 60; out.push(dt); t += dt; k++; } return out; };

test('스와이프한 회전은 손을 뗀 뒤 0.5초 안에 끝난다', () => {
  const rows = run(fps(60, 2), [{ at: 0.2, dur: 0.1, deg: 46 }]);
  const at = s => rows.find(r => r.t >= s - 1e-9);
  assert(Math.abs(at(0.8).gap) < 1, `0.5초 뒤에도 ${at(0.8).gap.toFixed(1)}° 남음`);
  /* 그 뒤 남는 움직임은 눈에 안 보이는 수준(초당 3° 미만)으로 잦아듦 */
  assert(rows.filter(r => r.t > 1.0).every(r => Math.abs(r.step) * 60 < 3 && Math.abs(r.gap) < 0.5), '손 뗀 지 0.7초 뒤에는 사실상 멈춰 있어야 함');
  /* 예전 방식(초당 40°)으로는 0.5초 동안 20°밖에 못 돌아 한참 남았음 */
  const turned = rows.filter(r => r.t > 0.3 && r.t <= 0.8).reduce((a, r) => a + r.step, 0);
  assert(turned > 25, `손 뗀 뒤 0.5초 동안 ${turned.toFixed(1)}°`);
});

test('빠르게 연달아 스와이프해도 화면이 크게 뒤처지지 않고, 마지막 스와이프 뒤 곧 멈춘다', () => {
  const swipes = Array.from({ length: 14 }, (_, i) => ({ at: 0.2 + i * 0.35, dur: 0.1, deg: 46 }));
  const rows = run(phone(8), swipes), last = 0.2 + 13 * 0.35 + 0.1;
  const worst = Math.max(...rows.map(r => Math.abs(r.gap)));
  assert(worst < 45, `가장 많이 뒤처진 각도 ${worst.toFixed(0)}°`);
  const still = rows.filter(r => r.t > last + 0.6);
  assert(still.length > 10 && still.every(r => Math.abs(r.step) < 0.1), '마지막 스와이프 0.6초 뒤에는 멈춤');
  assert(rows.every(r => r.step > -1e-9), '돌리는 반대 방향으로 움직이면 안 됨');
});

test('화면이 느려도(초당 30장) 같은 시간에 같은 만큼 돈다', () => {
  const sw = [{ at: 0.2, dur: 0.1, deg: 60 }];
  const end = rows => rows.filter(r => r.t <= 0.5 + 1e-9).reduce((a, r) => a + r.step, 0);
  const a = end(run(fps(60, 1), sw)), b = end(run(fps(30, 1), sw));
  assert(Math.abs(a - b) < 2.5, `60장 ${a.toFixed(1)}° / 30장 ${b.toFixed(1)}°`);
});

test('게임이 돌리는 시점은 예전처럼 천천히(초당 40° 이하) 따라간다', () => {
  const ctx = yawContext(); let shown = 0, fastest = 0, t = 0;
  while (Math.abs(90 * DEG - shown) > 0.01 && t < 10) { const n = ctx.qa320Yaw(shown, 90 * DEG, 1 / 60, false); fastest = Math.max(fastest, (n - shown) * 60 / DEG); shown = n; t += 1 / 60; }
  assert(fastest <= 40.2, `가장 빠를 때 초당 ${fastest.toFixed(1)}°`);
  assert(t > 2.2 && t < 3.5, `90° 도는 데 ${t.toFixed(2)}초`);
});

test('직접 돌린 뒤 0.4초가 지나면 자동 회전은 다시 천천히', () => {
  const ctx = yawContext(); let shown = 0;
  for (let i = 0; i < 6; i++) shown = ctx.qa320Yaw(shown, 0.2, 1 / 60, true);
  for (let i = 0; i < 30; i++) shown = ctx.qa320Yaw(shown, 0.2, 1 / 60, false);   // 0.5초 쉼
  const before = shown, n = ctx.qa320Yaw(shown, shown + 90 * DEG, 1 / 60, false);
  assert((n - before) * 60 / DEG <= 40.2);
});

test('먼 쪽이 아니라 가까운 쪽으로 돈다(350° → 10°는 20°만)', () => {
  const ctx = yawContext();
  const n = ctx.qa320Yaw(350 * DEG, 10 * DEG, 1 / 60, true);
  assert(n > 350 * DEG && n < 353 * DEG);
});

test('두 시점 계산 모두 같은 방식을 쓰고, 드래그·Q/E·마우스 관성이 직접 회전으로 처리된다', () => {
  const call = '{const ny_=qa320Yaw(camYawS,camYaw,dt,camDrag||Math.abs(yawV)>=.01||!!(K.q||K.e));camYawS=snapCam?camYaw:ny_}';
  assert.equal(source.split(call).length - 1, 2);
  assert(!source.includes('st_=clampN(st_,-.7*dt,.7*dt)'), '손 뗀 뒤 초당 40° 제한이 남아 있음');
});
