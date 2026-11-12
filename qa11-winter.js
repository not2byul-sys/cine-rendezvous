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

function qa11ChristmasDisplay(){
 const mark=layBeg(),g=new THREE.Group();g.name='lobby-christmas-display';g.position.set(6.65,0,17.65);S.add(g);
 const green=new THREE.MeshPhongMaterial({color:0x1e4937,shininess:12}),gold=new THREE.MeshPhongMaterial({color:0xc9a24a,shininess:72}),bark=mat(0x5b3b28),glow=new THREE.MeshBasicMaterial({color:0xffe7b1,toneMapped:false});
 const add=(geo,material,x,y,z)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);g.add(mesh);return mesh};
 add(new THREE.CylinderGeometry(.29,.33,.3,20),bark,0,.15,0);add(new THREE.CylinderGeometry(.11,.13,.58,12),bark,0,.4,0);
 [[1.0,1.35,1.0],[.79,1.3,1.65],[.57,1.18,2.25],[.35,.95,2.85]].forEach(([r,h,y])=>add(new THREE.ConeGeometry(r,h,18),green,0,y,0));
 const star=new THREE.Shape();for(let k=0;k<10;k++){const a=Math.PI/2+k*Math.PI/5,r=k%2?.11:.25,x=Math.cos(a)*r,y=Math.sin(a)*r;k?star.lineTo(x,y):star.moveTo(x,y)}star.closePath();add(new THREE.ExtrudeGeometry(star,{depth:.045,bevelEnabled:false}),gold,0,3.48,0);
 const dots=new THREE.InstancedMesh(new THREE.SphereGeometry(.029,8,6),glow,72),balls=new THREE.InstancedMesh(new THREE.SphereGeometry(.067,10,8),gold,27),dummy=new THREE.Object3D();
 const garland=[];for(let k=0;k<72;k++){const f=k/71,y=.65+f*2.5,r=.97*(1-f)+.13,a=f*Math.PI*12,x=Math.sin(a)*r,z=Math.cos(a)*r;dummy.position.set(x,y,z);dummy.updateMatrix();dots.setMatrixAt(k,dummy.matrix);garland.push(new THREE.Vector3(x,y,z))}g.add(dots);
 for(let k=0;k<27;k++){const f=(k+.5)/28,y=.72+f*2.2,r=.88*(1-f)+.13,a=k*2.399;dummy.position.set(Math.sin(a)*r,y,Math.cos(a)*r);dummy.updateMatrix();balls.setMatrixAt(k,dummy.matrix);balls.setColorAt(k,new THREE.Color([0x9b2937,0xcfaa57,0xece2c5][k%3]))}g.add(balls);
 add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(garland),160,.008,5,false),gold,0,0,0);
 const packs=[[-.78,-.7,.48,.34,0x822838],[.58,-.7,.4,.48,0x2f5b45],[.99,-.15,.32,.36,0xe7d9b8],[-.95,.08,.35,.3,0x365e4a],[.62,.7,.47,.29,0x8a2634],[-.35,.8,.37,.41,0xc2a369],[.2,-.9,.31,.24,0xe2d3b4]];
 for(const [x,z,w,h,color] of packs){const paper=mat(color),ribbon=gold;add(new THREE.BoxGeometry(w,h,w*.85),paper,x,h/2,z);add(new THREE.BoxGeometry(w+.025,.045,w*.85+.025),paper,x,h+.015,z);add(new THREE.BoxGeometry(.045,h+.06,w*.85+.035),ribbon,x,h/2+.015,z);add(new THREE.BoxGeometry(w+.035,h+.06,.045),ribbon,x,h/2+.015,z);[-1,1].forEach(side=>{const bow=add(new THREE.TorusGeometry(.065,.011,5,12),ribbon,x+side*.06,h+.07,z);bow.rotation.x=Math.PI/2;bow.scale.y=.6})}
 const lamp=new THREE.PointLight(0xffd597,.55,5,2);lamp.position.set(0,1.9,.35);g.add(lamp);layEnd(mark,'christmas-display','크리스마스 트리 · 선물상자',0);OBS=null;
 return g;
}

function qa11WinterStreet(){
 const snowMaterial=new THREE.MeshLambertMaterial({color:0xe0e7e9}),cover=(w,d,x,z)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),snowMaterial);mesh.position.set(x,.025,z);mesh.name='outdoor-snow';S.add(mesh)};
 cover(160,2.15,0,LD+1.5);cover(160,2.3,0,LD+12.8);
 /* Uneven snowbanks leave the road legible, with a clear indoor boundary. */
 for(let k=0;k<30;k++){const x=-44+k*3.1,z=LD+(k%2?11.25:2.7),bank=new THREE.Mesh(new THREE.SphereGeometry(.7,10,6),snowMaterial);bank.position.set(x,.055,z);bank.scale.set(1.7,.18,.5);bank.name='outdoor-snowbank';S.add(bank)}
}

window.NYOVR=Object.assign({},window.NYOVR||{},{code:71,cloud:90});
qa11ChristmasDisplay();qa11WinterStreet();BGM.sched=qa11CarolSchedule;BGM.bell=qa11CarolBell;drawSky();
document.documentElement.dataset.cinemaReady='qa11-winter-layout-20261112';
