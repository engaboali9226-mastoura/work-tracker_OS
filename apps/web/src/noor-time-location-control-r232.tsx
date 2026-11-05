import {useRef,useState,type ReactElement} from "react";
import {r232ParseFridayClock} from "./noor-islamic-daylight-r232.js";
import {type NoorR232City,type NoorR232Preferences} from "./noor-time-display-preferences-r232.js";
type Result=Readonly<{name:string;country:string;latitude:number;longitude:number;timeZone:string}>;
function validZone(zone:string):boolean{
 try{new Intl.DateTimeFormat("en-US",{timeZone:zone});return true;}catch{return false;}
}
export function NoorR232ControlLocation({serverZone,preferences,onChange}:{
 serverZone:string;preferences:NoorR232Preferences;
 onChange:(p:NoorR232Preferences)=>void;
}):ReactElement{
 const [query,setQuery]=useState("");
 const [results,setResults]=useState<readonly Result[]>([]);
 const [searching,setSearching]=useState(false);
 const [message,setMessage]=useState("");
 const lastSearch=useRef(0);
 const select=(city:NoorR232City)=>{
   onChange({...preferences,selectedCity:city});
   setResults([]);
   setMessage("تم حفظ المدينة للعرض. مواقيت نور الأساسية لن تتغير حتى تحديث سياسة الموقع على الخادم.");
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
 return <section data-testid="noor-r232-location-settings" className="np-r232-control">
   <div className="np-cc-title"><div><h2>التوقيت والموقع</h2><p>تخصيص العرض والعد التنازلي، مع الحفاظ على مواقيت نور المعتمدة.</p></div></div>
   <div className="np-r232-setting-grid">
    <label>المنطقة الزمنية المعتمدة للحسابات
     <input className="np-input" value={serverZone} readOnly aria-readonly="true"/>
    </label>
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
      onChange={e=>setQuery(e.target.value)} placeholder="مثال: الرياض، القاهرة، جدة"/>
     <button className="np-cc-button" type="button" disabled={searching}
      onClick={()=>{void search();}}>{searching?"جارٍ البحث…":"بحث"}</button>
     <button className="np-cc-button" type="button" onClick={gps}>GPS</button>
    </div>
    {results.length?<div className="np-r232-city-results" aria-label="نتائج البحث عن المدن">
      {results.map((city,i)=><button type="button" className="np-cc-button" key={i}
        onClick={()=>select(city)}>{city.name}، {city.country} — {city.timeZone}</button>)}
    </div>:null}
    {selected?<p className="np-r232-note">مدينة العرض المختارة: <strong>{selected.name}، {selected.country}</strong> ({selected.timeZone})
      <button type="button" className="np-cc-button" onClick={()=>onChange({...preferences,selectedCity:null})}>إلغاء اختيار المدينة</button>
    </p>:null}
    {message?<p role="status" className="np-r232-note">{message}</p>:null}
   </div>
   <p className="np-r232-warning"><strong>تنبيه مهم:</strong> تغيير المدينة في هذه المرحلة خاص بالعرض وحفظ تفضيلها على هذا الجهاز، ولا يغيّر موقع الحساب ولا مواقيت الصلاة المحسوبة على الخادم. لن نعرض أوقات صلاة لمدينة جديدة على أنها معتمدة قبل تفعيل الربط الآمن.</p>
 </section>;
}
