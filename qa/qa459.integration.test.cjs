const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA459 projection room has Sherlock, not Robert, and Sherlock no longer rotates',()=>{
  assert(source.includes("const nm='셜록 영사기사',lk_="));assert(!source.includes("const nm='영사기사 로베르'"));
  assert(source.includes("n!=='셜록 영사기사'/* QA459"));assert(!source.includes("'앨런','셜록 영사기사']"));
  assert(source.includes("'영사기사 로베르':'영사기사'"),'card numbers stay fixed');});
test('QA459 staff cards show their film',()=>{
  const m=source.match(/const QA459FILM=(\{[^}]+\})/);assert(m[1].includes("'자닌':'전진 트래블링'"));assert(m);const F=eval('('+m[1]+')');
  assert.strictEqual(F['미시즈 퍼재컬리'],'지상에서 가장 작은 쇼');assert.strictEqual(F['올드 톰'],'지상에서 가장 작은 쇼');
  assert.strictEqual(F['미스 모지'],'마지막 영화관');assert.strictEqual(F['셜록 영사기사'],'셜록 주니어');
  assert(source.includes("fm=QA459FILM[name]||"));assert(source.includes("fm=QA459FILM[x.n]||"));
  assert(source.includes("x.n==='영사기사 로베르'"));});
test('QA460 card back no longer shows the outfit line',()=>{
  assert(!source.includes('<em>오늘의 차림</em>'));assert(source.includes('QA460: 카드 뒷면의 「오늘의 차림」 줄을 뺌'));
  assert(source.includes('const QA408TALK='),'fashion talk stays in dialogue');});
test('QA462 the usherette is 안내원 자닌 on her tag, order panel and lines',()=>{
  assert(source.includes("nameTag('안내원 자닌',false)"));assert(source.includes("ouv:{title:'안내원 자닌 · 간식'"));
  assert(source.includes("VEN={ouv:{name:'안내원 자닌'"));assert(source.includes("'자닌':'우브뢰즈'"));
  assert(!/우브뢰즈(가|한테|에게) /.test(source.replace(/\/\*[\s\S]*?\*\//g,'')),'no player-facing line still says 우브뢰즈');});
test('QA463 popcorn is only talked about as an American habit',()=>{
  assert(!source.includes('옥수수를 튀겨 극장에서'));assert(!source.includes('팝콘이 극장 간식이 된'));
  for(const t of ['극장에서 옥수수를 튀겨 먹는다니, 미국 사람들은 참 별나지요.','미국에선 팝콘을 먹으면서 영화를 본다더라고요','파리는 분위기가 영 다르죠.','여기가 영화관인지 매점인지 모르겠어요.','파리 극장에선 통하지 않을 얘기예요.'])assert(source.includes(t),t);});
test('QA465 old popcorn lines are gone',()=>{assert(!source.includes('갓 튀긴 팝콘 냄새'));assert(!source.includes('어디서 팝콘 냄새가'));assert(source.includes('QA465: 팝콘 냄새 반응 대사 삭제'));});
test('QA466 the ice cream bar is called 에스키모 노르',()=>{assert(source.includes("glacier:['🍫','에스키모 노르'"));assert(source.includes('에스키모 노르 하나 사 두세요'));assert(!source.includes("'글라시에 노르'"));});
test('QA467 snack illustrations use the cut-out files only',()=>{
  assert(source.includes("P[k]=B+k+'_c.webp';G[k]=B+k+'_pkg_c.webp'"));
  for(const k of ['glacier','rivoli','bebert','fruitc','lemon']){const d=path.join(__dirname,'..','qa95_assets','snack');assert(fs.existsSync(path.join(d,k+'_c.webp')));assert(fs.existsSync(path.join(d,k+'_pkg_c.webp')));assert(!fs.existsSync(path.join(d,k+'.webp')));assert(!fs.existsSync(path.join(d,k+'_pkg.webp')));}});
