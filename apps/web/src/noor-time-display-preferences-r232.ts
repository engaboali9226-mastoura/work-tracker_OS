/** NOOR R232 display-only preferences; no silent prayer-policy change. */
export type NoorR232City = Readonly<{
  name:string; country:string; latitude:number; longitude:number; timeZone:string;
}>;
export type NoorR232Preferences=Readonly<{
  afterSunrise:number; beforeDhuhr:number; fridayAdhan:string; selectedCity:NoorR232City|null;
  fastingTimerOutsideRamadan:boolean;
}>;
export const NOOR_R232_DEFAULT:NoorR232Preferences=Object.freeze({
  afterSunrise:20,beforeDhuhr:10,fridayAdhan:"",selectedCity:null,
  fastingTimerOutsideRamadan:false,
});
const KEY="noor:r232:time-display:v1";
function validCity(c:unknown):c is NoorR232City{
 if(!c||typeof c!=="object"||Array.isArray(c))return false;
 const v=c as Record<string,unknown>;
 if(typeof v.name!=="string"||v.name.length>100||typeof v.country!=="string"||
  typeof v.latitude!=="number"||v.latitude< -90||v.latitude>90||
  typeof v.longitude!=="number"||v.longitude< -180||v.longitude>180||
  typeof v.timeZone!=="string")return false;
 try{new Intl.DateTimeFormat("en-US",{timeZone:v.timeZone});return true;}catch{return false;}
}
export function readNoorR232Preferences():NoorR232Preferences{
 try{
  const raw=window.localStorage.getItem(KEY);if(!raw)return NOOR_R232_DEFAULT;
  const value=JSON.parse(raw) as Record<string,unknown>;
  const after=value.afterSunrise,before=value.beforeDhuhr,friday=value.fridayAdhan;
  return {
    afterSunrise:typeof after==="number"&&Number.isInteger(after)&&after>=15&&after<=30?after:20,
    beforeDhuhr:typeof before==="number"&&Number.isInteger(before)&&before>=5&&before<=30?before:10,
    fridayAdhan:typeof friday==="string"&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(friday)?friday:"",
    selectedCity:validCity(value.selectedCity)?value.selectedCity:null,
    fastingTimerOutsideRamadan:value.fastingTimerOutsideRamadan===true,
  };
 }catch{return NOOR_R232_DEFAULT;}
}
export function saveNoorR232Preferences(value:NoorR232Preferences):void{
 try{window.localStorage.setItem(KEY,JSON.stringify(value));}catch{}
}
