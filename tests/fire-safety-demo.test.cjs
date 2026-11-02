const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const demo = fs.readFileSync(path.join(__dirname, '../public/demos/fire-safety/demo.html'), 'utf8');
const page = fs.readFileSync(path.join(__dirname, '../app/demos/fire-safety/page.tsx'), 'utf8');
const listing = fs.readFileSync(path.join(__dirname, '../app/demos/page.tsx'), 'utf8');
const script = demo.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test('fire safety demo script is syntactically valid', () => {
  assert.ok(script, 'inline demo script exists');
  assert.doesNotThrow(() => new vm.Script(script));
});

test('Grace Operations and Kevin Technician are the only demo roles', () => {
  assert.match(script, /const validRoles=new Set\(\['operations','technician'\]\)/);
  assert.match(demo, /<option value="operations"[^>]*>Grace · Operations<\/option>/);
  assert.match(demo, /<option value="technician"[^>]*>Kevin · Technician<\/option>/);
  assert.doesNotMatch(demo, /Amina|open-manager|value="manager"|value="admin"/);
  assert.doesNotMatch(page, /Amina|Manager review|three team roles/);
  assert.match(listing, /2 simulated roles/);
});

test('Grace reviews submitted inspections; failure remains certificate-ineligible', () => {
  assert.match(script, /function approve\(\)\{if\(ui\.role!=='operations'\)/);
  assert.match(script, /data-action="approve"/);
  assert.match(script, /j\.status==='Submitted'/);
  assert.match(script, /j\.results\?\.some\(v=>v!=='pass'\)/);
  assert.match(script, /j\.status='Needs follow-up'/);
  assert.match(script, /j\.status='Approved'/);
  assert.match(script, /if\(!j\|\|j\.status!=='Approved'\)/);
});

test('new jobs only assign Kevin', () => {
  assert.match(demo, /id="newTech"><option>Kevin M\.<\/option><\/select>/);
  assert.doesNotMatch(demo, /Brian O\./);
});
