const test=require('node:test');const assert=require('node:assert');const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),fn=fs.readFileSync(path.join(__dirname,'..','functions','api','reviews.js'),'utf8');
test('QA21 likes and one-line reviews live only in the timetable panel, gated by one minute of viewing',()=>{
  assert(source.includes('<script id="qa21-reviews">'));assert(source.includes("const watched=id=>(W[id]||0)>=60;"));
  assert(!source.includes("add('qlike',"));/* QA131: 좋아요 칩 삭제 *//* QA109: 좋아요는 수 없이 토글 */assert(source.includes('maxlength="40"'));assert(source.includes("PANELS.tt=function(keep)"));});
test('QA28 entrance plaque removed, tree starts on tap, single small ripple, emotes never empty',()=>{assert(source.includes('setTimeout(()=>{pull(true)},1200)/* QA28: 입구 좋아요 팻말 삭제 */'));assert(source.includes("info:'불을 끄고 점등식을 시작할 수 있는 크리스마스 트리예요. 점등 장면은 나에게만 보여요.'"));assert(source.includes('s>=6/* QA39: 전구가 다 켜지면 바로 별·산타 인사 */'));assert(source.includes('function qa30Glow(k,s=0,starOn=false)'));assert(source.includes("QA15EventAudio.speak('Merry Christmas!',.9,.55,()=>{QA15EventAudio.bells();window.__qaBellsAt=performance.now()})"));assert(source.includes('bells(){/* QA31'));assert(source.includes('/* QA28: 원 하나가 작게 퍼지는 파동 */'));assert(source.includes("qa44SayEmoji(me,kind==='wave'?'👋':'👏👏👏')"));assert(source.includes('#toast{text-align:center!important;'));});
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
  assert(!source.includes("add('ctxreview','한줄평 남기기')"));assert(!source.includes('data-a="rvopen"'));assert(!source.includes('class="fx qlike'));
  assert(source.includes("qlike:()=>{const id=QA21.curFilm();if(!id)return;QA21.toggle(id);hudUpd()}"));assert(source.includes('function endFilm(){'));});
test('QA24 popups follow the Figma panel structure and quick bar icons are 16px',()=>{
  assert(source.includes('/* QA24: Figma 3. 패널 팝업(1:38) 구조'));assert(source.includes('#pn:not(.leg) .porn{width:189px;height:20px}'));
  assert(source.includes("#pn:not(.leg) .pbox .hall{font:400 16px/1.5 'Noto Sans KR',sans-serif!important;color:var(--ik)!important"));
  assert(source.includes('#act button svg.lucide,#act button svg,#act .mp-nav-button svg{width:16px!important;height:16px!important}'));});
test('QA27 top chips align, chat shows X until typing, last nickname always kept',()=>{
  assert(source.includes('#hb #bgmb,#hb [data-a=adm]{display:none!important}'));assert(!source.includes('mpstatus'))/* QA328: 연결 상태 표시 삭제 */;
  assert(source.includes("sendBtn.dataset.mode==='close'"));assert(source.includes('#mpform{padding-right:14px!important}'));
  assert(source.includes("if(nm)localStorage.setItem('aic.nick',nm);"));assert(source.includes('.jt14-save{display:none!important}'));});
test('QA29 action chips sit behind every modal',()=>{assert(source.includes('#ctxbar,#actorMenu{z-index:19!important}'));});
test('QA33 sconces stay lit during the ceremony, no toasts then, tree chips return afterwards',()=>{
  assert(source.includes('/* QA33: 벽등(근처 조명·광륜·발광 재질 포함)은 소등하지 않음 */'));assert(source.includes('if(window.QA_TREE_ON)return/* QA33: 점등식 중 알림 없음 */'));assert(source.includes('/* QA33: 점등식 후 트리 칩(트리 점등·살펴보기) 복귀 */'));});
test('QA34 star faces the viewer, glow only, gold dust, toast matches nav width',()=>{assert(source.includes('window.qa34StarFace='));assert(!/\bDUST\b/.test(source),'QA35에서 없앤 금빛 반짝이는 코드도 남기지 않음');assert(source.includes('size:.4/* QA325'));assert(source.includes('GL.sl.intensity=0/* QA34'));assert(source.includes('/* QA34: 하단 네비와 같은 가로 길이 */'));assert(source.includes('text-wrap:balance'));});
test('QA36 random pick relabels to re-pick, options centered, darker room keeps the tree lit',()=>{assert(source.includes("'랜덤 다시 선택':'랜덤 선택'"));assert(source.includes('#join .jt2-opts{left:0!important;right:0!important;transform:none!important;justify-content:center!important'));assert(source.includes('dim:s<.6?1-s/.6*.72:.28/* QA36·58'));});
test('QA37 tree stands at the lobby centre and first entry faces the theatre with the entrance behind',()=>{const w=fs.readFileSync(require('path').join(__dirname,'..','qa11-winter.js'),'utf8');assert(w.includes('g.position.set(-6.8,0,14.6)/* QA58'));assert(source.includes("layEnd(m_,'spawn','입장 위치',0,{noDup:1,noDel:1,px:0,pz:17.3})"));assert(source.includes('{x:0,z:17.3,r:Math.PI}'));});
test('QA39 Alfredo offers only a talk chip that opens the quiz, seats show gold number plates, club waits for the film, hall camera frames the screen',()=>{assert(source.includes("bt('actorUse','','퀴즈 풀기'))"));assert(source.includes("add('sit',selSeat.label+'번 앉기',' class=\"ivory\"');add('ctxother','다른 자리 앉기')"));assert(source.includes('html body #sitbox,html body #sitbox:not([hidden]){display:none!important}'));assert(source.includes("m.name='qa39-seat-labels-'+h.id"));assert(source.includes('function qa39ClubLoading()'));assert(source.includes('if(hz&&!s){/* QA39'));});
test('QA66 quick bar opens the editor module with the full character list, live Three.js preview, save and sync; arms are longer with rounded shoulders',()=>{const fs5=require('fs'),p5=require('path'),ed=f=>fs5.readFileSync(p5.join(__dirname,'..','editor',f),'utf8');assert(source.includes("'avatar:캐릭터','camshot:카메라'"));assert.equal((source.match(/\{id:'w\d\d',n:'/g)||[]).length,6);assert.equal((source.match(/\{id:'m\d\d',n:'/g)||[]).length,4);assert(source.includes("await import('./editor/editor.js')"));assert(source.includes('renderPreview:qa66Preview,disposePreview:qa66Dispose,save:qa66Save'));assert(source.includes("const characters=[{id:autoId,label:'기본 캐릭터',image:QA40.autoImg},...mix]")&&source.includes('plain=LOOK10.map('));assert(source.includes("localStorage.setItem('aic.look',spec)"));assert(source.includes('function qa40Rebuild(av,name,look,isMe)'));assert(source.includes("if(kind==='k'){/* QA40: 상대가 고른 캐릭터 */"));assert(source.includes('const AL=.05/* QA40: 팔 길이 +3px */'));assert(source.includes('/* QA40: 어깨를 둥글게'));assert(source.includes('return {start,tick,openChat};'));assert(ed('editor.js').includes('export async function openAvatarEditor'));assert(ed('catalog.js').includes("['none','없음'],['round','라운드 안경'],['sun','선글라스'],['square','사각 안경']"));for(const k of ["o.hat==='bowler'","o.bag==='rattan'","SS==='maryjane'","if(o.gsq)"])assert(source.includes(k),k);assert(!source.includes('ccdlg'));});
test('QA67 lobby music control is a shadcn-style toggle whose pressed state means music on',()=>{assert(!source.includes("#lobbyMusic[data-state=on]{"))/* QA120부터 켜짐·꺼짐은 아이콘으로만 구분 — 덮여 있던 색 규칙은 QA326에서 삭제 */;assert(source.includes("b.setAttribute('aria-pressed',String(on))"));assert(source.includes("b.dataset.state=on?'on':'off'"));});
test('QA44 tree tick declares endS before use, auditorium is gently stepped, mobile playback turns landscape, bottom nav splits evenly',()=>{const i=source.indexOf('window.qa13TreeTick=function(){'),seg=source.slice(i,i+2600);assert(seg.indexOf(',endS=')<seg.indexOf('if(s>=endS)'));assert.equal(seg.split(',endS=').length,2);assert(!source.includes('ELEV=i=>'));assert(source.includes('<script id="qa44-landscape">'));assert(source.includes('html.qa44-rot body{'));assert(source.includes('/* QA44: 모바일 하단 네비 5칸 균등 배치 */'));assert(source.includes('/* QA47: 치마·원피스도 다리 전체 길이'));assert(source.includes('function qa47GiftCam(target)'));});
test('QA46 tickets have filled sides; punching cuts only a right-center half circle',()=>{const fs2=require('fs'),p2=require('path'),rd=f=>fs2.readFileSync(p2.join(__dirname,'..','qa14_assets',f),'utf8');assert(source.includes('src="qa14_assets/join-plain.svg"'));assert(source.includes('src="qa14_assets/join-half-r.svg"'));assert(source.includes(".tc3[data-punched=\"true\"]::before{-webkit-mask-image:url('qa14_assets/hall-half-r.svg')"));const curves=f=>(rd(f).match(/ d="([^"]*)"/)[1].match(/C/g)||[]).length;assert.equal(curves('join-plain.svg'),0);assert.equal(curves('hall-plain.svg'),0);assert.equal(curves('join-half-r.svg'),1);assert.equal(curves('hall-half-r.svg'),1);});
test('QA49 selecting an actor eases the camera lower and closer to frame both, and restores on dismiss',()=>{assert(source.includes('<script id="qa49-talk-camera">'));assert(source.includes('showActorMenu=function(target){'));assert(source.includes('dismissActor=function(){'));{const i=source.indexOf('<script id="qa49-talk-camera">'),seg=source.slice(i,source.indexOf('</script>',i));assert(!/camYaw\s*[+\-]?=/.test(seg),'conversation camera must not rotate');assert(seg.includes('function clipDist(target,want)'));assert(seg.includes('qa47GiftCam=function(t){'));}assert(source.includes('window.qa49TalkCam={start,stop}'));});
test('QA50 lobby point lights reach farther with gentler falloff so the floor reads evenly',()=>{assert(source.includes('/* QA50: 로비 바닥 조도 차이 완화'));assert(source.includes('const LP_LAMP=.483,LP_GLOW=1.1;'))/* QA326: 전체 밝기를 낮추는 대신 등불은 10% 밝게(.399×1.21) */;assert(source.includes('if(o.distance>0)o.distance*=1.55;o.decay=1;o.intensity*=LP_LAMP'));});
test('QA55 lobby materials are driven by LOBBY_PALETTE: panel walls on both floors and the stair side, dark wood frames, dusty pink/cream floor, cream ceiling trim',()=>{assert(source.includes('const LOBBY_PALETTE={'));assert(source.includes('floorCream:"#E1DBD1",floorPink:"#D2BDA3",wallWood:"#865A32",wallDark:"#563115"'));assert(source.includes('TM[LINEN]=TM[WAINS];TM[MU2]=TM[WAINS];'));assert(source.includes('TM[FRAME]=LP_mat(FRAMET'));assert(source.includes('A=LPFL.cream,Bc=LPFL.dark'));assert(source.includes('LOBBY_PALETTE.ceilingTrim.color'));assert(source.includes('wseg(-LW,LW,0,4.3,LB-.2,MU2);wseg(-LW,LW,4.3,8.8,LB-.2,MU2);B(2*LW,.22,.06,FRAME,0,4.42,LB+.03);'));assert(source.includes('return;/* QA53·56: 로비 벽돌 기둥·장식 전부 삭제 */'));});
test('QA56 burgundy rails, softer neutral lobby light, natural tree greens, no lobby brick columns',()=>{const fs3=require('fs'),p3=require('path'),w=fs3.readFileSync(p3.join(__dirname,'..','qa11-winter.js'),'utf8');assert(source.includes('TM[MET]=new THREE.MeshPhongMaterial({color:0x2b1711'));assert(source.includes('const LOBBY_HEMI=.756,LOBBY_DL=.1575,LOBBY_HC=0xf2e1cf,LOBBY_DC=0xffe3c2'));assert(source.includes('return;/* QA53·56: 로비 벽돌 기둥·장식 전부 삭제 */'));assert(w.includes('const greens=[0x2c4722,0x38572a,0x446733,0x51763b]'));});
test('QA57 wall wood is tuned slightly deeper to match the reference render',()=>{assert(source.includes('TM[WAINS]=LP_mat(PANELT,LPW.panelWidthMeters*8,LPW,.32,.9975)'));assert(!source.includes('const k=new THREE.Color(1.03,.975,.86)'));});
test('QA58 tree sits left of the ticket booth, the table moves in front of the shop, ceremony is 20% less dark and brightens gradually',()=>{assert(source.includes('x=4.4,z=16.6/* QA58'));assert(source.includes('dim=s>=endS-3.2?Math.min(1,p.dim+(s-(endS-3.2))/3.2*(1-p.dim))'));assert(source.includes('endS=active.greetingAt!==null?active.greetingAt+10+3.2:40'));assert(source.includes('(tree.position.x<-4?.1:.42)'));});
test('QA59 soft clay pass tones down gloss and self-illumination on characters and lobby objects, keeping palette materials',()=>{assert(source.includes('function clayify(m){'));assert(source.includes('m.userData.tile=tile;m.userData.keep=1;LP_MATS.push(m);return m};'));assert(source.includes('if(root&&root.userData&&root.userData.legs)clayObject(root);'));assert(source.includes('if(HSET.has(r)||club.has(r))return;clayObject(r)'));});
test('QA60 tree bulbs follow one spiral string from bottom to top; bells are not lights',()=>{const fs4=require('fs'),p4=require('path'),w=fs4.readFileSync(p4.join(__dirname,'..','qa11-winter.js'),'utf8');assert(w.includes('f*Math.PI*2*(o.lightTurns||7)'));assert(w.includes("const bellMat=new THREE.MeshLambertMaterial({color:0x9c8246})"));assert(!/ConeGeometry\(\.05,\.09,10,1,true\),gd,/.test(w));});
test('QA63 lighting the tree first walks the player to the best viewing spot; tree lights fade out at the end',()=>{assert(source.includes('const VIEW={x:tree.position.x+3.4,z:tree.position.z+.6};'));assert(source.includes('if(!start.ready){goView();return}start.ready=false;'));assert(source.includes('GL.pts.material.opacity*=f;GL.l.intensity*=f;GL.l2.intensity*=f;'));});
test('QA68 a photo opens a preview with keep-in-bag, discard and download; bag photos stay on the device',()=>{assert(source.includes("const QA68={key:'aic.photos',max:10,list:null,cur:null};"));for(const k of ['data-ph="drop">버리기<','data-ph="down">다운받기<','data-ph="keep">가방에 넣기<','data-a="qa68open"',"qa68Show({src:url,url,full:print,small:sm.toDataURL('image/jpeg',.85),idx:null})"])assert(source.includes(k),k);const i=source.indexOf('async function qa20Photo(){'),seg=source.slice(i,i+1600);assert(!/fetch\(|XMLHttpRequest/.test(seg));});
test('QA70 ordinary chairs and sofas use a walk-up, turn and knee-bend sit animation; cinema seats stay instant',()=>{assert(source.includes('function sitLegPose(u,k){'));assert(source.includes('const SIT_TURN=.5,SIT_DOWN=.65;'));assert(source.includes('if(u.sitAnim){sitStep(c,dt);return}'));assert(source.includes('function sit(c,sp,opt={}){const u=c.userData,prevRot=c.rotation.y;'));const i=source.indexOf('function sit(c,sp,opt={})'),seg=source.slice(i,i+1400);assert(seg.includes("if(sp.kind==='cine'){if(u.seatedLegs){u.seatedLegs.visible=false;u.legs.forEach(l=>l.visible=true)}c.position.set(sp.x,sp.y,sp.z);c.children[0].scale.y=.78}"));assert(source.includes('<=(u.path.length?.3:1.8)'));});
test('QA72 each hall has 64 flat seats (4+4 by 8 rows, A01~H08), width 14.88, and a door-icon exit at the end of the quick bar',()=>{assert(source.includes("const SEATS_PER_SIDE=(typeof QA386M!=='undefined'&&QA386M)?3:4/* QA230: 양쪽 4석씩(64석) · QA386: 휴대폰 3석씩 */, NSR=SEATS_PER_SIDE*2, NSEAT=ROWS.length*NSR;"));assert(source.includes('HX=8.5/*'));assert(source.includes('SCW=2*HX-1.3'));assert(source.includes(',SCH=SCW*9/16,SCY=1.9+SCW*9/32'));assert(!source.includes('hallElev('));assert(source.includes('return u.lvl*4.2+(u.floorOffset||0)+hy_'));
 const vm=require('vm'),ctx={pad:n=>String(n).padStart(2,'0')};vm.createContext(ctx);const i=source.indexOf("const ROWS='ABCDEFGH'"),j=source.indexOf('const API={',i);vm.runInContext(source.slice(i,j)+';this.o={NSEAT,L:[...Array(NSEAT)].map((_,k)=>seatLabel(k)),X:[...Array(NSR)].map((_,k)=>hallSeatX(k))}',ctx);
 assert.equal(ctx.o.NSEAT,64);assert.equal(ctx.o.L[0],'A01');assert.equal(ctx.o.L[7],'A08');assert.equal(ctx.o.L[8],'B01');assert.equal(ctx.o.L[63],'H08');assert.equal(new Set(ctx.o.L).size,64);
 const X=ctx.o.X,arm=.565+.075,aisle=X[4]-X[3]-2*arm,side=7.44-(X[7]+arm),gap=X[1]-X[0]-2*arm;assert(Math.abs(X[0]+X[7])<1e-9);assert(aisle>.6,'aisle '+aisle);assert(side>.3&&side<3,'side '+side);assert(gap>.1,'gap '+gap);/* QA135: 3+3, 좌석 사이 간격 *//* QA127·128: 상영관 확장 — 옆 통로가 넓어짐 */
 const hud=source.slice(source.indexOf('function hudUpd(){'),source.indexOf('function toLobby('));assert(hud.includes('data-a="exithall" data-k="${zc[1]}" aria-label="로비로 나가기">${lucide(\'hallDoor\')}<span>${inH?\'나가기\':\'로비로 나가기\'}</span>'));assert(hud.includes("if(inH){"))/* QA133 · QA384: 아지트 나가기는 퀵바 밖 */;assert(!hud.includes('data-a="cstand"'));assert(!hud.includes('data-a="mpchat"'));
 const ctxm=source.slice(source.indexOf('function qa20Ctx('),source.indexOf('function hudUpd(){'));assert(!ctxm.includes("add('exithall'"));assert(source.includes('exithall:d=>{/* QA72'));});
test('QA73 lobby materials follow the 2026-11-14 Figma palette through lobby-only materials',()=>{
 const m=source.match(/const LP_DEF=Object\.freeze\((\{[^}]*\})\);/);assert(m);const def=JSON.parse(m[1].replace(/(\w+):"/g,'"$1":"'));
 assert.deepEqual(def,{floorCream:'#E1DBD1'/* QA326: 노란 기를 뺀 아이보리 */,floorPink:'#D2BDA3',wallWood:'#865A32',wallDark:'#563115',carpetA:'#E7BFC2',carpetB:'#CCA4A6',railing:'#37110B',railingBase:'#170702',goldTrim:'#DEB967',sidePanel:'#643817',counterTop:'#784B21',counterBody:'#602415',glass:'#A6BDB0'});assert(!source.includes('LPFL.grout'));assert.deepEqual(0,0);
 assert(source.includes("B(w-.5,.03,.03,GOLDT,"));assert(source.includes("B(.05,h,d+.01,'lpSide',x0-.02,h/2,zc)"));assert(source.includes("cyl(r,r,1.05,.6,TM.lpBody)"));assert(source.includes('03 REFRESHMENTS: QA179'));assert(source.includes("BUVETTE"));
 assert(source.includes("const LP_GLASS=glassM.clone()"));assert(source.includes("new THREE.BoxGeometry(w,h,.02),LP_GLASS)"));
 /* 다른 공간과 공유하는 마호가니·황동 재질 정의는 그대로 */assert(source.includes("WD=0x6b3a20,WD2=0x8a5a34"));assert(source.includes("BR=0xc9a24a"));assert(source.includes("const glassM=new THREE.MeshPhongMaterial({color:0xdde8ea,transparent:true,opacity:.14"));
 assert(source.includes("LP_DRAW.floor=(c,W,H)=>"));assert(source.includes("LP_DRAW.wall=(c,W,H)=>"));assert(source.includes("LP_DRAW.frame=(c,W,H)=>"));});
test('QA74 admin can edit lobby colours and lighting (50-150%, 2700-6500K opt-in) with preview, save and reset',()=>{
 assert(source.includes("['admlobby','로비 컬러·조명·톤']"));assert(source.includes("PANELS.admlobby=()=>{if(!ADM){PANELS.admlogin();return}"));
 assert(source.includes('id="lpa_b" min="50" max="150" step="5"'));assert(source.includes('id="lpa_k" min="2700" max="6500" step="100"'));assert(source.includes("lpasave:()=>{if(!ADM)return;"));assert(source.includes("lpareset:()=>{if(!ADM)return;localStorage.removeItem('aic.lobbyPalette');localStorage.removeItem('aic.lobbyLighting')"));
 assert(source.includes("if(window.lpaRevert)window.lpaRevert()"));assert(source.includes("'aic.lobbyPalette','aic.lobbyLighting','aic.wallAdds','aic.charTone','aic.donate','aic.uiColors'];"));
 assert(source.includes("HEMI.intensity=k==='B'?.3145:k>0?.28:LOBBY_HEMI*LP_LIGHT.b;"));assert(source.includes("dl.intensity=LOBBY_DL*LP_LIGHT.b"));assert(source.includes("const LOBBY_HEMI=.756,LOBBY_DL=.1575,LOBBY_HC=0xf2e1cf,LOBBY_DC=0xffe3c2"));
 const vm=require('vm'),ctx={THREE:{Color:function(r,g,b){this.v=[r,g,b]}},LP_LIGHT:{b:1,k:null}};vm.createContext(ctx);const i=source.indexOf('function LP_kRGB('),j=source.indexOf('function LP_lights(');vm.runInContext(source.slice(i,j),ctx);
 assert.deepEqual(ctx.LP_tint().v,[1,1,1]);ctx.LP_LIGHT.k=4500;ctx.LP_tint().v.forEach(x=>assert(Math.abs(x-1)<1e-9));ctx.LP_LIGHT.k=2700;{const [r,g,b]=ctx.LP_tint().v;assert(r>g&&g>b&&b>.5)}ctx.LP_LIGHT.k=6500;{const [r,g,b]=ctx.LP_tint().v;assert(b>g&&g>r&&r>.6)}});
test('QA75 quick bar has no chat entry, NPC menus have no talk action, Alfredo offers only the quiz',()=>{
 const hud=source.slice(source.indexOf('function hudUpd(){'),source.indexOf('function toLobby('));assert(!hud.includes('mpchat'));
 const menu=source.slice(source.indexOf('function showActorMenu('),source.indexOf('function selectAvatar('));assert(!menu.includes("bt('actorTalk'"));assert(menu.includes("if(u_.buff&&!u_.remote){"));assert(menu.includes("bt('actorClub','','아지트 가기'):bt('actorUse','','퀴즈 풀기'))"));assert(menu.includes("bt('actorGift','giftmenu','선물하기')"));assert(menu.includes("bt('actorWave','','손 흔들기')"));
 assert(source.includes("Object.assign(A,{actorGift,actorUse,actorClub});"));assert(!/A\.actorTalk|actorTalk:/.test(source));});
test('QA78 screening view: camera approach, sconces off, replay, chip-style overlay buttons, external-link title chip, fixed-size labels',()=>{
 /* QA85: 상영 전후 같은 시점(기준 버전 de74875 방식) — 별도 관람 시점·영상 확대 없음 */assert(!source.includes('qa80View'));assert(!source.includes('QA78_Z'));assert(source.includes('QA173: 관람 시점'));
 assert.equal(source.split("qa127Cam(H,hv,cp,lk)").length-1,3);assert(source.includes("function qa127Cam("));/* QA127: 모든 좌석 같은 정면 시점, 내 자리까지 줌아웃 *//* QA126: 내 자리 뒤·위, 정면 시선 *//* QA118: 관람 시점은 내 자리 뒤·위 */
 assert(source.includes("if(QA85_CINE)C.fov=2*Math.atan(Math.tan(C.fov*Math.PI/360)*SCW/14.2)*180/Math.PI;"));assert(source.includes("function closeCine(){document.body.classList.remove('qa135play');CINE_DONE=false;QA85_CINE=false;rs();"));
 {/* H열에서 스크린이 화면 가로의 약 51%(기준 버전과 동일) */const SCW=2*6.2*14.2/18.8,fov=2*Math.atan(Math.tan(32*Math.PI/180)*SCW/14.2),d=(-6.96+2)+17.55,frac=SCW/(2*d*Math.tan(fov/2)*16/9),old=14.2/(2*d*Math.tan(32*Math.PI/180)*16/9);assert(Math.abs(frac-old)<1e-9);assert(Math.abs(frac-.507)<.01)}
 assert(source.includes("HALL_GLOW[space].forEach(e=>{e.h.material.opacity*=HLF})"));assert(source.includes("HALL_SC[space][0].color.setHex(0xfff1da).multiplyScalar(k)"));
 assert(source.includes("$('watch').textContent='다시 보기';$('watch').hidden=false}"));assert(source.includes("if(curSp&&CINE_DONE){/* QA78: 다시 보기"));
 assert(source.includes('<button id="cyt" type="button" title="유튜브에서 보기" aria-label="유튜브에서 보기"><span id="qa-yt-label"></span><svg'));assert(source.includes("label='유튜브에서 보기'"));
 /* QA83 */assert(source.includes("cstand:()=>{if(!me||!me.userData.seat)return;/* QA83"));assert(source.includes("||!(curSp&&curSc&&curSp.hall===space&&!CINE_DONE)&&!(window.QA234SEQ"));assert(source.includes("HLF=on?Math.min(1,HLF+dt/4):HLF+(0-HLF)*Math.min(1,dt*1.1);"));assert(source.includes("$('cyt').onclick=()=>$('ext').onclick();"));assert(!/openCine\(sp\)\{[^\n]*window\.open/.test(source));
 assert(source.includes('body.inhall #mpbar,body.cineseat #mpbar{display:none!important}'));assert(source.includes("html body #watch{height:42px;padding:0 13px;border-radius:999px;background:rgba(28,20,22,.72)"));assert(source.includes("html body #ctxbar button.on{background:rgba(28,20,22,.72)"));
 assert(source.includes("#cine iframe{position:absolute;left:0;top:-60px;height:calc(100% + 120px)!important}"));
 assert(source.includes("s.material.sizeAttenuation=false"));/* QA86: 말풍선은 다시 월드 크기 */assert(source.includes("f=`400 ${fs}px \"Noto Sans KR\",sans-serif`"))/* QA294: 말풍선 글자 한 단계 얇게 */;assert(source.includes("sprite.scale.set(.8*w/(fs*3.2),.8*h/(fs*3.2),1)/* QA86"));});
test('QA84 lobby: chandelier bulbs glow, Champs-Elysees street outside, NPC spots clear of the tree',()=>{
 assert(source.includes("const flame=new THREE.MeshBasicMaterial({color:0xffe9bd,toneMapped:false});"));assert(source.includes("bulb.parent.add(h);EMG.push({h,b:.8,f:1.2+Math.random()})"));
 assert(source.includes("['CAFÉ DU COIN · TABAC','#7a1f2b','cafe']"));assert(!source.includes("['PHARMACY'"));assert(!source.includes("철제 비상계단(지그재그)"));assert(source.includes("QA84 파리 스카이라인: 에펠탑 · 개선문 실루엣"));assert(!source.includes("vcar(0xf2c230"));
 const q=source.match(/const QUIET=(\[\[[^;]*?\]\]),cafes=/);assert(q);const spots=eval(q[1].replace(/\/\*.*?\*\//g,''));spots.forEach(([x,z])=>assert(!(x<-4.9&&z>12.6&&z<16.9),'spot near tree '+x+','+z));
 assert(source.includes("if(zn==='L0'&&x< -4.9&&z>12.6&&z<16.9)continue"));});
test('QA86 ticket issue walks into the hall with a notice, club board says not ready, bubbles back to world size',()=>{
 assert(source.includes('<button type="button" class="qa88-buy" data-a="buy" data-s="${sc.id}">입장하기</button>'));
 const buy=source.slice(source.indexOf('buy:async d=>{const s=SC[d.s]'),source.indexOf(' fl:d=>PANELS._sel(d.i),'));assert(buy.includes('await punchHere(r.ok);API.punch(r.ok.id);'));assert(buy.includes("toast(`${s.hall.name}으로 입장합니다`)"));assert(buy.includes("walkTo(me,HCX[hid],-1.7,'H'+hid,{after:qa142View})"));assert(!buy.includes('me.position.set('));
 assert(source.includes("const fresh=QA86_JUST===tk.id;"));
 assert(source.includes("hitbox(X+x-.05,1.95,Z-1.6,.3,1.75,2.95,{fn:()=>toast('준비 중입니다'),pt:{x:X+x-1.2,z:Z-1.6,zone:'B'}})"));
 assert(source.includes("function qa78Bubble(c,s){")&&source.includes("if(!s.userData.px){let base=")/* QA409: 월드 크기 말풍선 유지 · 높이는 이름표/머리 기준 */);});
test('QA87 a punched ticket still routes around lobby furniture to the hall gate first',()=>{assert(source.includes("if(c===me&&HZ[tz]&&curZone(c)!==tz&&hasPass(HZ[tz])&&!opt.viaGate){const g_=GATE[HZ[tz]];if(curZone(c)===g_.zone&&Math.hypot(c.position.x-g_.x,c.position.z-g_.z)>1.5){const o2=Object.assign({},opt,{viaGate:1});return walkTo(c,g_.x,g_.z,g_.zone,{after:()=>walkTo(c,x,z,zone,o2)})}}"));});
test('QA88 hands hold two, the rest go to the bag; context discard opens the bag and drops in place; trash can still walks there',()=>{
 assert(source.includes("if(me)setCarry(me,QA115_OFF?[]:HELD.slice(0,1))/* QA115"));assert(source.includes("toast(`나머지 ${now-was}개는 가방에 넣었어요`)"));
 assert(!source.includes("qa88-hand\">(손에 듦)"));assert(source.includes("trash:()=>{/* QA88"));assert(source.includes("toast('휴지통에 버렸습니다')"));assert(source.includes("hitbox(x,y+.42,z,.49,.91,.49,{now:1,fn:()=>askTrash(),"));});
test('QA91 interaction policy: tap a chair to walk and sit, exits live at the quick bar end, one name per action, clear notices',()=>{
 assert(source.includes("function pickSeat(hid,sp){if(sp.taken&&sp.taken!==me){toast('이미 누가 앉아 있어요');return}/* QA91"));assert(source.includes("selSeat=sp;paintSeats();walkToSpot(me,sp);return;"));assert(!source.includes("say(me,'이미 앉은 자리예요')"));
 assert(!source.includes("add('goup'"));assert(source.includes(`zc==='B'?'data-a="goup"':'data-a="exithall"'`));
 assert(!/add\('tt','(다음 회차|상영작 보기|상영작 정보)'\)/.test(source));assert(source.includes('id="go" class="jt2-go">ENTER'));
 assert(!source.includes("'손이 가득 찼어요"));assert(source.includes("'가방이 가득 찼어요'"));assert(!source.includes('의자를 눌러 앉으면 바로 상영'));assert(!source.includes('보드를 눌러 한줄평 남기기'));});
test('QA93 policy checklist: objects open without a chip step, film-title field, stand up after closing the screen, ticket button below, not-ready toast, one-line gift notices',()=>{
 assert(source.includes("function qa20Obj(act,o,az){/* QA93"));assert(source.includes("const show=()=>{QA20.obj=null;act.fn();hudUpd()};"));
 assert(source.includes('placeholder="영화 제목"'));
 assert(source.includes("if(sp&&(sp.kind!=='cine'||!document.body.classList.contains('cineseat'))){/* QA93"));
 assert(source.includes('<button type="button" class="qa88-buy" data-a="enter" data-id="${t.id}">입장하기</button>'));assert(!source.includes("tag:on?'button':'div'"));
 assert(source.includes("if(CLOSEDH.has(h.id)){toast('준비 중입니다');return}"));assert(source.includes("'선물할 물건이 없어요'"));assert(!source.includes('매점이나 꽃가게에서 먼저 받아주세요'));
 assert(source.includes("const AdService={busy:false,providers:{h5:{},gpt:{},mock:{}},async show(){return true}};"));});


test('QA94 mission and combined-state fixes',()=>{
 assert(source.includes("o===HN.IB){const c2=hs.find(q=>q.object===HN.IC"));
 assert(!source.includes("쟁반에 담아 들었어요"));
 assert(source.includes("if(!hasInv()){toast('초대장이 있어야 열리는 책장이에요');return}trapShow(true)"));
 assert(source.includes('id="cx" title="그만보기" aria-label="그만보기"'))/* QA133 */;
 assert(source.includes("GIVE_OFFER=null;closePanel();giveItem(index)}"));
 assert(source.includes("data-a=\"bagdelsel\" disabled>선택 버리기</button>"));
 assert(source.includes("가방이 가득 찼어요. 먼저 먹거나 버려주세요."));
 assert(source.includes("/* QA95: 상영관에선 먹기 없음(들고 있기만) */"));
 assert(source.includes("ORD.st==='ready'&&!inH)add('oget'"));
 assert(source.includes("/* QA338: 사진 찍기는 퀵바 카메라로 */")&&source.includes("A.camshot="))/* QA338: 장소 제한 없이 퀵바 카메라 */;
 assert(source.includes("const seatNear=!!me.userData.seat&&"));
 assert(source.includes("selectAvatar(t,{gift:1})"));
 const ed=require('fs').readFileSync(require('path').join(__dirname,'..','editor','editor.js'),'utf8');assert(ed.includes("{color:'색상'}")/* QA411: 색상 탭은 모바일에서만(PC는 CSS로 숨김) */&&ed.includes('닉네임<input')&&ed.includes("className='color-chip'"));/* QA125: 색상 탭 → 왼쪽 컬러칩, 닉네임 문구 */
});

test('QA95 performance and eating fixes',()=>{
 assert(source.includes('function qa95Budget(){')&&source.includes('function qa95LightVis(){')&&source.includes('qa95Budget()}'));
 assert(!/data:image\/(jpeg|png);base64,[A-Za-z0-9+\/=]{2000,}/.test(source));
 assert(source.includes("eat1:d=>startEat(+d.i)")&&source.includes("const i=HELD.indexOf(EAT.it);"));
 assert(source.includes("if(i===eatingI()){EAT=null;"));
 assert(source.includes("if(!me||EAT)return;/* QA133: 관람 좌석에서도 먹기 */"));/* QA114: 상영관에서도 먹기, 관람 좌석만 예외 */
 for(const m of source.matchAll(/qa95_assets\/img-[0-9a-f]+\.(jpg|png)/g))assert(require('fs').existsSync(require('path').join(__dirname,'..',m[0])));
});

test('QA100 snack rules, unified bag discard, hall snacks',()=>{
 assert(source.includes("const QA341_EAT=180;")&&source.includes("EAT={t:0,t0:n,until:n+D,it,l0:eatLeft(it),d:D}")&&source.includes("toast(nm+objectParticle(nm)+' 다 먹었어요'+(wr?"));
 assert(source.includes("data-a=\"bagdelall\">모두 버리기</button>")&&source.includes("bagdelallyes:"));
 assert(source.includes("간식을 먹으면서 영화를 볼까요?")&&source.includes("function qa100Tag(){"));
 assert(source.includes("const MAXH=Infinity;")&&!source.includes("cap=Math.min(5,MAXH-HELD.length)"));
});

test('QA102 first concept batch: tests, boards, free seating, light rhythm, instant photo, easter eggs, credits, licence fields',()=>{
 assert(source.includes("const zc=18.2,X=LW-.18;")&&source.includes("'TOUR EIFFEL':'ARC DE TRIOMPHE'"));
 assert(source.includes("if(window.QA102_FREESEAT!==false)return;")&&source.includes("${hallCfg(hid).name} · 빈자리"));
 assert(source.includes("const b=LP_LIGHT.b*(window.QA102_LF||1)")&&source.includes("const tg=on?.78:1"));
 assert(source.includes("g.fillText('Paris · déc. 1979',540,nmY())"));
 assert(source.includes("const RUMORS=")&&source.includes("'qa102arch'")&&source.includes("fillText('CABINE'"));
 assert(source.includes("credit:'제작 Psyche_26 · AI 창작'")&&!source.includes("genre:'고전영화'"));
 assert(source.includes("['license','권리 근거"));
});
