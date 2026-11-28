const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA477 americano and tarte tatin off the menus, café allongé in the club café, parfait renamed',()=>{
  const m=source.match(/const MENU=\{[\s\S]*?\};/)[0].replace(/\/\*[\s\S]*?\*\//g,'');
  assert(!/'americano'|'tarte'/.test(m));assert(m.includes("cbcafe:['allonge','diabolo','chocchaud','liegeois','madel','cake','croi']"));assert(m.includes("cbsnack:['crokm','jbeurre']"));
  assert(source.includes("parfait:['🍫','파르페 랑데부']"));assert(source.includes("allonge:['☕','카페 알롱제']"));assert(source.includes("k==='allonge'"));});
