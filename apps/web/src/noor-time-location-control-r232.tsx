import {useEffect,useRef,useState,type ReactElement} from "react";
import {r232ParseFridayClock} from "./noor-islamic-daylight-r232.js";
import {type NoorR232City,type NoorR232Preferences} from "./noor-time-display-preferences-r232.js";
type Result=Readonly<{name:string;country:string;latitude:number;longitude:number;timeZone:string}>;
function validZone(zone:string):boolean{
 try{new Intl.DateTimeFormat("en-US",{timeZone:zone});return true;}catch{return false;}
}
export function NoorR232ControlLocation({serverZone,preferences,onChange,onCommit}:{
 serverZone:string;preferences:NoorR232Preferences;
 onChange:(p:NoorR232Preferences)=>void;
 onCommit?:(city:NoorR232City)=>Promise<boolean>;
}):ReactElement{
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<readonly Result[]>([]);
 const [searching,setSearching]=useState(false);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState("");
 const lastSearch=useRef(0);
 const [previewNow,setPreviewNow]=useState(()=>Date.now());
 const [zoneInput,setZoneInput]=useState(preferences.displayZone??"");
 useEffect(()=>{setZoneInput(preferences.displayZone??"");},[preferences.displayZone]);
 useEffect(()=>{
   const tick=()=>setPreviewNow(Date.now());
   const timer=window.setInterval(tick,30000);
   window.addEventListener("focus",tick);
   return()=>{window.clearInterval(timer);window.removeEventListener("focus",tick);};
 },[]);
 const previewZone=preferences.displayZone&&validZone(preferences.displayZone)
   ?preferences.displayZone:serverZone;
 const previewClock=new Intl.DateTimeFormat("ar-SA-u-nu-latn",{
   timeZone:previewZone,hour:"numeric",minute:"2-digit",hour12:true,
 }).format(new Date(previewNow));
 const previewDate=new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{
   timeZone:previewZone,weekday:"long",day:"numeric",month:"long",
 }).format(new Date(previewNow));
 const commitZone=(candidate:string)=>{
   const zone=candidate.trim();
   if(!zone){onChange({...preferences,displayZone:null,selectedCity:null});setZoneInput("");setMessage("عادت معاينة الساعة إلى المنطقة الزمنية المعتمدة في نور.");return;}
   if(zone.length>90||!validZone(zone)){setMessage("اختر منطقة زمنية صحيحة من القائمة أو أدخل اسم IANA مثل Asia/Riyadh.");return;}
   onChange({...preferences,displayZone:zone,
     selectedCity:preferences.selectedCity?.timeZone===zone?preferences.selectedCity:null});
   setZoneInput(zone);
   setMessage("تم تحديث معاينة التوقيت لهذه الجلسة. تغيير موقع الحساب ومواقيت الصلاة يتطلب إعدادًا معتمدًا على الخادم.");
 };
 const suggestedZones=["Asia/Riyadh","Africa/Cairo","Asia/Dubai",
   "Asia/Kuwait","Asia/Qatar","Asia/Bahrain","Europe/London",
   "Europe/Istanbul","America/New_York","UTC"];

 const select=(city:NoorR232City)=>{
   onChange({...preferences,selectedCity:city,displayZone:city.timeZone});
   setZoneInput(city.timeZone);
   setResults([]);
   setQuery("");
   setMessage("تم اختيار المدينة مؤقتًا لهذه الجلسة. مواقيت نور الأساسية لن تتغير حتى تحديث سياسة الموقع على الخادم.");
 };
 const search=async()=>{
   if(query.trim().length<2||query.length>80){setMessage("اكتب حرفين على الأقل للبحث.");return;}
   const token=++lastSearch.current;
   setSearching(true);setMessage("");
   try{
     const url=new URL("https://geocoding-api.open-meteo.com/v1/search");
     url.searchParams.set("name",query.trim());
     url.searchParams.set("count","7");url.searchParams.set("language","ar");url.searchParams.set("format","json");
     const response=await fetch(url.toString(),{credentials:"omit",cache:"no-store"});
     if(!response.ok)throw Error("LOCATION_LOOKUP_UNAVAILABLE");
     const payload=await response.json() as {results?:unknown};
     if(token!==lastSearch.current)return;
     const rows=Array.isArray(payload.results)?payload.results:[];
     const cities=rows.flatMap((entry):Result[]=>{
       if(!entry||typeof entry!=="object")return [];
       const e=entry as Record<string,unknown>;
       if(typeof e.name!=="string"||typeof e.country!=="string"||
         typeof e.latitude!=="number"||!Number.isFinite(e.latitude)||Math.abs(e.latitude)>90||
         typeof e.longitude!=="number"||!Number.isFinite(e.longitude)||Math.abs(e.longitude)>180||
         typeof e.timezone!=="string"||!validZone(e.timezone))return [];
       return [{name:e.name,country:e.country,latitude:e.latitude,
         longitude:e.longitude,timeZone:e.timezone}];
     });
     setResults(cities);
     if(!cities.length)setMessage("لا توجد مدن مطابقة. جرّب اسمًا آخر.");
   }catch{if(token===lastSearch.current)setMessage("تعذر البحث في المدن حاليًا. حاول لاحقًا.");}
   finally{if(token===lastSearch.current)setSearching(false);}
 };
 const gps=()=>{
   if(!navigator.geolocation){setMessage("الجهاز لا يدعم تحديد الموقع.");return;}
   setMessage("سيُرسل موقعك إلى خدمة تحديد المدينة بعد موافقتك. لن نحفظ إحداثيات GPS الدقيقة.");
   navigator.geolocation.getCurrentPosition(position=>{
     const latitude=position.coords.latitude,longitude=position.coords.longitude;
     void (async()=>{
       try{
         const url=new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
         url.searchParams.set("latitude",String(latitude));
         url.searchParams.set("longitude",String(longitude));
         url.searchParams.set("localityLanguage","ar");
         const response=await fetch(url.toString(),{credentials:"omit",cache:"no-store"});
         if(!response.ok)throw Error("REVERSE_LOOKUP_UNAVAILABLE");
         const body=await response.json() as Record<string,unknown>;
         const place=typeof body.city==="string"&&body.city?body.city:
           typeof body.locality==="string"&&body.locality?body.locality:null;
         if(!place)throw Error("CITY_NOT_IDENTIFIED");
         // Save only the city's public geocoding centroid. Raw GPS is discarded.
         const searchUrl=new URL("https://geocoding-api.open-meteo.com/v1/search");
         searchUrl.searchParams.set("name",place);
         searchUrl.searchParams.set("count","5");
         searchUrl.searchParams.set("format","json");
         const cityResponse=await fetch(searchUrl.toString(),{credentials:"omit",cache:"no-store"});
         if(!cityResponse.ok)throw Error("CITY_TIMEZONE_UNAVAILABLE");
         const json=await cityResponse.json() as {results?:unknown};
         const rows=Array.isArray(json.results)?json.results:[];
         const candidates=rows.flatMap((item):Result[]=>{
           if(!item||typeof item!=="object")return [];
           const e=item as Record<string,unknown>;
           if(typeof e.name!=="string"||typeof e.country!=="string"||
             typeof e.latitude!=="number"||typeof e.longitude!=="number"||
             typeof e.timezone!=="string"||!validZone(e.timezone))return [];
           return [{name:e.name,country:e.country,latitude:e.latitude,
             longitude:e.longitude,timeZone:e.timezone}];
         });
         // If name search cannot identify a city unambiguously, allow manual selection.
         setResults(candidates);
         setMessage(candidates.length?
           "تم العثور على مدن محتملة. اختر مدينتك من النتائج لحفظ المنطقة الزمنية، دون إحداثيات GPS.":
           "لم نتمكن من مطابقة مدينتك. ابحث عنها بالاسم.");
       }catch{setMessage("تعذر تحديد المدينة تلقائيًا. ابحث عنها بالاسم.");}
     })();
   },()=>setMessage("لم تُمنح صلاحية الموقع أو تعذر تحديده؛ يمكنك البحث يدويًا."),{
     enableHighAccuracy:false,timeout:12000,maximumAge:60000,
   });
 };
 const selected=preferences.selectedCity;
 const save=async()=>{
   if(!selected||!onCommit||saving)return;
   setSaving(true);
   setMessage("");
   try{
     const success=await onCommit(selected);
     setMessage(success
       ?"تم تأكيد حفظ موقع الحساب ومنطقته الزمنية. تُعرض المواقيت الجديدة بعد استرجاعها من الخادم؛ لا تعتمد على المواقيت السابقة عند تعذّر الاتصال."
       :"تعذر اعتماد الموقع. ربما اختلف تاريخ اليوم بين المنطقتين أو تغيّر الحساب؛ حدّث الصفحة وتحقق من مواقيتك قبل إعادة المحاولة.");
   }catch{setMessage("تعذر اعتماد الموقع الآن. لا تعتبر المعاينة مواقيت صلاة معتمدة.");}
   finally{setSaving(false);}
 };
 return <section data-testid="noor-r232-location-settings" className="np-r232-control">
   <div className="np-cc-title"><div><h2>التوقيت والموقع</h2><p>اختيار المدينة ومعاينة توقيتها قبل اعتماد تغيير موقع الحساب؛ مواقيت الصلاة الحالية لا تتبدل بمعاينة ساعة أخرى.</p></div></div>
   <div className="np-r232-setting-grid">
    <label>المنطقة الزمنية المعتمدة للحسابات
     <input className="np-input" value={serverZone} readOnly aria-readonly="true"/>
    </label>
    <label>المنطقة الزمنية لمعاينة الساعة فقط
     <input aria-label="منطقة زمنية للعرض" className="np-input"
      type="text" list="np-r233-zones" value={zoneInput} maxLength={90}
      onChange={e=>setZoneInput(e.target.value)}
      onBlur={()=>commitZone(zoneInput)}
      placeholder="Asia/Riyadh"/>
     <datalist id="np-r233-zones">{suggestedZones.map(zone=>
       <option key={zone} value={zone}/>)}</datalist>
    </label>
    <div className="np-r238-zone-shortcuts" role="group" aria-label="اختيار سريع للمنطقة الزمنية">
      {suggestedZones.slice(0,8).map(zone=><button key={zone} type="button"
        className="np-cc-button" aria-pressed={previewZone===zone}
        onClick={()=>commitZone(zone)}>{zone.replaceAll("_"," ")}</button>)}
      <button className="np-cc-button" type="button"
        onClick={()=>commitZone("")}>استعادة توقيت الحساب</button>
    </div>
    <div className="np-r233-clock-preview" role="status"
      aria-label="معاينة الساعة في المنطقة الزمنية المختارة">
      <strong>{previewClock}</strong>
      <span dir="ltr">{previewZone}</span>
      <span>{previewDate}</span>
      <small>هذه معاينة لساعة العرض فقط؛ مواقيت الصلاة واليوم الشخصي لا يتغيران. اختيار المدينة لا يغير سجل العادات أو تاريخ المهام.</small>
    </div>
    <label>بداية الضحى بعد الشروق
     <select className="np-select" value={preferences.afterSunrise}
      onChange={e=>onChange({...preferences,afterSunrise:Number(e.target.value)})}>
      {[15,20,25,30].map(v=><option key={v} value={v}>{v} دقيقة</option>)}
     </select>
    </label>
    <label>نهاية الضحى قبل الظهر
     <select className="np-select" value={preferences.beforeDhuhr}
      onChange={e=>onChange({...preferences,beforeDhuhr:Number(e.target.value)})}>
      {[5,10,15,20].map(v=><option key={v} value={v}>{v} دقيقة</option>)}
     </select>
    </label>
    <label>أذان الجمعة في المسجد (24 ساعة)
     <input aria-label="موعد أذان الجمعة" className="np-input"
      type="time" value={preferences.fridayAdhan} onChange={e=>{
       const value=e.target.value;
       if(!value||r232ParseFridayClock(value)!==null)
        onChange({...preferences,fridayAdhan:value});
      }}/>
    </label>
   </div>
   <p className="np-r232-note">لا يفترض نور أن أذان الجمعة يساوي الظهر. موعد المسجد يُستخدم فقط في تقسيم الساعات الخمس.</p>
   <div className="np-r232-location-search">
    <label htmlFor="np-r232-city-search">البحث عن المدينة والمنطقة الزمنية</label>
    <div className="np-r232-search-row">
     <input id="np-r232-city-search" className="np-input" type="search" value={query}
      onChange={e=>{setQuery(e.target.value);lastSearch.current++;setResults([]);setSearching(false);}}
      onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void search();}}}
      placeholder="مثال: الرياض، القاهرة، جدة"/>
     <button className="np-cc-button" type="button" disabled={searching}
      onClick={()=>{void search();}}>{searching?"جارٍ البحث…":"بحث"}</button>
     <button className="np-cc-button" type="button" onClick={gps}
       title="يُرسل موقع الجهاز إلى خدمة خارجية لتحديد المدينة بعد موافقتك">تحديد عبر GPS</button>
    </div>
    <p className="np-r238-privacy">البحث يتم بخدمة Open-Meteo. عند استخدام GPS تُرسل الإحداثيات لخدمة BigDataCloud لتحديد المدينة فقط، ولا تُحفظ الإحداثيات الدقيقة في نور.</p>
    {results.length?<div className="np-r232-city-results" aria-label="نتائج البحث عن المدن">
      {results.map((city,i)=><button type="button" className="np-cc-button" key={i}
        onClick={()=>select(city)}>{city.name}، {city.country} — {city.timeZone}</button>)}
    </div>:null}
    {selected?<div className="np-r232-note">
      <p>المدينة المختارة: <strong>{selected.name}، {selected.country}</strong> ({selected.timeZone})</p>
      <div className="np-r232-search-row">
       <button type="button" className="np-cc-button" disabled={saving||!onCommit}
         onClick={()=>{void save();}}>{saving?"جارٍ اعتماد الموقع…":"اعتماد المدينة والتوقيت للحساب"}</button>
       <button type="button" className="np-cc-button" disabled={saving}
         onClick={()=>{onChange({...preferences,selectedCity:null,displayZone:null});setZoneInput("");}}>إلغاء الاختيار</button>
      </div>
      <small>الاعتماد ينقل المنطقة الزمنية ومواقيت الصلاة إلى حسابك على الأجهزة الأخرى. إذا اختلف التاريخ الميلادي الحالي بين المدينتين، يُرفض التغيير حمايةً لإنجازات الأيام السابقة.</small>
    </div>:null}
    {message?<p role="status" className="np-r232-note">{message}</p>:null}
   </div>
   <p className="np-r232-warning"><strong>تنبيه:</strong> البحث والمعاينة مؤقتان؛ لا تتغير مواقيت الصلاة حتى تضغط «اعتماد المدينة والتوقيت للحساب» ويؤكد الخادم الحفظ. تغييرات المنطقة الزمنية التي تسبب اختلاف تاريخ اليوم الحالي تُرفض بأمان دون تعديل الإنجازات. اختيار منطقة زمنية يدويًا دون مدينة يظل معاينة فقط.</p>
 </section>;
}
