const test=require('node:test');const assert=require('node:assert');const path=require('path');const {pathToFileURL}=require('url');
/* QA471: 저장 서버를 가짜 KV로 실제 실행해 확인(소스 문자열 검사 아님) */
const load=()=>import(pathToFileURL(path.join(__dirname,'..','functions','api','save.js')).href);
const mkKV=()=>{const m=new Map();return{m,get:async k=>m.has(k)?JSON.parse(m.get(k)):null,put:async(k,v)=>{m.set(k,v)},list:async()=>({keys:[]})}};
const call=async(mod,env,b)=>{const r=await mod.onRequestPost({request:new Request('http://x/api/save',{method:'POST',body:JSON.stringify(b)}),env});return{s:r.status,j:await r.json()}};
const legacyHash=async(id,pin)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('cine:'+id+':'+pin)))].map(x=>x.toString(16).padStart(2,'0')).join('');
test('create/load/save work and PIN is salted per user',async()=>{
  const mod=await load(),kv=mkKV(),env={SETTINGS:kv};
  assert.strictEqual((await call(mod,env,{op:'create',id:'Amélie',pin:'1234',data:{a:1}})).j.ok,true);
  assert.strictEqual((await call(mod,env,{op:'create',id:'Amélie 2',pin:'1234',data:{}})).j.ok,true);
  const A=JSON.parse(kv.m.get('u:amélie')),B=JSON.parse(kv.m.get('u:amélie 2'));
  assert(A.s&&B.s&&A.s!==B.s,'salt differs per user');assert.notStrictEqual(A.h2,B.h2);
  assert.deepStrictEqual((await call(mod,env,{op:'load',id:'amélie',pin:'1234'})).j.data,{a:1});
  assert.strictEqual((await call(mod,env,{op:'load',id:'amélie',pin:'9999'})).s,401);
});
test('old unsalted accounts still log in and are upgraded in place; legacy hash kept for rollback',async()=>{
  const mod=await load(),kv=mkKV(),env={SETTINGS:kv};
  kv.m.set('u:옛날',JSON.stringify({h:await legacyHash('옛날','4321'),d:{x:7},t:1,f:0}));
  assert.strictEqual((await call(mod,env,{op:'load',id:'옛날',pin:'0000'})).s,401,'wrong pin still rejected');
  const ok=await call(mod,env,{op:'load',id:'옛날',pin:'4321'});assert.deepStrictEqual(ok.j.data,{x:7});
  const R=JSON.parse(kv.m.get('u:옛날'));assert(R.s&&R.h2,'upgraded');assert.strictEqual(R.h,await legacyHash('옛날','4321'),'legacy kept');
  assert.deepStrictEqual((await call(mod,env,{op:'load',id:'옛날',pin:'4321'})).j.data,{x:7},'works after upgrade');
});
test('server secret (PIN_PEPPER) changes the stored hash',async()=>{
  const mod=await load(),a=mkKV(),b=mkKV();
  await call(mod,{SETTINGS:a},{op:'create',id:'x',pin:'1111',data:{}});await call(mod,{SETTINGS:b,PIN_PEPPER:'s3cret'},{op:'create',id:'x',pin:'1111',data:{}});
  const A=JSON.parse(a.m.get('u:x')),B=JSON.parse(b.m.get('u:x'));
  assert.notStrictEqual(await (async()=>A.h2)(),B.h2);
});
test('5 wrong PINs lock the account',async()=>{
  const mod=await load(),kv=mkKV(),env={SETTINGS:kv};await call(mod,env,{op:'create',id:'zed',pin:'1111',data:{}});
  for(let i=0;i<5;i++)await call(mod,env,{op:'load',id:'zed',pin:'2222'});
  assert.strictEqual((await call(mod,env,{op:'load',id:'zed',pin:'1111'})).s,429);
});
test('nickname length: new ids are 14 chars max (matches the entry screen); old 15-16 char ids still load',async()=>{
  const mod=await load(),kv=mkKV(),env={SETTINGS:kv};
  assert.strictEqual((await call(mod,env,{op:'create',id:'가'.repeat(14),pin:'1111',data:{}})).j.ok,true);
  assert.strictEqual((await call(mod,env,{op:'create',id:'가'.repeat(15),pin:'1111',data:{}})).s,400);
  kv.m.set('u:'+'나'.repeat(16),JSON.stringify({h:await legacyHash('나'.repeat(16),'5555'),d:{k:1},t:1,f:0}));
  assert.deepStrictEqual((await call(mod,env,{op:'load',id:'나'.repeat(16),pin:'5555'})).j.data,{k:1});
});
