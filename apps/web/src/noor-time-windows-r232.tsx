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
function WindowCard({title,window:interval,nowMs,timeZone,unavailable,showTimer=true,tone="day"}:{
 title:string;window:R232Window|null;nowMs:number;timeZone:string;unavailable:string;
 showTimer?:boolean;tone?:"day"|"night"|"duha"|"friday";
}):ReactElement{
 const icon=tone==="day"?"☀":tone==="night"?"☾":tone==="duha"?"✦":"◷";
 if(!interval)return <article className={`np-r232-window np-r234-window tone-${tone}`} data-phase="unavailable">
  <div className="np-r234-card-title"><span className="np-r234-symbol" aria-hidden="true">{icon}</span><h3 aria-label={title}>{tone==="day"?"النهار":tone==="duha"?"الضحى":tone==="night"?"الليل":title}</h3></div>
  <p className="np-r232-help">{unavailable}</p>
 </article>;
 const state=r232Countdown(interval,nowMs);
 return <article className={`np-r232-window np-r234-window tone-${tone}`} data-phase={state.phase}>
  <div className="np-r234-card-title">
    <span className="np-r234-symbol" aria-hidden="true">{icon}</span>
    <h3 aria-label={title}>{tone==="day"?"النهار":tone==="duha"?"الضحى":tone==="night"?"الليل":title}</h3>
    <span className="np-r234-state">{state.phase==="active"?"جارٍ الآن":state.phase==="finished"?"انتهت":"قادمة"}</span>
  </div>
  <div className="np-r234-times" dir="rtl">
    <span className="np-r234-time-point"><small>من</small><strong>{clock(interval.startMs,timeZone)}</strong></span>
    <span className="np-r234-time-line" aria-hidden="true"/>
    <span className="np-r234-time-point"><small>إلى</small><strong>{clock(interval.endMs,timeZone)}</strong></span>
  </div>
  <div className="np-r234-card-bottom">
    <span className="np-r234-duration">المدة {duration(interval.durationMs)}</span>
    {showTimer?<strong className="np-r232-counter np-r234-counter" aria-label={state.phase==="finished"?"انتهت الفترة":"العد التنازلي"}>
      {state.phase==="finished"?"انتهت":state.phase==="upcoming"
       ?`تبدأ بعد ${remaining(interval.startMs-nowMs)}`
       :`المتبقي ${remaining(interval.endMs-nowMs)}`}
    </strong>:<span className="np-r234-muted" data-testid="fasting-timer-disabled-r232">المؤقت متوقف</span>}
  </div>
  {showTimer?<div className="np-r232-progress np-r234-progress" role="progressbar"
    aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress)}>
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
 return <section className="np-card np-r232-section np-r246-rhythm-card" data-rhythm-layout="three-visible-columns-r246" data-testid="noor-day-night-friday-r232"
   aria-label="ساعات النهار والليل والضحى والجمعة">
   <div className="np-r232-heading">
    <div className="np-r234-heading-label"><span className="np-r234-orbit" aria-hidden="true">◐</span><div><h2>إيقاع اليوم</h2><p>النهار والليل والضحى، وفق مواقيت نور المعتمدة</p></div></div>
    <span className="np-r234-basis">من مواقيت الصلاة المعتمدة</span>
   </div>
   <div className="np-r232-grid np-r234-grid np-r235-unified-rows np-r237-horizontal-strip np-r238-time-order np-r246-three-up" role="group" aria-label="النهار والضحى والليل وساعات الجمعة في صف واحد">
    <div className="np-r232-fasting-wrapper" data-testid="fasting-timer-control-r232">
      <div className="np-r232-fasting-options np-r234-fasting-options">
        <span>{fasting.ramadan?"رمضان: المؤقت يعمل تلقائيًا":"مؤقت الصيام خارج رمضان"}</span>
        <button type="button" className="np-cc-button"
          disabled={fasting.ramadan||!onPreferencesChange}
          aria-pressed={fasting.enabled}
          aria-label={fasting.ramadan?"مؤقت الصيام يعمل تلقائيًا":fasting.enabled?"إيقاف مؤقت الصيام":"تشغيل مؤقت الصيام"}
          title={fasting.ramadan?"رمضان: يعمل المؤقت تلقائيًا":fasting.enabled?"إيقاف مؤقت الصيام":"تشغيل مؤقت الصيام"}
          onClick={()=>onPreferencesChange?.({...preferences,
            fastingTimerOutsideRamadan:!preferences.fastingTimerOutsideRamadan})}>
          <span className="np-r246-fasting-symbol" aria-hidden="true">◷</span>
          <span className="np-r246-fasting-label">{fasting.ramadan?"مفعّل تلقائيًا":fasting.enabled?"إيقاف المؤقت":"تشغيل المؤقت"}</span>
        </button>
      </div>
      <WindowCard title="ساعات النهار" tone="day" window={windows.fastingDay}
        nowMs={nowMs} timeZone={timeZone} showTimer={fasting.enabled}
        unavailable="لا توجد مواقيت فجر ومغرب مؤكدة لهذا اليوم."/>
    </div>
    <WindowCard title="وقت صلاة الضحى" tone="duha" window={windows.duha}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="يلزم موعد الشروق والظهر المؤكد."/>
    <WindowCard title="ساعات الليل الشرعي" tone="night" window={windows.islamicNight}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="لم تتوفر مواقيت الغد من مصدر نور المعتمد."/>
   <p className="np-r232-note np-r237-detail-note">بداية الضحى تقديرية بعد الشروق بـ{preferences.afterSunrise} دقيقة، والنهاية قبل الظهر بـ{preferences.beforeDhuhr} دقائق. يمكن تغيير الهامش من مركز التحكم.</p>
   {friday?<div className="np-r232-friday np-r235-friday-inline np-r237-friday-inline" data-testid="friday-five-hours-r232">
    <h3>ساعات الجمعة الخمس</h3>
    <p className="np-r232-note">من ارتفاع الشمس إلى أذان الجمعة المحدد لمسجدك، موزعة على خمس فترات متساوية.</p>
    {fridayHours?<div className="np-r232-five-grid np-r235-five-rows np-r237-friday-hours">
     {fridayHours.map(hour=><WindowCard key={hour.number}
       title={`الساعة ${["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][hour.number-1]}`}
       tone="friday"
       window={hour} nowMs={nowMs} timeZone={timeZone} unavailable="—"/>)}
    </div>:<p role="status" className="np-r232-help">
     اضبط موعد أذان الجمعة من مركز التحكم لعرض الفترات ومؤقت كل ساعة.
    </p>}
   </div>:null}
   </div>
  </section>;
}
