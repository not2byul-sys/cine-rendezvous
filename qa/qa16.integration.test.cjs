const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('QA16 invite follows the Figma 76:2228 layout', () => {
  assert(source.includes('<h3>비밀영화클럽 초대장</h3>'));
  assert(source.includes('초대장을 수락하면 영화클럽으로 가는 문이 열려요'));
});
test('QA16 lobby plays a calm classical schedule and is 5% darker', () => {
  assert(source.includes('BGM.sched=qa16ClassicSchedule;'));
  assert(source.includes('LOBBY_HEMI=.66,LOBBY_DL=.115'));
  assert(source.includes('o.intensity*=.95'));
});
test('QA16 chat send button uses the shadcn icon button shape', () => {
  assert(/#mpsend\{[^}]*width:36px;height:36px[^}]*border-radius:50%/.test(source));
  assert(source.includes('#mpsend:disabled{opacity:.5;pointer-events:none'));
  assert(source.includes('lucide-arrow-up'));
});
test('QA16 bookshelf door sound is quiet', () => {
  const i = source.indexOf("if(kind==='shelf')"), m = [source.slice(i, source.indexOf('this.noise(.1,170,.06,1.3)', i))];
  assert(i > 0 && m[0].length < 200);
  assert(!m[0].includes('.22,k*.13'));
});
test('QA16 club: brick walls, no quote board, no chalkboards, world cup trophy opens the panel', () => {
  assert(source.includes("'club-brick-wall'"));
  assert(!source.includes("'club-film-quote-board'"));
  assert(source.includes('club-worldcup-trophy'));
  assert(source.includes('영화 월드컵'));
  assert(source.includes("openPanel('wcup')"));
});
test('QA16 shop purchase completes immediately with a pickup button above the nav', () => {
  assert(source.includes("toast('구매가 완료되었어요. 받아가주세요.')"));
  assert(source.includes("mkB('qa16get'"));
  assert(source.includes('A.oget()'));
  assert(source.includes('#qa17cta{position:fixed'));
});
test('QA16 ticket checker guidance and silent punch', () => {
  assert(source.includes('QA16·17: 티켓 없이 검표원 선택 시 말풍선 안내'));
  assert(source.includes('매표소 가기'));
  const punch = source.slice(source.indexOf('function showPunch('), source.indexOf('function showPunch(') + 400);
  assert(!punch.includes('Voici votre billet'));
});
test('QA16 hall: cream plaster, brick pilasters, green carpet, skyline frames', () => {
  assert(source.includes('CARP=0x2c4634'));
  assert(source.includes('B(.6,HH,.62,BRK,'));
  assert(source.includes('frame(skyl('));
  assert(!source.includes('hallWood('));
});
