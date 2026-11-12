/* Shared furniture-aware navigation; loaded after the scene and its colliders. */
function qa11Route(c,x,z,zone){
 if(!OBS)obsBuild();
 const level=c.userData.lvl,origin={x:c.position.x,z:c.position.z},goal={x,z};
 const inBounds=p=>{const b=bounds(zone,p.x,p.z);return !!b&&zoneOf(p.x,p.z,level)===zone&&p.x>=b[0]&&p.x<=b[1]&&p.z>=b[2]&&p.z<=b[3]},free=p=>inBounds(p)&&!blocked(p.x,p.z,level);
 if(!free(goal))return null;
 const rectangles=OBS.filter(r=>r[4]===level),solid=r=>r[5]||r;
 const hits=(a,b,r)=>{let lo=0,hi=1;for(const [at,delta,min,max] of [[a.x,b.x-a.x,r[0]+1e-6,r[1]-1e-6],[a.z,b.z-a.z,r[2]+1e-6,r[3]-1e-6]]){if(Math.abs(delta)<1e-9){if(at<=min||at>=max)return false;continue}let t0=(min-at)/delta,t1=(max-at)/delta;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>=hi)return false}return hi>0&&lo<1};
 const clear=(a,b,raw=false)=>{if(rectangles.some(r=>hits(a,b,raw?solid(r):r)))return false;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.16));for(let k=1;k<=n;k++)if(!inBounds({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n}))return false;return true};
 let start=origin,prefix=[];
 if(!free(origin)){
  /* A standing avatar can overlap the safety padding around its chair.
     Escape only through empty physical space, never through the furniture. */
  if(rectangles.some(r=>{const b=solid(r);return origin.x>b[0]&&origin.x<b[1]&&origin.z>b[2]&&origin.z<b[3]}))return null;
  let escape=null;for(const radius of [.15,.3,.45,.65]){const options=[];for(let k=0;k<32;k++){const angle=k*Math.PI/16,p={x:origin.x+Math.sin(angle)*radius,z:origin.z+Math.cos(angle)*radius};if(free(p)&&clear(origin,p,true))options.push(p)}if(options.length){options.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z));escape=options[0];break}}
  if(!escape)return null;start=escape;prefix=[escape];
 }
 if(clear(start,goal))return prefix.concat([goal]);
 const search=(step,limit)=>{
  const nodes=new Map(),open=[],push=n=>{open.push(n);let i=open.length-1;while(i){const p=(i-1)>>1;if(open[p].f<=n.f)break;open[i]=open[p];i=p}open[i]=n},pop=()=>{const root=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let k=i*2+1;if(k+1<open.length&&open[k+1].f<open[k].f)k++;if(open[k].f>=last.f)break;open[i]=open[k];i=k}open[i]=last}return root};
  const root={i:0,j:0,p:start,g:0,f:Math.hypot(x-start.x,z-start.z),parent:null};nodes.set('0,0',root);push(root);let end=null,visited=0;
  while(open.length&&visited++<limit){const n=pop();if(n.closed)continue;n.closed=true;if(Math.hypot(n.p.x-x,n.p.z-z)<step*1.8&&clear(n.p,goal)){end=n;break}
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const i=n.i+di,j=n.j+dj,key=i+','+j,p={x:start.x+i*step,z:start.z+j*step};if(!free(p)||!clear(n.p,p))continue;const old=nodes.get(key),g=n.g+step*Math.hypot(di,dj);if(old&&old.g<=g)continue;const next={i,j,p,g,f:g+Math.hypot(x-p.x,z-p.z),parent:n};nodes.set(key,next);push(next)}}
  if(!end)return null;const path=[goal];for(let n=end;n.parent;n=n.parent)path.unshift(n.p);const out=[];let anchor=start;while(path.length){let k=path.length-1;while(k>0&&!clear(anchor,path[k]))k--;anchor=path[k];out.push(anchor);path.splice(0,k+1)}return prefix.concat(out);
 };
 return search(.22,18000)||search(.12,32000);
}

function qa11Destination(c,x,z,zone,nearest=false){
 const direct=qa11Route(c,x,z,zone);if(direct||!nearest)return direct;
 /* An occupied destination resolves to the nearest reachable edge. */
 const options=[];for(const radius of [.35,.7,1.1,1.5,2,2.8])for(let k=0;k<24;k++){const angle=k*Math.PI/12,p={x:x+Math.sin(angle)*radius,z:z+Math.cos(angle)*radius};if(zoneOf(p.x,p.z,c.userData.lvl)===zone&&!blocked(p.x,p.z,c.userData.lvl))options.push({...p,cost:radius*4+Math.hypot(c.position.x-p.x,c.position.z-p.z)*.03})}
 options.sort((a,b)=>a.cost-b.cost);for(const p of options.slice(0,16)){const route=qa11Route(c,p.x,p.z,zone);if(route)return route}return null;
}

function qa11Retry(c){const u=c.userData,n=u.navRequest;if(!n||curZone(c)!==n.zone||n.retries>=3)return false;OBS=null;n.retries++;const path=qa11Destination(c,n.x,n.z,n.zone,n.nearest);if(!path?.length)return false;u.path=path;return true}
