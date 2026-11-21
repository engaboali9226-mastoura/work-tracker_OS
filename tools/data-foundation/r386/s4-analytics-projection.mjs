// S4 candidate server/tool-side only; no production composition, browser endpoint,
// key or direct DB access. Reuse the approved application and statistics rules.
import {buildPersonalWorkspace,evaluateR386PersonalFoundationCandidate} from "../../../apps/noor-personal/dist/index.js";
import {parseStatisticRows,parsePrayerStatisticDaysR334,weightedStatisticRowsR334,summarizeProgress,statisticPeriods,wholeWeekAchievement,statisticCalendar,validStatisticDate} from "../../../apps/web/src/progress-statistics.ts";
import {projectLegacyFacts} from "./legacy-analytics-facts.mjs";
import {validIdentifier} from "./legacy-event-contract.mjs";

const cleanTotal=({scheduled,completed,weight,completedWeight,rate})=>({scheduled,completed,weight,completedWeight,rate});
const cleanInsight=({windowDays,scheduled,completed,completionRate,successfulDays})=>({windowDays,scheduled,completed,completionRate,successfulDays});
const validInstant=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const invariant=(condition,code)=>{if(!condition)throw Error(code);};

// The server supplies owner and revision from the authorized S3 load. No
// inference of actual date from a due date, audit timestamp or a score row.
// The output is a restricted projection, not a new scoring authority.
export async function projectS4Analytics({owner,sourceRevision,state,evaluatedAt}){
 invariant(validIdentifier(owner)&&Number.isSafeInteger(sourceRevision)&&sourceRevision>=0&&validInstant(evaluatedAt),"R386_S4_PROJECTION_SCOPE");
 const facts=projectLegacyFacts({owner,sourceRevision,state});
 let workspace;
 await evaluateR386PersonalFoundationCandidate(owner,state,async scope=>{
  workspace=buildPersonalWorkspace(owner,scope.snapshot,evaluatedAt);
 });
 const currentDate=workspace.statistics.currentDate;
 const raw=workspace.statistics.rows;
 const parsed=parseStatisticRows(raw);
 const prayer=workspace.prayerAchievementR334??[];
 const parsedPrayers=parsePrayerStatisticDaysR334(prayer);
 invariant(parsed.length===raw.length&&parsedPrayers.length===prayer.length,"R386_S4_PROJECTION_INVALID");
 // Same canonical weighted rows, but discard free text, units, quantities and
 // all definition metadata. Date and weight remain distinct from provenance.
 const rows=weightedStatisticRowsR334(parsed,parsedPrayers,currentDate).map(r=>({
  id:r.id,definitionId:r.definitionId,kind:r.kind,date:r.date,status:r.status,weight:r.weight,
  ...(r.credit!==undefined?{credit:r.credit}:{}),...(r.nonAchievement!==undefined?{nonAchievement:r.nonAchievement}:{}),
  ...(r.recoveryBonus!==undefined?{recoveryBonus:r.recoveryBonus}:{}),
  ...(r.completionDate!==undefined?{completionDate:r.completionDate}:{}),
  ...(r.recoveredWeight!==undefined?{recoveredWeight:r.recoveredWeight}:{}),
  ...(r.sessionWeight!==undefined?{sessionWeight:r.sessionWeight}:{}),
  ...(r.kind==="Prayer"?{prayerKey:r.prayerKey}:{}),
  title:"",amount:0,unit:""
 }));
 const execById=new Map(state.dailyExecution.map(row=>[row.id,row]));
 const scoreRows=rows.map(({title,amount,unit,...row})=>{
  const stored=execById.get(row.id)?.eligibility?.weight;
  return {...row,projectionWeightBasis:row.kind==="Prayer"?"ApprovedDayPrayerSnapshot":
   typeof stored==="number"&&Number.isFinite(stored)&&stored>0
     ?row.sessionWeight!==undefined?"ObservedEligibilityExpandedBySessions":"ObservedExecutionEligibility"
     :"LegacyScoringFallbackOnly",
   observedEligibilityWeight:row.kind==="Prayer"?null:typeof stored==="number"&&Number.isFinite(stored)&&stored>0?stored:null};
 });
 const observedDates=new Set([...rows.map(r=>r.date),...facts.executions.map(r=>r.dueDate)]);
 const daily=[...observedDates].filter(d=>validStatisticDate(d)&&currentDate!==null&&d<=currentDate).sort().map(date=>({date,...cleanTotal(summarizeProgress(rows.filter(r=>r.date===date)))}));
 const periods=statisticPeriods(rows,currentDate).map(({key,start,end,unlockDate,ready,...totals})=>({key,start,end,unlockDate,ready,...cleanTotal(totals)}));
 const week=wholeWeekAchievement(rows,currentDate).map(({date,future,current,...totals})=>({date,future,current,...cleanTotal(totals)}));
 const calendar=currentDate?statisticCalendar(rows,currentDate.slice(0,7),currentDate):{offset:0,days:[]};
 const serverPeriods=Object.fromEntries(Object.entries(workspace.insights.periods).map(([k,v])=>[k,cleanInsight(v)]));
 // Do not mix due-day achievement, observed activity day, and explicit
 // performed dates. The same execution and an activity are different units.
 const explicitExecutionDates={},explicitActivityDates={},observedActivityDates={};
 const add=(target,date)=>{if(date!==null)target[date]=(target[date]??0)+1;};
 for(const row of facts.executions)if(row.status==="Completed")add(explicitExecutionDates,row.performedDate);
 for(const row of facts.activities){add(explicitActivityDates,row.performedDate);add(observedActivityDates,row.activityLocalDate);}
 return {factVersion:1,owner,sourceRevision,evaluatedAt,currentDate,scoreRows,daily,week,periods,calendar,serverPeriods,
  coverage:{executionCount:facts.executions.length,completedCount:facts.executions.filter(r=>r.status==="Completed").length,
   completedExplicitDate:facts.executions.filter(r=>r.status==="Completed"&&r.performedDate!==null).length,
   completedLegacyRecoveryOnly:facts.executions.filter(r=>r.status==="Completed"&&r.performedDate===null&&r.legacyRecoveryDate!==null).length,
   completedUnknownDate:facts.executions.filter(r=>r.status==="Completed"&&r.performedDate===null&&r.legacyRecoveryDate===null).length,
   historicalWeightUnknown:facts.executions.filter(r=>r.historicalWeight===null).length,
   activityCount:facts.activities.length},
  explicitExecutionDates,explicitActivityDates,observedActivityDates};
}
