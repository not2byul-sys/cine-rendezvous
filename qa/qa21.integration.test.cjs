const test=require('node:test');const assert=require('node:assert');const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),fn=fs.readFileSync(path.join(__dirname,'..','functions','api','reviews.js'),'utf8');
test('QA21 likes and one-line reviews live only in the timetable panel, gated by one minute of viewing',()=>{
  assert(source.includes('<script id="qa21-reviews">'));assert(source.includes("const watched=id=>(W[id]||0)>=60;"));
  assert(source.includes('data-a="rvlike"'));assert(source.includes('maxlength="40"'));assert(source.includes("PANELS.tt=function(keep)"));});
test('QA21 hall entrance shows a brass plaque with counts and a top review',()=>{assert(source.includes("m.name='qa21-plaque-'+hl.id"));assert(source.includes('좋아요 ${d.likes} · 한줄평 ${d.reviews.length}'));});
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
