const test=require('node:test');const assert=require('node:assert');const fs=require('fs');const path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('QA473 keep prompt names the ticket when only a ticket is held (not a snack)',()=>{
  assert(source.includes("return !HELD.length&&API.tickets().length?'티켓':'간식'"));assert(source.includes("what==='티켓'?'받은 티켓을'"));});
