const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const winter = fs.readFileSync(path.join(__dirname, '..', 'qa11-winter.js'), 'utf8');

test('QA18 empty join ticket shows the enter stub (Figma 3:6)', () => {
  assert(source.includes("$('go').hidden=false;/* QA18 Figma 3:6"));
  assert(source.includes('top:189.33px') && source.includes('height:38.667px'));
});
test('QA18 punch sound is 40% quieter', () => {
  assert(source.includes('this.noise(.045,4200,.42);this.noise(.11,2800,.24,.025);this.tone(180,85,.055,.096)'));
});
test('QA18 every NPC has its own gift voice and hint', () => {
  const i = source.indexOf('const QA18_GIFT={'), block = source.slice(i, source.indexOf('};', i));
  const names = [...block.matchAll(/^'([^']+)':\[/gm)].map(m => m[1]);
  assert(names.length >= 50, 'names ' + names.length);
  const hints = new Set([...block.matchAll(/^'[^']+':\['[^']*','([^']*)'/gm)].map(m => m[1]));
  assert.equal(hints.size, names.length, 'hints must be unique');
});
test('QA18 lobby music-only toggle and 10s ceremony with English Santa greeting', () => {
  assert(source.includes("b.id='lobbyMusic'"));
  assert(source.includes("if(s>=10)finish()/* QA18: 점등식 10초 */"));
  assert(source.includes("'Ho, ho, ho! Merry Christmas!'"));
});
test('QA18 welcome mat removed, reference-style tree and club mini tree', () => {
  assert(!source.includes("fillText('WELCOME'"));
  assert(winter.includes('function qa18BuildFir('));
  assert(source.includes("g.name='club-mini-tree'"));
  assert(source.includes('CLUBG.push(g);HSET.add(g);'));
});
test('QA18 avatars use the attached 3D figure proportions', () => {
  assert(source.includes("headGroup.scale.setScalar(o.originalViewing?1:.5)"));
  assert(source.includes("const BODYK=o.originalViewing?1:1.16"));
  assert(source.includes("Object.defineProperty(seatedLegs,'visible'"));
});
