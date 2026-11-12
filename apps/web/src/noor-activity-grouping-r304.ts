/**
 * R304: Presentation-only multi-dimensional grouping.
 * An execution remains the only source of completion and weighted credit;
 * grouping NEVER creates a definition, activity entry or an additional score.
 * Links here mean shared category membership, not an explicit dependency graph.
 */
export type NoorActivityViewR304="category"|"time"|"importance"|"status"|"separate";
export type NoorGroupedViewR304=Exclude<NoorActivityViewR304,"separate">;
export type NoorGroupExecutionR304=Readonly<{
  id:string; definitionId:string; kind:"Habit"|"Task"; title:string; status:string; weight?:number;
}>;
export type NoorGroupDefinitionR304=Readonly<{
  id:string; category?:string; timeOfDay?:string; importance?:string;
  displayOrder?:number; title?:string; beveragePlan?:unknown;
}>;
export type NoorGroupedActivityR304<E extends NoorGroupExecutionR304,D extends NoorGroupDefinitionR304>=Readonly<{
  key:string; label:string; rows:readonly Readonly<{execution:E;definition:D|undefined}>[];
  habits:number; tasks:number; completed:number;
}>;

const importanceLabels:Readonly<Record<string,string>>={
  Essential:"أساسي",Important:"مهم",Supporting:"داعم",Optional:"اختياري"
};
const statusLabels:Readonly<Record<string,string>>={
  Planned:"مخطط",Pending:"بانتظار التنفيذ",InProgress:"قيد التنفيذ",
  Completed:"مكتمل",Deferred:"مؤجل",Missed:"فائت",Skipped:"متجاوز",
  Cancelled:"ملغي",Suppressed:"موقوف"
};
const priorityOrder=["Essential","Important","Supporting","Optional"];
const timeOrder=["صباحًا","بعد الظهر","مساءً","غير محدد"];
const statusOrder=["InProgress","Pending","Planned","Deferred","Missed","Completed","Skipped","Cancelled","Suppressed"];

export function noorCategoryNameR304(value:string|undefined):string {
  return value?.trim().replace(/\s+/g," ")||"عام";
}
function timeKey(value:string|undefined):string{
  const match=/^([01]\d|2[0-3]):[0-5]\d$/.exec(value??"");
  if(!match)return "غير محدد";
  const hour=Number(match[1]);
  return hour<12?"صباحًا":hour<18?"بعد الظهر":"مساءً";
}
export function groupNoorActivitiesR304<
  E extends NoorGroupExecutionR304,D extends NoorGroupDefinitionR304
>(
  executions:readonly E[], definitions:readonly D[], mode:NoorGroupedViewR304,
  categoryOrder:readonly string[]=[]
):readonly NoorGroupedActivityR304<E,D>[] {
  const definitionsById=new Map(definitions.map(d=>[d.id,d] as const));
  const groups=new Map<string,{key:string;label:string;rows:{execution:E;definition:D|undefined}[]}>();
  const seen=new Set<string>();
  for(const execution of executions){
    if(seen.has(execution.id))continue;
    seen.add(execution.id);
    const definition=definitionsById.get(execution.definitionId);
    // Drink counters remain on their independent informational card.
    if(definition?.beveragePlan)continue;
    let key:string; let label:string;
    if(mode==="category"){
      label=noorCategoryNameR304(definition?.category);key=label;
    }else if(mode==="time"){
      label=timeKey(definition?.timeOfDay);key=label;
    }else if(mode==="importance"){
      key=definition?.importance||"Other";label=importanceLabels[key]??"غير محدد";
    }else{
      key=execution.status;label=statusLabels[key]??"حالة أخرى";
    }
    const group=groups.get(key)??{key,label,rows:[]};
    group.rows.push({execution,definition});
    groups.set(key,group);
  }
  const rank=(key:string):number=>{
    const order=mode==="category"?categoryOrder.map(noorCategoryNameR304):mode==="time"?timeOrder:mode==="importance"?priorityOrder:statusOrder;
    const idx=order.indexOf(key);
    return idx===-1?Number.MAX_SAFE_INTEGER:idx;
  };
  return [...groups.values()].sort((a,b)=>rank(a.key)-rank(b.key)||a.label.localeCompare(b.label,"ar"))
    .map(group=>{
      const rows=[...group.rows].sort((a,b)=>
        (a.definition?.displayOrder??Number.MAX_SAFE_INTEGER)-(b.definition?.displayOrder??Number.MAX_SAFE_INTEGER)
        ||(a.definition?.timeOfDay??"99:99").localeCompare(b.definition?.timeOfDay??"99:99")
        ||a.execution.title.localeCompare(b.execution.title,"ar")
      );
      return {
        key:group.key,label:group.label,rows,
        habits:rows.filter(r=>r.execution.kind==="Habit").length,
        tasks:rows.filter(r=>r.execution.kind==="Task").length,
        completed:rows.filter(r=>r.execution.status==="Completed").length,
      };
    });
}
