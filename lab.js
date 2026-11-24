/* LAB: 색감·카메라 테스트. 대표 캐릭터 1명 + 바닥 + 뒷벽만 남기고 나머지는 숨긴다.
   index.html 뒤에 붙어 실행되며 운영 코드는 건드리지 않는다. 저장값(aic.*)도 쓰지 않는다. */
(function(){
'use strict';
window.returnconnect=function(){};/* 멀티 주소를 비우면 운영 코드의 'returnconnect()' 오타가 터짐 → 빈 함수로 막음 */
const PRESET={
 now:{b:110,k:4800,hc:'#fff0e0',dc:'#ffe3c2',floor:'#E2DCC1'},
 v1:{b:100,k:4800,hc:'#fdf0e9',dc:'#fde3ca',floor:'#E1DBD1'}};
const GRADE0={ev:0,bri:0,con:1,sat:1,temp:6500,tint:0,vig:0,grain:0};
const CAM0={dist:6.5,h:2.2,yaw:0,look:1.1,fov:45};
const st={cam:Object.assign({},CAM0),lt:Object.assign({},PRESET.now),g:Object.assign({},GRADE0)};
const hex=s=>parseInt(s.slice(1),16);
const $=id=>document.getElementById(id);

/* ── 장면 정리 ── */
const isKeep=o=>{const m=o.material&&(Array.isArray(o.material)?o.material[0]:o.material),t=m&&m.map;
 if(!t)return false;if(LP_FLOORT.includes(t))return true;
 if(t===PANELT){const b=new THREE.Box3().setFromObject(o),z=(b.min.z+b.max.z)/2;return z>-4.5&&z<-3.9&&b.max.x-b.min.x>=16}
 return false};
function prune(o){let keep=false;
 if(o===me||o.isLight)return true;
 if(o.isMesh&&isKeep(o))keep=true;
 o.children.forEach(c=>{if(prune(c))keep=true});
 o.visible=keep;return keep}
function fillGap(){/* 운영 장면은 벽(z -4)과 바닥(z 0~20) 사이가 비어 있어, 바닥을 한 장 더 붙여 이어준다 */
 let f=null;S.traverse(o=>{if(!f&&o.isMesh&&o.material&&o.material.map&&LP_FLOORT.includes(o.material.map)&&new THREE.Box3().setFromObject(o).max.x<10)f=o});
 if(f){const g=f.clone();g.position.z-=4;S.add(g)}}
function setup(){
 const n=$('cine-first-load');if(n)n.remove();
 enterNow('하나');
 setTimeout(()=>{
  me.position.set(0,0,2);me.rotation.y=0;
  fillGap();prune(S);
  setInterval(()=>{me.position.set(0,0,2);me.rotation.y=0;prune(S)},1500);
  ui();
 },900)}

/* ── 카메라·조명 (매 프레임) ── */
function applyCam(){const c=st.cam,y=c.yaw*Math.PI/180;
 C.fov=c.fov;
 const L=$('lab'),W=innerWidth,H=innerHeight,ph=L&&W<900&&!L.classList.contains('c')?L.offsetHeight:0;/* 모바일은 패널에 가려지지 않게 화면을 위로 올림 */
 if(ph)C.setViewOffset(W,H,0,ph/2,W,H);else C.clearViewOffset();
 C.updateProjectionMatrix();
 C.position.set(me.position.x+Math.sin(y)*c.dist,c.h,me.position.z+Math.cos(y)*c.dist);
 C.lookAt(me.position.x,c.look,me.position.z)}
function applyLight(){LP_LIGHT.b=st.lt.b/100;LP_LIGHT.k=st.lt.k;/* 운영 값은 비율(1.0=100%) */
 LP_lights();/* 점조명 포함 밝기·색온도는 운영 함수 그대로 */
 const t=LP_tint();HEMI.color.setHex(hex(st.lt.hc)).multiply(t);dl.color.setHex(hex(st.lt.dc)).multiply(t)}
function wrapRender(){const o=window.qa124Render;
 window.qa124Render=function(){try{applyCam();applyLight()}catch(e){}return o.apply(this,arguments)}}

/* ── 포인터: 드래그로 회전, 휠로 거리 ── */
function pointer(){const cv=R.domElement;let d=null;
 const stop=e=>{if(e.target===cv){e.stopImmediatePropagation()}};
 ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(t=>window.addEventListener(t,stop,true));
 cv.addEventListener('pointerdown',e=>{d={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
 cv.addEventListener('pointermove',e=>{if(!d)return;st.cam.yaw+=(e.clientX-d.x)*.4;st.cam.h=Math.max(.3,Math.min(8,st.cam.h+(e.clientY-d.y)*.02));d={x:e.clientX,y:e.clientY};sync()});
 cv.addEventListener('pointerup',()=>{d=null});
 cv.addEventListener('wheel',e=>{st.cam.dist=Math.max(2,Math.min(16,st.cam.dist+e.deltaY*.005));sync();e.preventDefault()},{passive:false})}

/* ── 패널 ── */
const SL=[
 ['조명',null],
 ['밝기','lt.b',50,150,1],['색온도(K)','lt.k',2700,6500,100],
 ['반구광 색','lt.hc','color'],['직사광 색','lt.dc','color'],['바닥 크림','lt.floor','color'],
 ['색 보정',null],
 ['노출 EV','g.ev',-1,1,.01],['밝기','g.bri',-.2,.2,.01],['대비','g.con',.7,1.4,.01],['채도','g.sat',0,1.6,.01],
 ['색온도','g.temp',3500,9000,50],['틴트','g.tint',-1,1,.01],['비네트','g.vig',0,1,.01],['그레인','g.grain',0,1,.01],
 ['카메라',null],
 ['거리','cam.dist',2,16,.1],['높이','cam.h',.3,8,.05],['가로 회전','cam.yaw',-180,180,1],['시선 높이','cam.look',0,3,.05],['FOV','cam.fov',20,90,1]];
const get=p=>{const[a,b]=p.split('.');return st[a][b]};
const put=(p,v)=>{const[a,b]=p.split('.');st[a][b]=v};
let fT=0;
function push(p){
 if(p.startsWith('g.')&&window.QA124)QA124.set(Object.assign({},st.g));
 if(p==='lt.floor'){clearTimeout(fT);fT=setTimeout(()=>LP_apply({floorCream:st.lt.floor}),120)}}
function sync(){SL.forEach(r=>{if(!r[1])return;const i=$('lab-'+r[1]);if(i){i.value=get(r[1]);const v=$('lab-v-'+r[1]);if(v)v.textContent=r[2]==='color'?get(r[1]):(+get(r[1])).toFixed(r[4]<1?2:0)}})}
function load(o){Object.assign(st.lt,o.lt||{});Object.assign(st.cam,o.cam||{});Object.assign(st.g,o.g||{});
 if(window.QA124)QA124.set(Object.assign({},st.g));LP_apply({floorCream:st.lt.floor});sync()}
function ui(){
 const css=document.createElement('style');
 css.textContent='#cine-first-load,#chip,#mpbar,#bar,#act,#ctxbar,#hint,#qa127map,#qa244tip,#toast,.chip,#pn{display:none!important}'+
 '#lab{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:rgba(20,16,18,.92);color:#eee;font:12px/1.4 sans-serif;max-height:40vh;overflow:auto;padding:8px 12px 14px;box-sizing:border-box}'+
 '#lab.c{max-height:none;overflow:hidden}#lab.c .body{display:none}'+
 '#lab h4{margin:10px 0 4px;font-size:12px;color:#c9a96a}#lab label{display:grid;grid-template-columns:76px 1fr 54px;gap:8px;align-items:center;margin:2px 0}'+
 '#lab input[type=range]{width:100%}#lab input[type=color]{width:100%;height:22px;padding:0;border:0;background:none}'+
 '#lab button{background:#3a2c30;color:#eee;border:1px solid #666;border-radius:6px;padding:6px 10px;margin:2px 4px 2px 0;font:12px sans-serif}'+
 '#lab .v{text-align:right;color:#aaa}@media(min-width:900px){#lab{left:auto;width:340px;top:0;max-height:none}}';
 document.head.appendChild(css);
 const d=document.createElement('div');d.id='lab';
 let h='<div><b>LAB</b> <button id="lab-t">접기/펴기</button><button id="lab-now">지금</button><button id="lab-v1">안 1</button><button id="lab-rs">초기화</button><button id="lab-cp">값 복사</button></div><div class="body">';
 SL.forEach(r=>{if(!r[1]){h+='<h4>'+r[0]+'</h4>';return}
  h+='<label>'+r[0]+(r[2]==='color'?'<input type="color" id="lab-'+r[1]+'"><span class="v" id="lab-v-'+r[1]+'"></span>':
  '<input type="range" id="lab-'+r[1]+'" min="'+r[2]+'" max="'+r[3]+'" step="'+r[4]+'"><span class="v" id="lab-v-'+r[1]+'"></span>')+'</label>'});
 d.innerHTML=h+'</div>';document.body.appendChild(d);
 d.addEventListener('input',e=>{const id=e.target.id.slice(4);if(!id)return;put(id,e.target.type==='color'?e.target.value:+e.target.value);push(id);sync()});
 $('lab-t').onclick=()=>d.classList.toggle('c');
 $('lab-now').onclick=()=>load({lt:PRESET.now});$('lab-v1').onclick=()=>load({lt:PRESET.v1});
 $('lab-rs').onclick=()=>load({lt:PRESET.now,cam:CAM0,g:GRADE0});
 $('lab-cp').onclick=async()=>{const t=JSON.stringify(st);try{await navigator.clipboard.writeText(t);$('lab-cp').textContent='복사됨'}catch(e){prompt('복사',t)}setTimeout(()=>$('lab-cp').textContent='값 복사',1200)};
 ['pointerdown','touchstart','wheel'].forEach(t=>d.addEventListener(t,e=>e.stopPropagation(),{passive:true}));
 wrapRender();pointer();load({lt:PRESET.now});sync()}

const w=setInterval(()=>{if(document.documentElement.dataset.cinemaReady&&typeof enterNow==='function'&&window.QA124&&window.qa124Render){clearInterval(w);setup()}},200);
})();
