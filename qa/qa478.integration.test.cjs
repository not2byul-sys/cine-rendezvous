const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');const vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA478 menus equal the Notion snack table of 11/29 and every menu item is fully defined',()=>{
  const MENU=vm.runInNewContext('('+source.match(/const MENU=(\{[\s\S]*?\});/)[1]+')');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(MENU)),{vendor:['rose1','rosebouquet'],shop:['glacier','rivoli','fruitc','bebert','lemon'],cafe:['espresso','creme','vinchaud','eclair','millef','macaron','cake','croi'],cbcafe:['allonge','diabolo','chocchaud','liegeois','madel','cake','croi'],cbwine:['wine','wwine','kir','cheese'],cbsnack:['crokm','jbeurre'],ouv:['glacier','parfait','cone','bebert','rivoli']});
  const it=source.match(/const IT=\{[\s\S]*?\};/)[0];
  Object.values(MENU).flat().forEach(k=>{assert(new RegExp('[{,/]'+k+":\\['").test(it),k+' has a name')});
  ['eclair','millef','macaron','vinchaud','diabolo','liegeois','chocchaud'].forEach(k=>{assert(source.includes("k==='"+k+"'"),k+' has a 3D model');assert(new RegExp(k+":'[^']+'").test(source),k+' has a description')});});
