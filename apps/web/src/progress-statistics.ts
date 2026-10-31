export type StatisticRow=Readonly<{id:string;definitionId:string;title:string;kind:'Habit'|'Task';date:string;weight:number;status:string;amount:number;unit:string}>;
export function validStatisticDate(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function parseStatisticRows(value:unknown):StatisticRow[]{if(!Array.isArray(value))return [];return value.flatMap(r=>{if(!r||typeof r!=='object'||typeof r.id!=='string'||typeof r.definitionId!=='string'||typeof r.title!=='string'||!['Habit','Task'].includes(r.kind)||!validStatisticDate(r.date)||typeof r.weight!=='number'||!Number.isFinite(r.weight)||r.weight<=0||typeof r.status!=='string'||typeof r.amount!=='number'||!Number.isFinite(r.amount)||r.amount<0||typeof r.unit!=='string')return [];return [r as StatisticRow];});}
export const statisticEligible=(r:StatisticRow)=>r.status!=='Suppressed'&&r.status!=='Cancelled';
export function summarizeProgress(rows:readonly StatisticRow[]){const due=rows.filter(statisticEligible),weight=due.reduce((n,r)=>n+r.weight,0),completedWeight=due.filter(r=>r.status==='Completed').reduce((n,r)=>n+r.weight,0);return {scheduled:due.length,completed:due.filter(r=>r.status==='Completed').length,weight,completedWeight,rate:weight?Math.round(completedWeight/weight*100):null};}
export function shiftStatisticDate(date:string,days:number){return new Date(Date.parse(date+'T00:00:00Z')+days*86400000).toISOString().slice(0,10);}
export function shiftStatisticMonth(date:string,months:number){const d=new Date(date+'T00:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,end));return d.toISOString().slice(0,10);}
export function statisticPeriods(rows:readonly StatisticRow[],currentDate:string|null){if(!validStatisticDate(currentDate))return [];const first=rows.filter(r=>statisticEligible(r)&&r.date<=currentDate).map(r=>r.date).sort()[0];if(!first)return [];return ([['week','الأسبوع',0],['month','الشهر',1],['quarter','ربع السنة',3],['half','نصف السنة',6]] as const).map(([key,label,months])=>{const unlockDate=months?shiftStatisticMonth(first,months):shiftStatisticDate(first,7),start=months?shiftStatisticMonth(currentDate,-months):shiftStatisticDate(currentDate,-7),end=shiftStatisticDate(currentDate,-1),periodRows=rows.filter(r=>r.date>=start&&r.date<=end);return {key,label,start,end,unlockDate,ready:currentDate>=unlockDate,rows:periodRows,...summarizeProgress(periodRows)};});}
export function statisticDays(rows:readonly StatisticRow[],currentDate:string|null,limit=14,startDate?:string){if(!validStatisticDate(currentDate))return [];const eligible=rows.filter(r=>statisticEligible(r)&&r.date<=currentDate),first=validStatisticDate(startDate)?startDate:eligible.map(r=>r.date).sort()[0];if(!first)return [];const start=[first,shiftStatisticDate(currentDate,-Math.max(0,limit-1))].sort().at(-1)!;const result=[];for(let date=start;date<=currentDate;date=shiftStatisticDate(date,1)){const items=eligible.filter(r=>r.date===date);result.push({date,...summarizeProgress(items),amount:items.reduce((n,r)=>n+r.amount,0)});}return result;}

export function statisticInsights(rows:readonly StatisticRow[],currentDate:string|null){
 if(!validStatisticDate(currentDate))return {current:0,best:0,perfect:0,change:null as number|null};
 const grouped=new Map<string,StatisticRow[]>();for(const r of rows)if(statisticEligible(r)&&r.date<=currentDate)grouped.set(r.date,[...(grouped.get(r.date)??[]),r]);
 let current=0,best=0,perfect=0;for(const [date,items]of [...grouped].sort(([a],[b])=>a.localeCompare(b))){if(items.every(r=>r.status==='Completed')){current++;perfect++;best=Math.max(best,current);}else if(date!==currentDate)current=0;}
 const first=[...grouped.keys()].sort()[0],end=shiftStatisticDate(currentDate,-1),start=shiftStatisticDate(currentDate,-7),previous=shiftStatisticDate(currentDate,-14);
 const recent=summarizeProgress(rows.filter(r=>r.date>=start&&r.date<=end)),prior=summarizeProgress(rows.filter(r=>r.date>=previous&&r.date<start));
 return {current,best,perfect,change:first&&first<=previous&&recent.rate!==null&&prior.rate!==null?recent.rate-prior.rate:null};
}
export function statisticCalendar(rows:readonly StatisticRow[],month:string,currentDate:string|null){
 if(!/^\d{4}-\d{2}$/.test(month)||!validStatisticDate(month+'-01')||!validStatisticDate(currentDate))return {offset:0,days:[] as {date:string;rate:number|null;scheduled:number;future:boolean}[]};
 const first=new Date(month+'-01T00:00:00Z'),offset=(first.getUTCDay()+1)%7,count=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 return {offset,days:Array.from({length:count},(_,i)=>{const date=month+'-'+String(i+1).padStart(2,'0'),summary=summarizeProgress(rows.filter(r=>r.date===date));return {date,rate:summary.rate,scheduled:summary.scheduled,future:date>currentDate};})};
}

export function wholeWeekAchievement(rows:readonly StatisticRow[],currentDate:string|null,liveToday?:readonly StatisticRow[]){
 if(!validStatisticDate(currentDate))return [];
 const offset=(new Date(currentDate+'T00:00:00Z').getUTCDay()+1)%7,start=shiftStatisticDate(currentDate,-offset);
 return Array.from({length:7},(_,index)=>{const date=shiftStatisticDate(start,index),future=date>currentDate,current=date===currentDate,items=future?[]:current&&liveToday!==undefined?liveToday:rows.filter(r=>r.date===date);return {date,future,current,...summarizeProgress(items)};});
}
export function yesterdayAchievement(rows:readonly StatisticRow[],currentDate:string|null){
 if(!validStatisticDate(currentDate))return null;
 const date=shiftStatisticDate(currentDate,-1),items=rows.filter(r=>r.date===date&&statisticEligible(r)),missed=items.filter(r=>r.status!=='Completed');
 return {date,missed,missedWeight:missed.reduce((n,r)=>n+r.weight,0),...summarizeProgress(items)};
}
