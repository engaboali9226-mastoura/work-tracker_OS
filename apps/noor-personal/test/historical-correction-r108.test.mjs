import assert from 'node:assert/strict';
import test from 'node:test';
import {parsePersonalCommand} from '../dist/index.js';
const base={type:'correct-historical-execution',executionId:'existing-1',localDate:'2026-10-31',expectedStatus:'Missed',completed:true};
test('R108: past-day correction command is strict and preserves its date',()=>{
 assert.deepEqual(parsePersonalCommand(base),base);
 assert.equal(parsePersonalCommand({...base,localDate:'2026-02-30'}),null);
 assert.equal(parsePersonalCommand({...base,unexpected:true}),null);
 assert.equal(parsePersonalCommand({...base,expectedStatus:'Suppressed'}),null);
 assert.equal(parsePersonalCommand({...base,completed:'yes'}),null);
});
test('R108: past-day progress requires valid note or amount',()=>{
 const ok={type:'record-historical-progress',executionId:'existing-1',entryId:'hist-1',localDate:'2026-10-31',note:'تمت المراجعة',amount:0};
 assert.deepEqual(parsePersonalCommand(ok),ok);
 assert.equal(parsePersonalCommand({...ok,note:'',amount:0}),null);
 assert.equal(parsePersonalCommand({...ok,amount:-1}),null);
 assert.equal(parsePersonalCommand({...ok,localDate:'2026-13-01'}),null);
 assert.equal(parsePersonalCommand({...ok,note:'note',random:true}),null);
});

test('R108: correction of an existing past occurrence changes historical statistics, not its date',async()=>{
 const {InMemoryFoundationStore,PersonalCommandService,SequenceIdGenerator,buildPersonalWorkspace}=await import('../dist/index.js');
 const now='2026-11-02T12:00:00.000Z';
 const definition={id:'h1',userId:'u',kind:'Habit',revisionId:'r1',title:'الأذكار',category:'الأذكار',state:'Active',schedule:{kind:'Daily'},effectiveFromDate:'2026-10-31',importance:'Supporting',weight:1,gatePolicy:'NonBlocking',targets:{}};
 const day={id:'day-old',userId:'u',boundary:{key:'personal-day:u:2026-10-31',localDate:'2026-10-31',startAt:'2026-10-31T01:00:00Z',endAt:'2026-11-01T01:00:00Z',timeZone:'Asia/Riyadh'},state:'Closed',version:2,createdAt:'2026-10-31T01:00:00Z',updatedAt:'2026-11-01T01:00:00Z'};
 const occurrence={id:'e1',userId:'u',personalDayId:day.id,definitionId:'h1',definitionRevisionId:'r1',kind:'Habit',title:'الأذكار',materializationKey:'m1',scheduleOccurrenceKey:'2026-10-31',status:'Missed',eligibility:{definitionRevisionId:'r1',importance:'Supporting',weight:1,gatePolicy:'NonBlocking',targets:{}},version:1,createdAt:'2026-10-31T02:00:00Z',updatedAt:'2026-10-31T02:00:00Z'};
 const store=new InMemoryFoundationStore({personalDays:[day],definitions:[definition],dailyExecution:[occurrence]});
 const service=new PersonalCommandService({clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),transaction:store});
 const correction={type:'correct-historical-execution',executionId:'e1',localDate:'2026-10-31',expectedStatus:'Missed',completed:true};
 await service.execute('u',correction);
 assert.equal(store.snapshot().dailyExecution[0].status,'Completed');
 assert.equal(store.snapshot().dailyExecution[0].version,2);
 await service.execute('u',correction);
 assert.equal(store.snapshot().dailyExecution[0].version,2);
 // InMemoryFoundationStore.snapshot() returns raw arrays, not the snapshot port.
 // Adapt them explicitly to the production read-only snapshot interface.
 const state=store.snapshot();
 const workspaceSnapshot={
   listDefinitions:()=>state.definitions,
   listPersonalDays:()=>state.personalDays,
   listDailyExecutionForUser:()=>state.dailyExecution,
 };
 const workspace=buildPersonalWorkspace('u',workspaceSnapshot);
 assert.equal(workspace.statistics.rows[0].status,'Completed');
 assert.equal(workspace.statistics.rows[0].date,'2026-10-31');
 await assert.rejects(()=>service.execute('u',{...correction,localDate:'2026-11-02'}));
 await assert.rejects(()=>service.execute('another-user',correction));
 const note={type:'record-historical-progress',executionId:'e1',localDate:'2026-10-31',entryId:'history-note-1',amount:0,note:'تم تسجيله لاحقًا'};
 await service.execute('u',note);
 assert.equal(store.snapshot().definitions[0].activityLog[0].at,now);
 assert.equal(store.snapshot().definitions[0].activityLog[0].localDate,'2026-10-31');
 await service.execute('u',note);
 assert.equal(store.snapshot().definitions[0].activityLog.length,1);
});
