const test=require('node:test');const assert=require('node:assert');const fs=require('fs');
const source=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
test('QA19 hall follows the reference proportions: narrow room, smaller screen, larger avatars, plush seats',()=>{
  assert(source.includes('HX=9.4;'));assert(source.includes('SCW=14.2,SCH=7.99,SCY=4.85'));assert(source.includes('NSEAT=120,HSC=.9;'));
  assert(source.includes('QA19: 레퍼런스 좌석'));assert(source.includes("walkTo(me,HCX[id],-3.4,'H'+id)"));});
test('QA19 world cup trophy sits on the left bar cart without its pedestal',()=>{
  assert(source.includes('QA19: 좌측 바 카트(탁자) 위에 올림'));assert(source.includes('const px=X+CBW-.7,pz=Z+1.6'));});
test('QA19 NPC actions render as a pill row above the bottom nav',()=>{
  assert(source.includes("bt('actorTalk','talk','말걸기')"));assert(source.includes("bt('actorGift','giftmenu','선물하기')"));assert(source.includes('#actorMenu{position:fixed;z-index:38;left:50%'));});
test('QA19 every NPC gift line reacts in character and then hints at the club or rainbow popcorn',()=>{
  const st=source.indexOf('const QA18_GIFT={'),body=source.slice(st,source.indexOf('};',st));
  const rows=[...body.matchAll(/'([^']+)':\['([^']*)','([^']*)','([^']*)','(hop|bow)'\]/g)];assert(rows.length>=50);
  rows.forEach(r=>assert(/클럽|무지개 팝콘/.test(r[3]),r[1]));});
test('QA19 mobile camera is game-style and taps show a destination mark',()=>{
  assert(source.includes('QA19: 일반 모바일 게임식'));assert(source.includes('qa19TapMark(h.point,ud.zone)'));assert(source.includes('eatTick(dt,t);qa19TapTick(dt);'));});
test('QA19 avatar floor shadow is hidden',()=>{assert(source.includes('sh.visible=false/* QA19'));});
