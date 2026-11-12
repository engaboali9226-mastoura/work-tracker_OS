import type {NoorActivityViewR304} from "./noor-activity-grouping-r304.js";

// Browser-only adapter; the application-view layer never accesses browser storage.
const KEY="noor:personal:activity-view:r304";
const accepted:readonly NoorActivityViewR304[]=["separate","category","time","importance","status"];
export function readNoorActivityViewR304():NoorActivityViewR304{
  try{
    const value=typeof window!=="undefined"?window.localStorage.getItem(KEY):null;
    return accepted.find(mode=>mode===value)??"separate";
  }catch{return "separate";}
}
export function saveNoorActivityViewR304(value:NoorActivityViewR304):void{
  if(!accepted.includes(value))return;
  try{if(typeof window!=="undefined")window.localStorage.setItem(KEY,value);}catch{/* Non-essential preference. */}
}
