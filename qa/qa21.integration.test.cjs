const test=require('node:test');const assert=require('node:assert');const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),fn=fs.readFileSync(path.join(__dirname,'..','functions','api','reviews.js'),'utf8');
test('QA21 likes and one-line reviews live only in the timetable panel, gated by one minute of viewing',()=>{
  assert(source.includes('<script id="qa21-reviews">'));assert(source.includes("const watched=id=>(W[id]||0)>=60;"));
  assert(source.includes("add('qlike','좋아요 '+d_.likes"));assert(source.includes('maxlength="40"'));assert(source.includes("PANELS.tt=function(keep)"));});
test('QA28 entrance plaque removed, tree starts on tap, single small ripple, emotes never empty',()=>{assert(source.includes('setTimeout(()=>{pull(true)},1200)/* QA28: 입구 좋아요 팻말 삭제 */'));assert(source.includes("info:'불을 끄고 점등식을 시작할 수 있는 크리스마스 트리예요. 점등 장면은 나에게만 보여요.'"));assert(source.includes('s>=6/* QA39: 전구가 다 켜지면 바로 별·산타 인사 */'));assert(source.includes('function qa30Glow(k,s=0,starOn=false)'));assert(source.includes("QA15EventAudio.speak('Merry Christmas!',.9,.55,()=>{QA15EventAudio.bells();window.__qaBellsAt=performance.now()})"));assert(source.includes('bells(){/* QA31'));assert(source.includes('/* QA28: 원 하나가 작게 퍼지는 파동 */'));assert(source.includes("say(me,kind==='wave'?'안녕하세요!':'짝짝짝!',1)"));assert(source.includes('#toast{text-align:center!important;'));});
test('QA21 shared storage is a Pages Function on KV that refuses gracefully when unbound',()=>{
  assert(fn.includes("if (!env.REVIEWS) return json({ ok: false, error: 'storage_unbound' }, 503);"));assert(fn.includes('export async function onRequestGet'));assert(fn.includes('export async function onRequestPost'));
  assert(fn.includes('clean(b.text, 40)'));assert(source.includes("fetch('/api/reviews'"));});
test('QA21 review function validates and dedupes per user',async()=>{
  const mod=await import('data:text/javascript,'+encodeURIComponent(fn));const store=new Map();const env={REVIEWS:{get:async(k)=>store.has(k)?JSON.parse(store.get(k)):null,put:async(k,v)=>store.set(k,v)}};
  const post=b=>mod.onRequestPost({request:new Request('https://x/api/reviews',{method:'POST',body:JSON.stringify(b)}),env}).then(r=>r.json());
  let j=await post({id:'abc',uid:'user12345',op:'like'});assert.equal(j.film.likes,1);j=await post({id:'abc',uid:'user12345',op:'like'});assert.equal(j.film.likes,1);
  j=await post({id:'abc',uid:'user12345',op:'review',name:'나',text:'<b>좋아요</b> 정말 '.repeat(5)});assert.equal(j.film.reviews.length,1);assert(!j.film.reviews[0].t.includes('<'));assert(j.film.reviews[0].t.length<=40);
  j=await post({id:'abc',uid:'user12345',op:'review',name:'나',text:'다시 씀'});assert.equal(j.film.reviews.length,1);
  const bad=await mod.onRequestPost({request:new Request('https://x/api/reviews',{method:'POST',body:'{}'}),env});assert.equal(bad.status,400);
  const unbound=await mod.onRequestGet({request:new Request('https://x/api/reviews?ids=abc'),env:{}});assert.equal(unbound.status,503);});
test('QA22 popups are centered, scroll inside the inner frame, and the booth lists only open halls',()=>{
  assert(source.includes('#pn:not(.leg){align-items:center!important;justify-content:center!important}'));
  assert(source.includes('#pn:not(.leg) .pin{flex:1 1 auto;min-height:0;overflow-y:auto'));
  assert(source.includes('if(CLOSEDH.has(hl.id))return/* QA22: 매표소엔 상영 중인 관만 */'));});
test('QA26 like is a context action bar toggle chip while watching; film end adds the review chip',()=>{
  assert(source.includes("if(fid)add('ctxreview','한줄평 남기기')"));assert(!source.includes('class="fx qlike'));
  assert(source.includes("qlike:()=>{const id=QA21.curFilm();if(!id)return;QA21.toggle(id);hudUpd()}"));assert(source.includes('function endFilm(){'));});
test('QA24 popups follow the Figma panel structure and quick bar icons are 16px',()=>{
  assert(source.includes('/* QA24: Figma 3. 패널 팝업(1:38) 구조'));assert(source.includes('#pn:not(.leg) .porn{width:189px;height:20px}'));
  assert(source.includes("#pn:not(.leg) .pbox .hall{font:400 16px/1.5 'Noto Sans KR',sans-serif!important;color:var(--ik)!important"));
  assert(source.includes('#act button svg.lucide,#act button svg,#act .mp-nav-button svg{width:16px!important;height:16px!important}'));});
test('QA27 top chips align, chat shows X until typing, last nickname always kept',()=>{
  assert(source.includes('#hb #bgmb,#hb [data-a=adm]{display:none!important}'));assert(source.includes('#mpstatus{height:36px;'));
  assert(source.includes("sendBtn.dataset.mode==='close'"));assert(source.includes('#mpform{padding-right:14px!important}'));
  assert(source.includes("if(nm)localStorage.setItem('aic.nick',nm);"));assert(source.includes('.jt14-save{display:none!important}'));});
test('QA29 action chips sit behind every modal',()=>{assert(source.includes('#ctxbar,#actorMenu{z-index:19!important}'));});
test('QA33 sconces stay lit during the ceremony, no toasts then, tree chips return afterwards',()=>{
  assert(source.includes('/* QA33: 벽등(근처 조명·광륜·발광 재질 포함)은 소등하지 않음 */'));assert(source.includes('if(window.QA_TREE_ON)return/* QA33: 점등식 중 알림 없음 */'));assert(source.includes('/* QA33: 점등식 후 트리 칩(트리 점등·살펴보기) 복귀 */'));});
test('QA34 star faces the viewer, glow only, gold dust, toast matches nav width',()=>{assert(source.includes('window.qa34StarFace='));assert(source.includes('DUST.visible=false;return/* QA35: 금빛 반짝이 삭제 */'));assert(source.includes('size:.62/* QA35'));assert(source.includes('GL.sl.intensity=0/* QA34'));assert(source.includes('/* QA34: 하단 네비와 같은 가로 길이 */'));assert(source.includes('text-wrap:balance'));});
test('QA36 random pick relabels to re-pick, options centered, darker room keeps the tree lit',()=>{assert(source.includes("'랜덤 다시고르기':'랜덤고르기'"));assert(source.includes('#join .jt2-opts{left:0!important;right:0!important;transform:none!important;justify-content:center!important'));assert(source.includes('/* QA36: 어둠 속에서 트리만 잘 보이게 */'));});
test('QA37 tree stands at the lobby centre and first entry faces the theatre with the entrance behind',()=>{const w=fs.readFileSync(require('path').join(__dirname,'..','qa11-winter.js'),'utf8');assert(w.includes('g.position.set(0,0,13.5)'));assert(source.includes("layEnd(m_,'spawn','입장 위치',0,{noDup:1,noDel:1,px:0,pz:17.3})"));assert(source.includes('{x:0,z:17.3,r:Math.PI}'));});
test('QA39 Alfredo offers only a talk chip that opens the quiz, seats show gold number plates, club waits for the film, hall camera frames the screen',()=>{assert(source.includes("el.innerHTML=bt('actorUse','','대화하기')"));assert(source.includes("add('sit',selSeat.label+'번 앉기',' class=\"ivory\"');add('ctxother','다른 자리 앉기')"));assert(source.includes('html body #sitbox,html body #sitbox:not([hidden]){display:none!important}'));assert(source.includes("m.name='qa39-seat-labels-'+h.id"));assert(source.includes('function qa39ClubLoading()'));assert(source.includes('if(hz&&!s){/* QA39'));});
