import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {groupNoorActivitiesR304,noorCategoryNameR304} from "../src/noor-activity-grouping-r304.js";

const definitions=[
 {id:"habit",category:" العلم ",importance:"Important",timeOfDay:"07:30",displayOrder:2},
 {id:"task",category:"العلم",importance:"Essential",timeOfDay:"19:00",displayOrder:1},
 {id:"health",category:"الصحة",importance:"Supporting",timeOfDay:"13:00"},
 {id:"drink",category:"الصحة",beveragePlan:{targetServings:3}}
];
const executions=[
 {id:"h1",definitionId:"habit",kind:"Habit" as const,title:"دراسة",status:"Pending",weight:8},
 {id:"t1",definitionId:"task",kind:"Task" as const,title:"قراءة",status:"Completed",weight:9},
 {id:"h2",definitionId:"health",kind:"Habit" as const,title:"رياضة",status:"InProgress",weight:6},
 {id:"drink1",definitionId:"drink",kind:"Habit" as const,title:"شاي",status:"Pending",weight:4}
];

test("R304: category links habit and task visually without duplicating execution",()=>{
 const grouped=groupNoorActivitiesR304(executions,definitions,"category",["الصحة","العلم"]);
 assert.deepEqual(grouped.map(g=>g.key),["الصحة","العلم"]);
 const learning=grouped[1]!;
 assert.equal(learning.habits,1);assert.equal(learning.tasks,1);assert.equal(learning.completed,1);
 assert.deepEqual(learning.rows.map(r=>r.execution.id),["t1","h1"]);
 assert.equal(grouped.reduce((n,g)=>n+g.rows.length,0),3,"drink has its own independent tracker");
 assert.equal(new Set(grouped.flatMap(g=>g.rows.map(r=>r.execution.id))).size,3);
 assert.equal(noorCategoryNameR304(" 1 - العلم  "),"1 - العلم");
});
test("R304: time, importance and status present the SAME records",()=>{
 for(const mode of ["time","importance","status"] as const){
  const grouped=groupNoorActivitiesR304(executions,definitions,mode);
  assert.deepEqual(grouped.flatMap(g=>g.rows.map(r=>r.execution.id)).sort(),["h1","h2","t1"]);
 }
 assert.deepEqual(groupNoorActivitiesR304(executions,definitions,"time").map(g=>g.key),["صباحًا","بعد الظهر","مساءً"]);
 assert.deepEqual(groupNoorActivitiesR304(executions,definitions,"importance").map(g=>g.key),["Essential","Important","Supporting"]);
 assert.deepEqual(groupNoorActivitiesR304(executions,definitions,"status").map(g=>g.key),["InProgress","Pending","Completed"]);
});
test("R304: dedupe repeated execution IDs; preserve input records and stored category",()=>{
 const before=JSON.stringify({definitions,executions});
 const grouped=groupNoorActivitiesR304([...executions,executions[0]!],definitions,"category");
 assert.equal(grouped.flatMap(g=>g.rows).length,3);
 assert.equal(JSON.stringify({definitions,executions}),before);
 assert.equal(definitions[0]!.category," العلم ");
});
test("R304: dashboard keeps legacy view and mounts existing ActivityCard for each row",()=>{
 const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 assert.match(source,/groupNoorActivitiesR304/);
 assert.match(source,/data-testid="r304-activity-view"/);
 assert.match(source,/activityView==="separate"/);
 assert.match(source,/readNoorActivityViewR304/);
 assert.match(source,/data-testid="r304-unified-groups"/);
 assert.match(source,/data-testid="r304-unified-group"/);
 assert.match(source,/group.rows.map\(\(\{execution:item,definition\}\)=><ActivityCard/);
 assert.match(source,/onCommand=\{historyDate\?historicalCommand:onCommand\}/);
 assert.match(source,/todayDate=\{view.localDate\?\?undefined\}/);
 assert.match(source,/data-testid="habit-category-grid"/);
 assert.match(source,/<TaskSessionListR254/);
});
