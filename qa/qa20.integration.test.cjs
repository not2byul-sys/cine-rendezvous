const test=require('node:test');const assert=require('node:assert');const fs=require('fs');
const source=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
test('QA20 context actions are text-only pill chips in the quick bar palette',()=>{
  assert(source.includes("'<button role=\"menuitem\" data-a=\"'+a+'\"><span>'+t+'</span></button>'/* QA20"));
  assert(source.includes('#ctxbar button{flex:none;display:inline-flex;align-items:center;height:44px;padding:0 18px;margin:0;border-radius:999px;background:rgba(28,20,22,.72)'));});
test('QA20 situational buttons leave the quick bar and live in the context bar',()=>{
  const hud=source.slice(source.indexOf('function hudUpd(){'),source.indexOf('function toLobby('));
  for(const k of['data-a="trash"','data-a="eatn"','data-a="standme"','data-a="sitnear"','data-a="clubstop"'/* QA91: 아지트 나가기(goup)는 퀵바 오른쪽 끝으로 옮김 */])assert(!hud.includes(k),k);
  assert(hud.includes('qa20Ctx(zc,inH,sp,cine)'));
  const ctx=source.slice(source.indexOf('function qa20Ctx('),source.indexOf('function qa20Obj('));
  for(const k of["'sit',","'ctxother','다른 자리 앉기'","'sitnear','앉기'","'ctxbooth','매표소 가기'","'ctxside'","'oget','간식받기'"])assert(ctx.includes(k),k);
  assert(!ctx.includes("'tt','상영작'"),'QA260: 액션 바에 상영작 없음');});
test('QA20 objects ask first with a named action and a look-around chip',()=>{
  for(const k of["ctx:'영화 월드컵'","ctx:'트리 점등'","ctx:'레코드 고르기'","ctx:'책장 열기'","ctx:'상영 안내 보기'"])assert(source.includes(k),k);
  assert(source.includes("if(ud.act.ctx){qa20Obj(ud.act,o,az);return}"));});
test('QA20 avatar chips add hint, wave, clap, follow and flower purchase; no block/report',()=>{
  for(const k of["'actorChat','','더 들려주세요'","'actorPhoto','','같이 사진찍기'","'actorWave','','손 흔들기'","'actorClap','','박수'","'actorFollow','','따라가기'","'꽃 사기'"])assert(source.includes(k),k);
  assert(!/차단|신고/.test(source.slice(source.indexOf('function showActorMenu('),source.indexOf('function selectAvatar('))));});
