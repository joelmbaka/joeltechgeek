const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let model;
test.before(async () => { model = await import('../app/demos/security/security-demo-model.ts'); });

test('security operations seed includes clients, guards, rosters, and clear evidence levels', () => {
  const d = model.seedDemo();
  assert.equal(d.version, 2);
  assert.equal(d.sites.length, 3);
  assert.equal(d.guards.length, 6);
  assert.equal(d.shifts.filter(s => s.day === 'today').length, 4);
  assert.ok(d.shifts.some(s => s.status === 'unconfirmed'));
  assert.ok(d.shifts.some(s => s.status === 'reported'));
  assert.ok(d.shifts.some(s => s.status === 'confirmed'));
});

test('office telephone report stays unverified until supervisor confirms on site', () => {
  const d = model.seedDemo();
  const called = model.markArrival(d, 'shift-1', 'office');
  assert.equal(called.shifts[0].status, 'reported');
  assert.match(called.shifts[0].source, /not independently verified/);
  assert.equal(d.shifts[0].status, 'unconfirmed');
  assert.throws(() => model.markArrival(called, 'shift-1', 'office'), /already reported/);
  const onsite = model.markArrival(called, 'shift-1', 'supervisor');
  assert.equal(onsite.shifts[0].status, 'confirmed');
  assert.match(onsite.shifts[0].source, /Supervisor visual confirmation/);
  assert.equal(onsite.shifts[0].confirmedBy, 'Beatrice');
});

test('shift changes update the shared roster but block duplicate overlapping assignments', () => {
  const d = model.seedDemo();
  assert.throws(() => model.assignGuard(d, 'shift-1', 'peter'), /overlapping assignment/);
  const changed = model.assignGuard(d, 'shift-1', 'daniel');
  assert.equal(changed.shifts[0].guardId, 'daniel');
  assert.equal(d.shifts[0].guardId, 'kevin');
  assert.ok(changed.activity[0].message.includes('Daniel Mwangi'));
});

test('confirmed attendance is required before recording departure', () => {
  const d = model.seedDemo();
  assert.throws(() => model.recordDeparture(d, 'shift-1'), /requires a confirmed arrival/);
  const verified = model.markArrival(d, 'shift-1', 'supervisor');
  const completed = model.recordDeparture(verified, 'shift-1');
  assert.equal(completed.shifts[0].status, 'completed');
  assert.equal(completed.shifts[0].departure, '18:02');
});

test('property owner issue passes from open to acknowledged, responded, and resolved', () => {
  const d = model.seedDemo();
  assert.throws(() => model.raiseIssue(d, 'greenview', 'Gate', 'small'), /title and details/);
  const submitted = model.raiseIssue(d, 'greenview', 'Unsecured pedestrian gate', 'The side entrance is unlocked during the day.');
  const issue = submitted.issues[0];
  assert.equal(issue.origin, 'client');
  assert.equal(issue.visibleToClient, true);
  assert.equal(issue.status, 'open');
  assert.throws(() => model.progressIssue(submitted, issue.id, 'resolved', 'Fixed lock'), /must progress/);
  const acknowledged = model.progressIssue(submitted, issue.id, 'acknowledged');
  assert.throws(() => model.progressIssue(acknowledged, issue.id, 'responding', ''), /response note/);
  const responding = model.progressIssue(acknowledged, issue.id, 'responding', 'Supervisor visiting the site now.');
  const resolved = model.progressIssue(responding, issue.id, 'resolved', 'Lock replaced and site inspected.');
  assert.equal(resolved.issues[0].status, 'resolved');
  assert.match(resolved.activity[0].message, /resolved/);
});

test('published client reports distinguish confirmed versus telephone-reported shifts', () => {
  const d = model.seedDemo();
  const next = model.publishReport(d, 'karen');
  assert.equal(next.reports[0].siteId, 'karen');
  assert.match(next.reports[0].summary, /0 of 1 shifts confirmed/);
  assert.match(next.reports[0].summary, /1 reported but not independently confirmed/);
  assert.equal(next.activity[0].audience, 'client');
});

test('security office can log a site incident visible to its client only', () => {
  const d = model.seedDemo();
  const incident = model.logSiteIncident(d, 'westlands', 'Service entrance unsecured', 'The entrance gate lock needs immediate attention.');
  assert.equal(incident.issues[0].origin, 'operations');
  assert.equal(incident.issues[0].siteId, 'westlands');
  assert.equal(incident.issues[0].visibleToClient, true);
  assert.match(incident.activity[0].message, /Security incident logged/);
  assert.equal(incident.issues.filter(i => i.siteId === 'greenview').length, 1);
});

test('night shifts use a suitable arrival and departure time in demo records', () => {
  const d = model.seedDemo();
  const confirmed = model.markArrival(d, 'shift-2', 'supervisor');
  const shift = confirmed.shifts.find(s => s.id === 'shift-2');
  assert.equal(shift.arrival, '18:04');
  const departed = model.recordDeparture(confirmed, 'shift-2');
  assert.equal(departed.shifts.find(s => s.id === 'shift-2').departure, '06:02');
});

test('client-facing guard contact is optional and distinct from internal staff phone', () => {
  const d = model.seedDemo();
  const kevin = d.guards.find(g => g.id === 'kevin');
  const brian = d.guards.find(g => g.id === 'brian');
  assert.ok(kevin.workContact);
  assert.notEqual(kevin.workContact, kevin.phone);
  assert.equal(brian.workContact, undefined);
});

test('new experience is role-based and explains that no guard smartphone is needed', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app/demos/security/SecurityExperience.tsx'), 'utf8');
  const landing = fs.readFileSync(path.join(__dirname, '..', 'app/demos/security/page.tsx'), 'utf8');
  for (const value of ['operations', 'supervisor', 'client', 'Raise an issue', 'Confirm arrival on site', 'Publish', 'Reset sample']) assert.ok(source.includes(value));
  assert.match(landing, /No guard smartphone required/);
  assert.match(source, /browser-only demonstration/);
  assert.doesNotMatch(source, /navigator\.geolocation|getUserMedia\(/);
});
