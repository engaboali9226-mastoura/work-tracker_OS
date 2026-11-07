import test from "node:test";
import assert from "node:assert/strict";
import {emptyNoorWorkStateR264,validNoorWorkStateR264,NoorWorkTeacherOperationR264} from "../src/noor-work-teacher-operation-r264.js";
import type {NoorWorkTeacherDependenciesR264} from "../src/noor-work-teacher-operation-r264.js";
import {AuthorizationDeniedError} from "@worktracker/core";

const fixture=()=>{
 const state=emptyNoorWorkStateR264();
 state.timetable.push({id:"lesson_one",day:0,period:1,subject:"علوم",group:"الخامس أ",room:"",start:"08:00",end:"08:45"});
 state.students.push({id:"student_one",name:"طالب تجريبي",group:"الخامس أ",code:""});
 state.preparations.push({id:"prep_one",slotId:"lesson_one",date:"2026-11-08",title:"معالم اليابسة",objectives:"تمييز الجبل",activities:"صورة",homework:"سؤال"});
 state.assessments.push({id:"quiz_one",group:"الخامس أ",title:"اختبار ١",date:"2026-11-09",maxScore:10});
 state.grades.push({id:"mark_one",assessmentId:"quiz_one",studentId:"student_one",score:9});
 state.attendance.push({id:"attendance_one",slotId:"lesson_one",studentId:"student_one",date:"2026-11-08",status:"present"});
 return state;
};
test("accepts a bounded owner-neutral teacher workspace and preserves score referential integrity",()=>{
 const work=fixture();
 assert.equal(validNoorWorkStateR264(work),true);
 assert.equal(validNoorWorkStateR264({...work,grades:[{...work.grades[0]!,score:11}]}),false);
 assert.equal(validNoorWorkStateR264({...work,attendance:[{...work.attendance[0]!,studentId:"other_owner"}]}),false);
 assert.equal(validNoorWorkStateR264({...work,timetable:[...work.timetable,{...work.timetable[0]!,id:"lesson_duplicate"}]}),false);
 assert.equal(validNoorWorkStateR264({...work,preparations:[{...work.preparations[0]!,slotId:"missing"}]}),false);
});
test("rejects malformed or overlong strings and untrusted extra keys",()=>{
 const work=fixture();
 assert.equal(validNoorWorkStateR264({...work,ownerId:"someone_else"}),false);
 assert.equal(validNoorWorkStateR264({...work,preparations:[{...work.preparations[0]!,objectives:"a".repeat(3000)}]}),false);
});
function operation(authResult:"allow"|"deny"|"no-session",observed:{reads:number}):NoorWorkTeacherOperationR264{
 const user={toString:()=>"19a5364c-e88b-4fd5-b927-83e0c696c601"};
 const d={
   isRuntimeRunning:()=>true,
   resolveSession:{execute:async()=>{if(authResult==="no-session")throw new Error("bad session"); return {accountId:"account_demo"};}},
   authorize:{execute:async()=>{if(authResult==="deny")throw new AuthorizationDeniedError();}},
   accountUserResolver:{resolve:async()=>user},
   client:{from:()=>{observed.reads++;throw Error("database must not be touched");}},
 };
 return new NoorWorkTeacherOperationR264(d as unknown as NoorWorkTeacherDependenciesR264);
}
test("unentitled accounts cannot read or write teacher records even when they know the route",async()=>{
 const observed={reads:0};const op=operation("deny",observed);
 assert.equal((await op.read("cookie")).status,403);
 assert.equal((await op.write("cookie",{expectedRevision:0,state:fixture()})).status,403);
 assert.equal(observed.reads,0);
});
test("an absent or invalid session never accesses teacher data",async()=>{
 const observed={reads:0};const op=operation("no-session",observed);
 assert.equal((await op.read(null)).status,401);
 assert.equal((await op.write("wrong",{expectedRevision:0,state:fixture()})).status,503);
 assert.equal(observed.reads,0);
});
test("valid teacher data is required before a privileged write",async()=>{
 const observed={reads:0};const op=operation("allow",observed);
 assert.equal((await op.write("cookie",{expectedRevision:0,state:{}})).status,400);
 assert.equal(observed.reads,0);
});

test("R267 accepts external school portal lesson checkpoints while retaining prior teacher records",()=>{
 const work=fixture();
 work.termStartDate="2026-08-23";
 work.lessonChecks=[{id:"check_first",slotId:"lesson_one",date:"2026-11-08",prepared:true,attendanceRecorded:false}];
 work.assessmentChecks=[{id:"exam_check_first",assessmentId:"quiz_one",prepared:true,corrected:false,recorded:false}];
 assert.equal(validNoorWorkStateR264(work),true);
 const {termStartDate,lessonChecks,assessmentChecks,...legacy}=work;
 assert.equal(validNoorWorkStateR264(legacy),true,"previously saved state must remain readable");
 assert.equal(validNoorWorkStateR264({...work,termStartDate:"2026-08-24"}),false,"term start must be a Sunday");
 assert.equal(validNoorWorkStateR264({...work,lessonChecks:[...work.lessonChecks,...work.lessonChecks]}),false,"duplicate slot/date is invalid");
 assert.equal(validNoorWorkStateR264({...work,lessonChecks:[{...work.lessonChecks[0]!,slotId:"wrong_slot"}]}),false);
 assert.equal(validNoorWorkStateR264({...work,lessonChecks:[{...work.lessonChecks[0]!,attendanceRecorded:"yes"}]}),false,"checkbox status is never untrusted text");
 assert.equal(validNoorWorkStateR264({...work,assessmentChecks:[{...work.assessmentChecks[0]!,assessmentId:"wrong_exam"}]}),false);
});
