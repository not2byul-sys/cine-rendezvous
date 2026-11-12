const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('QA17 ceremony dims lobby emissives and drops the awe line', () => {
  assert(!source.includes('와아, 정말 아름다워요'));
  assert(source.includes('QA17: 점등식 동안 매점·벽등 등 로비 발광체도 함께 어둡게'));
  assert(source.includes('active.glow.forEach(e=>e.h.material.opacity*=dim)'));
});
test('QA17 snack table in front of the shop is removed', () => {
  assert(!source.includes("'snacktable'"));
});
test('QA17 checker without ticket speaks and offers a booth shortcut above the nav', () => {
  assert(source.includes('function qa17NoTicket(st)'));
  assert(source.includes("mkB('qa17box','tix','매표소 가기'"));
  assert(!source.includes('PANELS.hallbuy(hid);return}'));
});
test('QA17 punch keeps only the punch sound and no pre-punch notice', () => {
  const punch = source.slice(source.indexOf('function showPunch('), source.indexOf('let ENTER_TK='));
  assert(!punch.includes("effect('register')"));
  assert(!source.includes('await doneMsg(`${s.hall.name}'));
});
test('QA17 fig plant no longer overlaps the ticket booth', () => {
  assert(source.includes("[-LW+.6,0,7.85,'fig',0]"));
});
test('QA17 club entry view, unified mute, tap-to-pause screen', () => {
  assert(source.includes('camYaw=camYawS=Math.PI+.3;camPitch=camPitchT=.46'));
  assert(source.includes("['L0','L1','B'].includes(curZone(me))"));
  assert(source.includes('CinemaAudio.setMuted=function(v){base(v);qa17ApplyMute()}'));
  assert(source.includes("fn:()=>A.clubstop()/* QA17"));
  assert(source.includes("function clubHover(){CSB.style.display='none';return;"));
});
test('QA17 shop purchase uses an auto-dismissing toast', () => {
  assert(source.includes("toast('구매가 완료되었어요. 받아가주세요.')"));
});
test('QA17 chat placeholder 15px and round send button', () => {
  assert(source.includes('#mpinput::placeholder{color:#8E8E93;opacity:1;font-size:15px}'));
  assert(/#mpsend\{[^}]*border-radius:50%/.test(source));
});
test('QA17 trophy follows the reference without the text banner', () => {
  assert(!source.includes("c.fillText('영화 월드컵'"));
  assert(source.includes('const globe=new THREE.Mesh(new THREE.SphereGeometry(.15'));
});
test('QA17 bouquet is white-wrapped red roses carried in the basket', () => {
  assert(source.includes('QA17: 꽃다발 = 흰 포장지 원뿔 + 붉은 장미 7송이 + 노란 리본'));
  assert(source.includes('QA17: 꽃다발 2개 더 + 바구니 손잡이'));
});
test('QA17 snowy street uses a moonlit snow material', () => {
  assert(source.includes('emissive:0x56626e'));
});
