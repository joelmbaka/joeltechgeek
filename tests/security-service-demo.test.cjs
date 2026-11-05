const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let m;
test.before(async () => { m = await import('../app/demos/security/security-demo-model.ts'); });
const find = (xs, id) => xs.find(x => x.id === id);

test('seed represents client properties, manager staff, dated shifts and reporting history', () => {
  const data = m.seedDemo('2026-11-05');
  assert.ok(m.valid(data));
  assert.equal(data.version, 3);
  assert.equal(data.sites.length, 3);
  assert.equal(data.staff.length, 5);
  assert.ok(data.shifts.some(s => s.attendance === 'reported'));
  assert.ok(data.issues.some(i => i.status === 'resolved'));
  assert.deepEqual([...new Set(data.reports.map(r => r.period))].sort(), ['daily','monthly','weekly']);
});

test('Kenya calendar utilities handle midnight and month/year rollover', () => {
  assert.equal(m.addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(m.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(m.addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(m.dayOfInstant('2026-11-04T22:00:00Z'), '2026-11-05');
  const [start, end] = m.dayBounds('2026-11-05');
  assert.equal((end-start)/(60*60*1000), 24);
});

test('overnight shift appears on both days but not after ending', () => {
  const data = m.seedDemo('2026-11-05');
  const shift = find(data.shifts, 's-night');
  assert.equal(m.shiftOnDay(shift, '2026-11-05'), true);
  assert.equal(m.shiftOnDay(shift, '2026-11-06'), true);
  assert.equal(m.shiftOnDay(shift, '2026-11-07'), false);
  const fullPeriod = 'Thu 5 Nov, 6:00 PM – Fri 6 Nov, 6:00 AM';
  assert.equal(m.shiftWindow(shift), fullPeriod);
  const firstDay = m.timelineForDay(data, '2026-11-05', 'greenview');
  const next = m.timelineForDay(data, '2026-11-06', 'greenview');
  assert.ok(firstDay.some(row => row.shift?.id === 's-night'));
  assert.ok(next.some(row => row.shift?.id === 's-night'));
  assert.ok(firstDay.some(row => row.shift?.id === 's-night' && row.detail.includes(fullPeriod)));
  assert.ok(next.some(row => row.shift?.id === 's-night' && row.detail.includes(fullPeriod)));
  assert.ok(next.every(row => !row.detail.includes('Continued from previous day')));
  assert.ok(firstDay.every(row => !row.detail.includes('Continues next day')));
});

test('same-day shifts display actual dated start and end, and New Year rollover shows both years', () => {
  const data = m.seedDemo('2026-11-05');
  const daytime = find(data.shifts, 's-day');
  assert.equal(m.shiftWindow(daytime), 'Thu 5 Nov, 6:00 AM – Thu 5 Nov, 6:00 PM');
  const crossing = {
    ...daytime,
    startAt: '2026-12-31T22:30:00+03:00',
    endAt: '2027-01-01T02:45:00+03:00',
  };
  assert.equal(m.shiftWindow(crossing), 'Thu 31 Dec 2026, 10:30 PM – Fri 1 Jan 2027, 2:45 AM');
});

test('client roster is a chronological daily history including evidence and property isolation', () => {
  const data = m.seedDemo('2026-11-05');
  const rows = m.timelineForDay(data, '2026-11-05', 'greenview');
  assert.ok(rows.some(r => r.kind === 'shift'));
  assert.ok(rows.some(r => r.kind === 'event'));
  assert.ok(rows.some(r => r.assets.some(a => a.kind === 'image')));
  assert.ok(rows.some(r => r.issueId === 'issue-gate'));
  const epochs = rows.map(r => Date.parse(r.at));
  assert.deepEqual(epochs, [...epochs].sort((a,b)=>a-b));
  assert.equal(m.timelineForDay(data,'2026-11-05','karen').some(r => r.issueId === 'issue-gate'), false);
  assert.ok(m.timelineForDay(data,'2026-11-04','greenview').some(r => r.title === 'Night patrol observation'));
});

test('rolling window covers the last thirty days and the next thirty days', () => {
  const center = '2026-11-05';
  const data = m.fillRollingWindow(m.seedDemo(center),center);
  assert.equal(data.anchorDate,center);
  for(let offset=-30;offset<=30;offset++){
    const day=m.addDays(center,offset);
    for(const site of ['greenview','karen','westlands']){
      assert.ok(m.timelineForDay(data,day,site).some(row=>row.kind==='shift'),
        'Missing planned or historical shift for '+site+' on '+day);
    }
  }
  assert.ok(data.activity.filter(a=>a.id.startsWith('sample-activity-')).length>=80);
  assert.ok(data.activity.some(a=>a.id.startsWith('sample-activity-') && a.assets.length));
  assert.equal(data.shifts.filter(s=>s.id.startsWith('sample-shift-') && m.dayOfInstant(s.startAt)>center)
    .every(s=>s.attendance==='scheduled' && !s.arrivalAt && !s.departureAt),true);
});

test('generated roster is idempotent and preserves changes when the date window moves', () => {
  const day='2026-11-05';
  const first=m.fillRollingWindow(m.seedDemo(day),day);
  const second=m.fillRollingWindow(first,day);
  assert.equal(first.shifts.length,second.shifts.length);
  assert.equal(first.activity.length,second.activity.length);
  const id='sample-shift-greenview-2026-11-12-night';
  assert.ok(first.shifts.some(s=>s.id===id));
  const edited=m.assignShift(first,id,'peter');
  const repeated=m.fillRollingWindow(edited,day);
  assert.equal(repeated.shifts.find(s=>s.id===id).staffId,'peter');
  assert.equal(repeated.shifts.length,edited.shifts.length);
  const moved=m.fillRollingWindow(repeated,'2026-12-01');
  assert.equal(moved.anchorDate,'2026-12-01');
  assert.equal(moved.shifts.find(s=>s.id===id).staffId,'peter');
  assert.ok(m.timelineForDay(moved,'2026-12-29','greenview').some(row=>row.kind==='shift'));
});

test('rolling roster crosses New Year without breaking overnight shifts', () => {
  const center='2026-12-30';
  const data=m.fillRollingWindow(m.seedDemo(center),center);
  assert.ok(m.timelineForDay(data,'2027-01-15','westlands').some(row=>row.kind==='shift'));
  assert.ok(m.timelineForDay(data,'2026-12-01','karen').some(row=>row.kind==='shift'));
  const night=data.shifts.find(s=>s.id==='sample-shift-greenview-2026-12-31-night');
  assert.ok(night);
  assert.equal(m.dayOfInstant(night.endAt),'2027-01-01');
});

test('manager can schedule a night shift but overlapping staff assignments are rejected', () => {
  const data = m.seedDemo('2026-11-05');
  assert.throws(() => m.addShift(data,'greenview','brian','2026-11-05','20:00','06:00'), /overlapping duty shift/);
  const added = m.addShift(data,'karen','daniel','2026-11-05','20:00','06:00');
  const shift = added.shifts[added.shifts.length-1];
  assert.equal(m.dayOfInstant(shift.endAt),'2026-11-06');
  assert.equal(m.shiftOnDay(shift,'2026-11-06'),true);
  assert.equal(data.shifts.length+1,added.shifts.length);
  const extra = m.addShift(data,'karen','peter','2026-11-05','19:00','21:00');
  assert.throws(()=>m.assignShift(extra,'s-night','peter'),/overlapping shift/);
  assert.throws(()=>m.assignShift(data,'s-day','daniel'),/Only unstarted shifts/);
  const changed = m.assignShift(data,'s-night','daniel');
  assert.equal(find(changed.shifts,'s-night').staffId,'daniel');
});

test('telephone attendance remains unverified until manager confirmation', () => {
  const data = m.seedDemo('2026-11-05');
  const reported = m.confirmAttendance(data,'s-westlands','office');
  assert.equal(find(reported.shifts,'s-westlands').attendance,'reported');
  assert.match(find(reported.shifts,'s-westlands').method,/unverified/);
  assert.throws(()=>m.confirmAttendance(reported,'s-westlands','office'),/already reported/);
  const confirmed = m.confirmAttendance(reported,'s-westlands','supervisor');
  assert.equal(find(confirmed.shifts,'s-westlands').attendance,'confirmed');
  assert.equal(find(confirmed.shifts,'s-westlands').confirmedBy,'Grace · Security Manager');
  const completed = m.completeShift(confirmed,'s-westlands');
  assert.equal(find(completed.shifts,'s-westlands').attendance,'completed');
});

test('future shifts cannot be marked present before starting', () => {
  const future = m.seedDemo('2099-01-01');
  assert.throws(()=>m.confirmAttendance(future,'s-night','supervisor'),/future shift cannot be checked in/);
});

test('issues have stable IDs, chronological status history and sample attachments', () => {
  const data = m.seedDemo('2026-11-05');
  assert.deepEqual(m.siteIssues(data,'greenview').map(i=>i.id),['issue-gate','issue-light']);
  assert.throws(()=>m.addIssue(data,'greenview','Gate','short','client'),/meaningful description/);
  const submitted = m.addIssue(data,'greenview','Entrance gate concern','Side gate is open during shift handover.','client');
  const id = submitted.issues[0].id;
  assert.equal(find(submitted.issues,id).status,'open');
  const ack = m.advanceIssue(submitted,id,'');
  assert.equal(find(ack.issues,id).status,'acknowledged');
  assert.throws(()=>m.advanceIssue(ack,id,'brief'),/action taken/);
  const responding = m.advanceIssue(ack,id,'Site manager has inspected the gate.');
  assert.equal(find(responding.issues,id).status,'responding');
  const withPhoto = m.addSampleEvidence(responding,id,'image');
  const withDocument = m.addSampleEvidence(withPhoto,id,'document');
  assert.deepEqual(find(withDocument.issues,id).assets.map(a=>a.kind),['image','document']);
  const done = m.advanceIssue(withDocument,id,'Caretaker secured the side gate.');
  assert.equal(find(done.issues,id).status,'resolved');
  assert.equal(find(done.issues,id).history.length,4);
  assert.throws(()=>m.advanceIssue(done,id,'anything'),/no open issue/);
});

test('client reports are sorted by publication and preserve reporting periods', () => {
  const data = m.seedDemo('2026-11-05');
  const dates = m.siteReports(data,'greenview').map(r=>Date.parse(r.publishedAt));
  assert.deepEqual(dates,[...dates].sort((a,b)=>b-a));
  const next = m.publishReport(data,'karen','weekly');
  const report = next.reports[0];
  assert.equal(report.siteId,'karen');
  assert.equal(report.period,'weekly');
  assert.ok(report.periodFrom <= report.periodTo);
  assert.equal(m.siteReports(next,'greenview').length,m.siteReports(data,'greenview').length);
});

test('client sees an approved duty contact separate from the staff directory number', () => {
  const d = m.seedDemo('2026-11-05');
  const officer = d.staff.find(s=>s.id==='kevin');
  assert.ok(officer.workContact);
  assert.notEqual(officer.workContact,officer.phone);
});

test('manager can add a client site, officer and a visit with illustrative evidence', () => {
  const data = m.seedDemo('2026-11-05');
  const withSite = m.addSite(data,'Sunrise Court','Mombasa Road','Jane Njeri','07XX XXX 123');
  const site = withSite.sites[withSite.sites.length-1];
  const withStaff = m.addStaff(withSite,'New Officer','07XX XXX 777');
  assert.ok(withStaff.staff.some(s=>s.name==='New Officer'));
  const visited = m.logVisit(withStaff,site.id,'Inspected the entrance and shift register.',true);
  assert.equal(visited.activity[0].type,'visit');
  assert.equal(visited.activity[0].assets[0].kind,'image');
  assert.throws(()=>m.addSite(visited,'Sunrise Court','Mombasa Road','Jane Njeri',''),/already listed/);
});

test('mobile interface has two role options, client roster default, and consistent light cards', () => {
  const root = path.join(__dirname,'..');
  const read = p=>fs.readFileSync(path.join(root,p),'utf8');
  const ui = read('app/demos/security/SecurityExperience.tsx');
  const css = read('app/demos/security/SecurityExperience.module.css');
  const landing = read('app/demos/security/page.tsx');
  const directory = read('app/demos/page.tsx');
  const chrome = read('components/SiteChrome.tsx');
  assert.match(ui,/useState<Role>\('client'\)/);
  assert.match(ui,/useState\('roster'\)/);
  assert.match(ui,/<select id="security-role-select"/);
  assert.match(ui,/<option value="client"/);
  assert.match(ui,/<option value="manager"/);
  assert.doesNotMatch(ui,/<option value="supervisor"|<option value="operations"/);
  assert.match(ui,/type="date"/);
  const details=read('app/demos/security/SecurityRosterDetail.tsx');
  assert.match(ui,/shiftWindow\(shift\)/);
  assert.match(details,/Duty period:/);
  assert.match(details,/shiftWindow\(shift\)/);

  assert.match(ui,/fillRollingWindow/);
  assert.match(ui,/openTimeline/);
  assert.match(details,/Record ID:/);
  assert.match(details,/All activities during this duty/);
  assert.match(details,/Media and documents/);

  assert.match(ui,/Previous day/);
  assert.match(ui,/Next day/);
  assert.match(ui,/Issue #/);
  assert.match(ui,/Media & documents/);
  assert.match(ui,/Published reports/);
  assert.match(ui,/styles\.tabBar/);
  assert.match(css,/height: 100dvh/);
  assert.match(css,/max-width: 600px/);
  assert.doesNotMatch(ui,/dark:bg-|dark:text-/);
  assert.match(landing,/Two connected perspectives/);
  assert.match(directory,/>2 connected roles<\/span>/);
  assert.match(chrome,/path === '\/demos\/security\/experience'/);
  assert.doesNotMatch(ui+landing+directory,/No guard smartphone required|Guards do not need smartphones/i);
});
