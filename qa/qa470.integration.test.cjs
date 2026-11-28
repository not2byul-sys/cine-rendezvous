const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA470 lobby café: counter, staff, menu panel and seats are built',()=>{
  assert(source.includes("const _mCafe=shMark();"));assert(source.includes("VSTAFF.cafe=stC"));
  assert(source.includes("fn:()=>openPanel('cafe')"));assert(source.includes("PANELS.cafe=()=>opanel('cafe')"));
  assert(source.includes("cafe:['espresso','latte','tea','cake','croi']"));
  assert(source.includes("cafe:{name:'☕ 카페',pt:{x:5.0,z:9.2,zone:'L0'}}"));
  assert(source.includes("'cafe-table-'+i"),'two café tables are movable layout items');});
test('QA470 shop moved +0.9 toward the door, vending machine removed, sofa moved upstairs',()=>{
  assert(source.includes("shTo(_mShop,0,1.9);"));assert(source.includes("OBS.push([5.55,LW,11.8,16.6,0])"));
  assert(!source.includes("retroBox(LW-.5,z,.95,1.75,col,lb,lc,-Math.PI/2)"),'1F coffee vending machine is gone');
  assert(source.includes("qa260Sofa(8.5,-1.6,-Math.PI/2,6.7,'leather-sofa-2','레트로 가죽 소파 · 테이블 (2층)',1)"));
  assert(!source.includes("qa260Sofa(8.5,16.95"),'no sofa beside the shop on 1F');});
