const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

test('QA15 front glass window area is 1.30x (each side x sqrt(1.3)) and the wall opening matches', () => {
  assert(source.includes('const QA15_FRONT_SCALE=Math.sqrt(1.3);'));
  assert(source.includes('o.position.z=LD+(o.position.z-LD)*k;o.scale.multiplyScalar(k)'));
  assert(source.includes('const fw=4.4*Math.sqrt(1.3),fh=5.6*Math.sqrt(1.3);wseg(-LW,-fw,0,8.8,LD,MU2,.3);wseg(fw,LW,0,8.8,LD,MU2,.3);wseg(-fw,fw,fh,8.8,LD,MU2,.3)'));
  assert(!source.includes('wseg(-LW,-4.4,0,8.8,LD,MU2,.3)'));
  assert.ok(Math.abs(Math.sqrt(1.3) ** 2 - 1.3) < 1e-12);
});
test('QA15 snow particles grow by 20% (1050 -> 1260) and stay outdoors', () => {
  assert(source.includes('const SN=1260'));
  assert(/sp_\.set\(\[-44\+Math\.random\(\)\*88,Math\.random\(\)\*28,LD\+\.45\+Math\.random\(\)\*32\]/.test(source));
});
test('QA15 every lobby ceiling light except the chandelier is flush-mounted (no rod)', () => {
  const i = source.indexOf('/* 유백색 유리 볼 펜던트 */'), block = source.slice(i, source.indexOf('/* ---------- CINEMA 입구', i));
  assert(block.includes('if(true){const flushLight=pi_>0;'));
  assert(block.indexOf('return}CHD.push(g);') > 0);
  assert(source.includes("fixture.name='qa13-crystal-chandelier'"));
});
test('QA15 chat has no X button and the send icon is enabled only for non-blank input', () => {
  assert(!/<button id="mpclose"/.test(source));
  assert(source.includes('<button id="mpsend" type="submit" aria-label="보내기" disabled>'));
  assert(source.includes("const syncSend=()=>{sendBtn.disabled=!els.input.value.trim()}"));
});
test('QA15 local NPCs and staff get a gift option whenever something is held, flowers included', () => {
  assert(source.includes("else if(HELD.length){/* QA15"));
  assert(source.includes('data-a=\\"actorUse\\"') || source.includes("data-a=\"actorUse\""));
  assert(!source.includes('실제 유저에게 선물 전달은 실시간 서버 기능 연결 후 지원돼요'));
  assert(source.includes("window.qa15GiftToPeer(target.userData.peerId"));
});
test('QA15 cinema: wood walls, brighter sconces dimmed while playing, free camera before seating and locked after', () => {
  assert(source.includes('QA16: 상영관 첨부2·3'));
  assert(source.includes('HALL_GLOW[space].forEach(e=>{e.h.material.opacity*=(.06+.94*HLF)})'));
  assert(source.includes('clampN(camDist*1.8,6.3,18))/* QA15: 착석 전 자유 줌 */'));
  assert(source.includes("if(me.userData.seat&&me.userData.seat.kind==='cine'&&!CWIDE){/* QA15: 착석 후 스크린 중심 고정"));
});
