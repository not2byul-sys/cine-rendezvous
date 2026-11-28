const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA476 snack table sync: latte and tea no longer sold, crème coffee / parfait / cone added to their counters',()=>{
  const m=source.match(/const MENU=\{[\s\S]*?\};/)[0].replace(/\/\*[\s\S]*?\*\//g,'');
  assert(!/'latte'|'tea'/.test(m),'latte and tea are off every menu');assert(m.includes("cafe:['espresso','creme','vinchaud','eclair','millef','macaron','cake','croi']"));assert(m.includes("ouv:['glacier','parfait','cone','bebert','rivoli']"));
  ['creme','parfait','cone'].forEach(k=>{assert(source.includes(k+":['"),k+' has a name');assert(source.includes("k==='"+k+"'"),k+' has a 3D model');assert(new RegExp(k+":'[^']+'").test(source),k+' has a description')});
  assert(source.includes("latte:['🥛','라떼']"),'old held items still resolve');});
