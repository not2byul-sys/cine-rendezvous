const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA457 popcorn is gone from the menu, the lobby and NPC lines',()=>{
  const menu=source.slice(source.indexOf('const MENU={'),source.indexOf('cbsnack'));assert(!/pop/.test(menu));
  assert(!source.includes("popCart(7.55"));assert(!source.includes('QA182: 팝콘 기계'));assert(source.includes('QA457: 팝콘 기계를 빼고'));
  assert(!source.includes('무지개 팝콘 효과'));assert(!source.includes('팝콘 기계는 재작년'));assert(!source.includes('rbUntil=performance.now()/1000+5'));
  assert(source.includes("filter(x=>x&&!/^pop/.test(x.k))"));});
test('QA458 popcorn leftovers are gone: icon, wrappers, image files',()=>{
  assert(!source.includes("lucide('popcorn'"));assert(source.includes("lucide('icecream',16)"));assert(!source.includes('무지개 팝콘 상자'));
  assert(!/K=\[[^\]]*poprb/.test(source));assert(!fs.existsSync(path.join(__dirname,'..','qa95_assets','snack','poprb.webp')));});
