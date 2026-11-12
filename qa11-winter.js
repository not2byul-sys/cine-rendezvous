/* Original instrumental carol arrangement, synthesized locally without media downloads. */
const QA11_CAROL={tempo:84,
 melody:[[76,79,81,79,76,74],[72,76,79,76,74,72],[77,81,84,81,79,77],[76,79,83,79,77,74],[76,79,84,83,81,79],[77,81,79,77,76,74],[74,77,79,83,81,77],[76,74,72,67,72,0]],
 chords:[[48,60,64,67],[48,60,64,67],[53,60,65,69],[55,59,62,67],[48,60,64,67],[50,57,62,65],[55,59,62,67],[48,60,64,67]]};
function qa11CarolSchedule(){const c=this.ctx;if(!c)return;const beat=60/QA11_CAROL.tempo;if(this.t<c.currentTime-.2)this.t=c.currentTime+.05;
 while(this.t<c.currentTime+1.4){const i=this.bar%8,t=this.t,ch=QA11_CAROL.chords[i];this.note(ch[0],t,beat*2.8,.055);this.note(ch[0]+7,t+beat,beat*1.7,.025);ch.slice(1).forEach(n=>this.note(n,t,beat*2.9,.014));
  QA11_CAROL.melody[i].forEach((n,k)=>{if(n)this.bell(n+12,t+k*beat/2,beat*1.5,.035)});
  [0,1,2].forEach(k=>this.ride(t+k*beat,.004));this.t+=beat*3;this.bar++;
 }}
function qa11CarolBell(m,t,d,v){const c=this.ctx,f=440*Math.pow(2,(m-69)/12);[[1,1],[2.76,.21],[5.4,.06]].forEach(([ratio,weight])=>{const tone=c.createOscillator(),gain=c.createGain();tone.type='sine';tone.frequency.value=f*ratio;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(v*weight,t+.009);gain.gain.exponentialRampToValueAtTime(.0001,t+d);tone.connect(gain);gain.connect(this.dry);tone.start(t);tone.stop(t+d+.05)})}

function qa18BuildFir(g,o){const H=o.height,B0=o.base,R0=o.radius,dummy=new THREE.Object3D(),rr=(k=>()=>{k=(k*16807)%2147483647;return k/2147483647})(o.seed||97);
 const add=(geo,material,x,y,z)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);g.add(mesh);return mesh};
 add(new THREE.CylinderGeometry(.11,.14,B0+.1,10),o.bark,0,(B0+.1)/2,0);
 const greens=[0x173f2c,0x1d4a33,0x245a3c,0x2c6644].map(c=>new THREE.MeshLambertMaterial({color:c}));
 /* 안쪽 몸통 콘 + 층별 뾰족한 가지 */const tiers=7;for(let t=0;t<tiers;t++){const f=t/tiers,y=B0+f*(H-B0)*.92,r=R0*(1-f*.86),h=(H-B0)/tiers*1.9;const cone=new THREE.ConeGeometry(r,h,22,3,true),pa=cone.attributes.position;for(let i=0;i<pa.count;i++){const yy=pa.getY(i);if(yy<-h/2+.01){const a=Math.atan2(pa.getZ(i),pa.getX(i)),j=1+.18*Math.sin(a*11+t)+.08*Math.sin(a*23);pa.setX(i,pa.getX(i)*j);pa.setZ(i,pa.getZ(i)*j);pa.setY(i,yy-.06*Math.abs(Math.sin(a*11+t)))}}cone.computeVertexNormals();const m=add(cone,greens[t%2],0,y+h/2,0);m.material=greens[t%2].clone();m.material.side=THREE.DoubleSide}
 const tipN=o.tips||420,tips=new THREE.InstancedMesh(new THREE.ConeGeometry(.045,.32,5),greens[2],tipN);for(let k=0;k<tipN;k++){const f=Math.pow(rr(),.8),y=B0+.05+f*(H-B0)*.9,r=R0*(1-(y-B0)/(H-B0)*.9)*(.82+rr()*.22),a=rr()*Math.PI*2;dummy.position.set(Math.sin(a)*r,y,Math.cos(a)*r);dummy.rotation.set(0,a,0);dummy.rotateX(Math.PI/2+.55);dummy.scale.setScalar(.8+rr()*.6);dummy.updateMatrix();tips.setMatrixAt(k,dummy.matrix);tips.setColorAt(k,new THREE.Color(greens[k%4].color))}g.add(tips);
 const surf=(f,a,out=1)=>{const y=B0+.1+f*(H-B0)*.86,r=R0*(1-(y-B0)/(H-B0)*.9)*out;return new THREE.Vector3(Math.sin(a)*r,y,Math.cos(a)*r)};
 /* 전구(웜화이트 점) — 기존 점등 효과와 호환되는 InstancedMesh */const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.024*(o.lightScale||1),8,6),o.glow,o.lights);for(let k=0;k<o.lights;k++){const p=surf(rr(),rr()*Math.PI*2,1.03);dummy.position.copy(p);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();dots.setMatrixAt(k,dummy.matrix)}g.add(dots);
 /* 오너먼트: 빨강 · 금색 광택 구슬(크기 다양) + 작은 금종 */const red=new THREE.MeshPhongMaterial({color:0xb3262e,shininess:110,specular:0xffd0c0}),gd=new THREE.MeshPhongMaterial({color:0xd8b45c,shininess:110,specular:0xfff4c8,emissive:0x2a1c04});
 const ON=o.ornaments,orn=[new THREE.InstancedMesh(new THREE.SphereGeometry(.075,14,10),red,ON),new THREE.InstancedMesh(new THREE.SphereGeometry(.072,14,10),gd,ON)];[0,1].forEach(c=>{for(let k=0;k<ON;k++){const p=surf(.05+rr()*.88,rr()*Math.PI*2,1.06);dummy.position.copy(p);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.65+rr()*.75);dummy.updateMatrix();orn[c].setMatrixAt(k,dummy.matrix)}g.add(orn[c])});
 const bell=new THREE.InstancedMesh(new THREE.ConeGeometry(.05,.09,10,1,true),gd,o.bells||12);for(let k=0;k<(o.bells||12);k++){const p=surf(.1+rr()*.8,rr()*Math.PI*2,1.05);dummy.position.copy(p);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();bell.setMatrixAt(k,dummy.matrix)}g.add(bell);
 /* 금색 비즈 가랜드: 층마다 늘어진 스왜그 */const beadPts=[];for(let t=0;t<(o.swags||5);t++){const f=.18+t*.15,n=6;for(let s_=0;s_<n;s_++){const a0=s_/n*Math.PI*2+t*.5,a1=(s_+1)/n*Math.PI*2+t*.5;for(let q=0;q<=10;q++){const u=q/10,a=a0+(a1-a0)*u,p=surf(f-.06*Math.sin(u*Math.PI),a,1.07);beadPts.push(p)}}}
 const beads=new THREE.InstancedMesh(new THREE.SphereGeometry(.017,6,5),gd,beadPts.length);beadPts.forEach((p,k)=>{dummy.position.copy(p);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();beads.setMatrixAt(k,dummy.matrix)});g.add(beads);
 return {dots}}
function qa11ChristmasDisplay(){
 const mark=layBeg(),g=new THREE.Group();g.name='lobby-christmas-display';g.position.set(6.65,0,17.65);g.scale.setScalar(1.2);S.add(g);
 /* QA18: 레퍼런스형 풍성한 전나무 — 층층이 뾰족한 가지 · 빨강/금색 오너먼트 · 금색 비즈 가랜드 스왜그 · 웜화이트 전구 · 반짝이는 금별 */
 const bark=mat(0x4a2f1f),gold=new THREE.MeshPhongMaterial({color:0xd9b25a,shininess:95,specular:0xfff1c0,emissive:0x2a1c04}),glow=new THREE.MeshBasicMaterial({color:0xffe7b1,toneMapped:false});
 const add=(geo,material,x,y,z)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);g.add(mesh);return mesh};
 qa18BuildFir(g,{gold,bark,glow,height:3.25,base:.62,radius:1.08,lights:144,ornaments:46});
 const star=new THREE.Shape();for(let k=0;k<10;k++){const a=Math.PI/2+k*Math.PI/5,r=k%2?.1:.26,x=Math.cos(a)*r,y=Math.sin(a)*r;k?star.lineTo(x,y):star.moveTo(x,y)}star.closePath();const st=add(new THREE.ExtrudeGeometry(star,{depth:.05,bevelEnabled:true,bevelThickness:.018,bevelSize:.014,bevelSegments:2}),gold,0,3.62,-.025);add(new THREE.CylinderGeometry(.018,.018,.22,8),gold,0,3.42,0);
 const packs=[[-.82,-.72,.5,.36,0xc9a46a],[.6,-.74,.44,.42,0x1f4a36],[1.02,-.12,.36,.34,0x9e1f2a],[-1.0,.1,.38,.3,0xc9a46a],[.66,.72,.48,.3,0x9e1f2a],[-.36,.84,.4,.44,0x1f4a36],[.18,-.98,.34,.24,0xb02a30],[-.1,-.55,.3,.2,0xd9bf86]];
 for(const [x,z,w,h,color] of packs){const paper=mat(color),ribbon=color===0x9e1f2a||color===0xb02a30?gold:new THREE.MeshPhongMaterial({color:0xb3202e,shininess:40});add(new THREE.BoxGeometry(w,h,w*.85),paper,x,h/2,z);add(new THREE.BoxGeometry(w+.025,.045,w*.85+.025),paper,x,h+.015,z);add(new THREE.BoxGeometry(.045,h+.06,w*.85+.035),ribbon,x,h/2+.015,z);add(new THREE.BoxGeometry(w+.035,h+.06,.045),ribbon,x,h/2+.015,z);[-1,1].forEach(side=>{const bow=add(new THREE.TorusGeometry(.065,.011,5,12),ribbon,x+side*.06,h+.07,z);bow.rotation.x=Math.PI/2;bow.scale.y=.6})}
 const lamp=new THREE.PointLight(0xffd597,.55,5,2);lamp.position.set(0,1.9,.35);g.add(lamp);layEnd(mark,'christmas-display','크리스마스 트리 · 선물상자',0);OBS=null;
 return g;
}

function qa11WinterStreet(){
 const snowMaterial=new THREE.MeshLambertMaterial({color:0xe0e7e9}),cover=(w,d,x,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),snowMaterial);mesh.position.set(x,.025,z);mesh.name='outdoor-snow';S.add(mesh)};
 cover(160,2.15,0,LD+1.5);cover(160,2.3,0,LD+12.8);cover(160,8.55,0,LD+7);
 /* Two shallow slush tracks keep the snowy street readable. */
 const slush=new THREE.MeshLambertMaterial({color:0x8c999e});for(const z of [LD+5,LD+9]){const track=new THREE.Mesh(new THREE.BoxGeometry(160,.01,.62),slush);track.position.set(0,.049,z);track.name='outdoor-snow-track';S.add(track)}
 /* Uneven snowbanks leave the road legible, with a clear indoor boundary. */
 for(let k=0;k<30;k++){const x=-44+k*3.1,z=LD+(k%2?11.25:2.7),bank=new THREE.Mesh(new THREE.SphereGeometry(.7,10,6),snowMaterial);bank.position.set(x,.055,z);bank.scale.set(1.7,.18,.5);bank.name='outdoor-snowbank';S.add(bank)}
}

window.NYOVR=Object.assign({},window.NYOVR||{},{code:71,cloud:90});
/* A soft round flake avoids the default square points against the windows. */
{const cv=document.createElement('canvas');cv.width=cv.height=32;const c=cv.getContext('2d'),g=c.createRadialGradient(16,16,2,16,16,15);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,32,32);snow.material.map=new THREE.CanvasTexture(cv);snow.material.alphaTest=.04;snow.material.size=.2;snow.material.needsUpdate=true}
qa11ChristmasDisplay();qa11WinterStreet();BGM.sched=qa11CarolSchedule;BGM.bell=qa11CarolBell;drawSky();
document.documentElement.dataset.cinemaReady='qa11-winter-layout-20261112';
