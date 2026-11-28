const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA459 projection room has Sherlock, not Robert, and Sherlock no longer rotates',()=>{
  assert(source.includes("const nm='셜록 영사기사',lk_="));assert(!source.includes("const nm='영사기사 로베르'"));
  assert(source.includes("n!=='셜록 영사기사'/* QA459"));assert(!source.includes("'앨런','셜록 영사기사']"));
  assert(source.includes("'영사기사 로베르':'영사기사'"),'card numbers stay fixed');});
test('QA459 staff cards show their film',()=>{
  const m=source.match(/const QA459FILM=(\{[^}]+\})/);assert(m);const F=eval('('+m[1]+')');
  assert.strictEqual(F['미시즈 퍼재컬리'],'지상에서 가장 작은 쇼');assert.strictEqual(F['올드 톰'],'지상에서 가장 작은 쇼');
  assert.strictEqual(F['미스 모지'],'마지막 영화관');assert.strictEqual(F['셜록 영사기사'],'셜록 주니어');
  assert(source.includes("fm=QA459FILM[name]||"));assert(source.includes("fm=QA459FILM[x.n]||"));
  assert(source.includes("x.n==='영사기사 로베르'"));});
test('QA460 card back no longer shows the outfit line',()=>{
  assert(!source.includes('<em>오늘의 차림</em>'));assert(source.includes('QA460: 카드 뒷면의 「오늘의 차림」 줄을 뺌'));
  assert(source.includes('const QA408TALK='),'fashion talk stays in dialogue');});
