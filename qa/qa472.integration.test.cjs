const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA472 soft clay helpers exist and lobby items are made matte',()=>{
  assert(source.includes('function qaRB(w,h,d,r,m,x,y,z,p)'));assert(source.includes('function qaClay(a,b){if(window.QA472_OFF)return;'));
  assert(source.includes("(opt||{});try{qaClay(m[0])}catch(e){}"),'every lobby layout item goes through qaClay');assert(source.includes('qaClay(_mShop[0]);'));});
test('QA472 café follows the reference: arch sign on the cornice, hanging globes, framed chalkboard, cushions, palm',()=>{
  assert(source.includes("put(2.36,.86,.08,.045,WINE,LW-.4,CT+.075)"));assert(source.includes("/* 처마 아래 매달린 구슬등 2 */"));
  assert(source.includes("['Café express','Café au lait','Thé','Gâteau du jour','Croissant']"));assert(!/2,50 F|3,00 F/.test(source),'no prices: ordering is free');
  assert(source.includes("c.scale.y=.24;c.position.y=.495;g.add(c)"),'red cushions on café chairs');assert(source.includes("OBS.push([7.75,LW,6.5,7.1,0])"),'palm pot blocks walking');});
