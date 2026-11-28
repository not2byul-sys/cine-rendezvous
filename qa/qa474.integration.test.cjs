const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA474 pause also pauses the pre-show clip',()=>{assert(source.includes("document.querySelectorAll('#qa110pre video').forEach(v=>{on?v.play().catch(()=>{}):v.pause()})"));});
test('QA474 seat map: readable seat names and a confirm step before sitting',()=>{
  assert(source.includes("b.setAttribute('aria-label',seatLabel(i)+' 좌석')"));assert(source.includes("' · 빈자리'"));
  assert(source.includes("if(sp.taken&&sp.taken!==me){toast('이미 누가 앉아 있어요');return}ask(sp)});"));assert(source.includes("`${L} 자리에 앉을까요?`"));});
test('QA474 register banner hidden and café panel title',()=>{assert(source.includes("if(has)has.remove();return;"));assert(source.includes("cafe:{title:'카페 주문',"));assert(!source.includes("카페 직원 · 주문"));});
