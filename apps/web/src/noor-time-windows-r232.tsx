import type {ReactElement} from "react";
import {r232Countdown,r232DailyWindows,r232FridayFiveHours,r232LocalWeekday,r232FastingCountdownEnabled,
 type R232Window} from "./noor-islamic-daylight-r232.js";
import type {NoorR232Preferences} from "./noor-time-display-preferences-r232.js";

type Prayer=Readonly<{key:string;at:string}>;
function clock(ms:number,zone:string):string{
 return new Intl.DateTimeFormat("ar-SA-u-nu-latn",
 {hour:"numeric",minute:"2-digit",hour12:true,timeZone:zone}).format(new Date(ms));
}
function duration(ms:number):string{
 const minutes=Math.round(ms/60000);
 return `${Math.floor(minutes/60)} س ${minutes%60} د`;
}
function remaining(ms:number):string{
 const seconds=Math.max(0,Math.ceil(ms/1000));
 const hour=Math.floor(seconds/3600),min=Math.floor(seconds%3600/60),sec=seconds%60;
 return [hour,min,sec].map(n=>String(n).padStart(2,"0")).join(":");
}
function WindowCard({title,window:interval,nowMs,timeZone,unavailable,showTimer=true}:{
 title:string;window:R232Window|null;nowMs:number;timeZone:string;unavailable:string;
 showTimer?:boolean;
}):ReactElement{
 if(!interval)return <article className="np-r232-window">
  <h3>{title}</h3><p className="np-r232-help">{unavailable}</p>
 </article>;
 const state=r232Countdown(interval,nowMs);
 return <article className="np-r232-window" data-phase={state.phase}>
  <h3>{title}</h3>
  <p className="np-r232-time">{clock(interval.startMs,timeZone)} — {clock(interval.endMs,timeZone)}</p>
  <p className="np-r232-help">المدة: {duration(interval.durationMs)}</p>
  {showTimer?<strong className="np-r232-counter" aria-label={state.phase==="finished"?"انتهت الفترة":"العد التنازلي"}>
   {state.phase==="finished"?"انتهى":state.phase==="upcoming"
    ?`تبدأ بعد ${remaining(interval.startMs-nowMs)}`
    :`المتبقي ${remaining(interval.endMs-nowMs)}`}
  </strong>:<p className="np-r232-help" data-testid="fasting-timer-disabled-r232">العداد متوقف حسب اختيارك خارج رمضان.</p>}
  {showTimer?<div className="np-r232-progress" role="progressbar" aria-label={title}
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress)}>
   <span style={{width:`${state.progress}%`}}/>
  </div>:null}
 </article>;
}
export function NoorR232TimeWindows({prayers,nowMs,timeZone,preferences,nextFajrAt,onPreferencesChange}:{
 prayers:readonly Prayer[];nowMs:number;timeZone:string;
 preferences:NoorR232Preferences;nextFajrAt?:string|undefined;
 onPreferencesChange?:(value:NoorR232Preferences)=>void;
}):ReactElement {
 const windows=r232DailyWindows(prayers,nextFajrAt,
   preferences.afterSunrise,preferences.beforeDhuhr);
 const fasting=r232FastingCountdownEnabled({
   fastingStartMs:windows.fastingDay?.startMs??NaN,timeZone,
   outsideRamadanEnabled:preferences.fastingTimerOutsideRamadan,
 });
 const friday=r232LocalWeekday(nowMs,timeZone)===5;
 const fridayHours=friday && preferences.fridayAdhan?r232FridayFiveHours({
   nowMs,timeZone,prayers,fridayAdhanClock:preferences.fridayAdhan,
   sunriseOffsetMinutes:preferences.afterSunrise,
 }):null;
 return <section className="np-card np-r232-section" data-testid="noor-day-night-friday-r232"
   aria-label="ساعات النهار والليل والضحى والجمعة">
   <div className="np-r232-heading">
    <h2>ساعات النهار والليل</h2>
    <p>توقيتات شرعية محسوبة من مواقيت الصلاة المعتمدة في نور.</p>
   </div>
   <div className="np-r232-grid">
    <div className="np-r232-fasting-wrapper" data-testid="fasting-timer-control-r232">
      <div className="np-r232-fasting-options">
        <span>{fasting.ramadan?"رمضان: المؤقت يعمل تلقائيًا":"مؤقت الصيام خارج رمضان"}</span>
        <button type="button" className="np-cc-button"
          disabled={fasting.ramadan||!onPreferencesChange}
          aria-pressed={fasting.enabled}
          onClick={()=>onPreferencesChange?.({...preferences,
            fastingTimerOutsideRamadan:!preferences.fastingTimerOutsideRamadan})}>
          {fasting.ramadan?"مفعّل تلقائيًا":fasting.enabled?"إيقاف المؤقت":"تشغيل المؤقت"}
        </button>
      </div>
      <WindowCard title="ساعات النهار (الصيام)" window={windows.fastingDay}
        nowMs={nowMs} timeZone={timeZone} showTimer={fasting.enabled}
        unavailable="لا توجد مواقيت فجر ومغرب مؤكدة لهذا اليوم."/>
    </div>
    <WindowCard title="ساعات الليل الشرعي" window={windows.islamicNight}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="يلزم وقت الفجر المؤكد لليوم التالي؛ لا نستخدم فجر اليوم كتقدير."/>
    <WindowCard title="وقت صلاة الضحى" window={windows.duha}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="يلزم موعد الشروق والظهر المؤكد."/>
   </div>
   <p className="np-r232-note">بداية الضحى تقديرية بعد الشروق بـ{preferences.afterSunrise} دقيقة، والنهاية قبل الظهر بـ{preferences.beforeDhuhr} دقائق. يمكن تغيير الهامش من مركز التحكم.</p>
   {friday?<div className="np-r232-friday" data-testid="friday-five-hours-r232">
    <h3>ساعات الجمعة الخمس</h3>
    <p className="np-r232-note">من ارتفاع الشمس إلى أذان الجمعة المحدد لمسجدك، موزعة على خمس فترات متساوية.</p>
    {fridayHours?<div className="np-r232-five-grid">
     {fridayHours.map(hour=><WindowCard key={hour.number}
       title={`الساعة ${["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][hour.number-1]}`}
       window={hour} nowMs={nowMs} timeZone={timeZone} unavailable="—"/>)}
    </div>:<p role="status" className="np-r232-help">
     اضبط موعد أذان الجمعة من مركز التحكم لعرض الفترات ومؤقت كل ساعة.
    </p>}
   </div>:null}
  </section>;
}
