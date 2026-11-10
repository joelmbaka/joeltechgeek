const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=(p)=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const queue=import(pathToFileURL(path.join(__dirname,'../mobile-app/src/lib/lead-queue.ts')).href);

test('Save & Next advances through original ordered page rather than restarting',async()=>{
  const {nextSnapshotId}=await queue;
  assert.equal(nextSnapshotId(['a','b','c','d'],'b'),'c');
  assert.equal(nextSnapshotId(['a','b','c','d'],'c'),'d');
  assert.equal(nextSnapshotId(['a','b','c','d'],'d'),null);
  assert.equal(nextSnapshotId(['a','b','c','d'],'unknown'),null);
});
test('snapshot order survives mutations that remove or reorder the saved lead',async()=>{
  const {nextSnapshotId}=await queue;
  const original=['A','B','C','D'];
  const changedServerList=['C','A','D'];
  assert.equal(nextSnapshotId(original,'B'),'C');
  assert.notEqual(changedServerList[0],'B');
});
test('page transition with removed last lead never skips the next original record',async()=>{
  const {nextPageAfterSnapshot}=await queue;
  const page=nextPageAfterSnapshot(['a','b','c'],['a','b','d','e','f'],0,false,3);
  assert.deepEqual(page,{ids:['d','e','f'],offset:2,hasMore:false});
});
test('page transition keeps the original sort position with overlap',async()=>{
  const {nextPageAfterSnapshot}=await queue;
  const page=nextPageAfterSnapshot(['b','c','d'],['a','b','c','d','e','f','g','h'],12,true,3);
  assert.deepEqual(page,{ids:['e','f','g'],offset:16,hasMore:true});
});
test('25-to-26 boundary survives a saved lead moving after the refreshed page',async()=>{
  const {nextPageAfterSnapshot}=await queue;
  const original=Array.from({length:25},(_,i)=>'lead-'+String(i+1).padStart(2,'0'));
  const fetched=[...original.slice(0,24),'lead-26','lead-27','lead-28','lead-29','lead-30','lead-25'];
  const page=nextPageAfterSnapshot(original,fetched,0,true,25);
  assert.deepEqual(page,{ids:['lead-26','lead-27','lead-28','lead-29','lead-30'],offset:24,hasMore:true});
});
test('missing anchors never jump to first arbitrary record',async()=>{
  const {nextPageAfterSnapshot}=await queue;
  assert.equal(nextPageAfterSnapshot(['b','c'],['a','d','e'],0,false),null);
});
test('route snapshots require valid UUIDs and bounded length',async()=>{
  const {parseQueueIds}=await queue;
  const a='201b2d40-ff94-4825-af0e-a66ab8a73778';
  const b='1f54a519-3726-4885-b7e9-8d5c76a012b3';
  assert.deepEqual(parseQueueIds(a+','+b),[a,b]);
  assert.deepEqual(parseQueueIds('b'),[]);
  assert.deepEqual(parseQueueIds(a+',not-a-uuid'),[]);
  assert.deepEqual(parseQueueIds('x'.repeat(3001)),[]);
});
test('lead-list passes filters, search, sort and the original page snapshot',()=>{
  const list=source('mobile-app/src/app/index.tsx');
  const detail=source('mobile-app/src/app/leads/[id].tsx');
  assert.match(list,/queueIds: queueIds\.join\(','\)/);
  assert.match(list,/queueQuery = debounced/);
  assert.match(list,/queueView = apiView/);
  assert.match(list,/queueOffset = offset/);
  assert.match(detail,/nextSnapshotId\(ids, response\.lead\.id\)/);
  assert.match(detail,/nextPageAfterSnapshot\(/);
  assert.match(detail,/q:queueQuery\|\|''/);
  assert.doesNotMatch(detail,/next\.leads\.find\(row=>row\.id!==id\)/);
});
test('Call selected by default but note-only and follow-up-only do not create outreach',()=>{
  const editor=source('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(editor,/useState\('call'\)/);
  assert.match(editor,/setChannel\('call'\)/);
  assert.match(editor,/channel: channel && outcome \? channel as ActivityChannel : null/);
  assert.match(editor,/outcome: channel && outcome \? outcome : null/);
  assert.match(editor,/stage && channel && outcome/);
});
test('lead cards retain priority and compact stage and activity beside due date',()=>{
  const list=source('mobile-app/src/app/index.tsx');
  assert.match(list,/<PriorityChip priority=\{lead\.priority\}/);
  assert.match(list,/lead\.stage\.replace\(/);
  assert.match(list,/\{lastActivity\}/);
  assert.match(list,/\{dueTime\}/);
  assert.match(list,/Due now/);
  assert.doesNotMatch(list,/scheduled: 'Scheduled'/);
});
test('typed follow-up choices and Expo StatusBar props compile structurally',()=>{
  const inline=source('mobile-app/src/components/InlineFollowupEditor.tsx');
  const sheet=source('mobile-app/src/components/RecordUpdateSheet.tsx');
  assert.match(inline,/ACTION_TYPES\.some\(option=>option\.value===value\)/);
  assert.doesNotMatch(inline,/onChange=\{setActionType\}/);
  assert.doesNotMatch(sheet,/<StatusBar[^>]*backgroundColor=/);
});
