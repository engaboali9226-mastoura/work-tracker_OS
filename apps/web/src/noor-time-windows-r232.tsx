import type {ReactElement} from "react";
import {r232Countdown,r232DailyWindows,r283FridayHoursAtDhuhr,r283CarriedNightWindow,r232LocalWeekday,r232FastingCountdownEnabled,
 type R232Window,type R283PrecedingNight} from "./noor-islamic-daylight-r232.js";
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
 const icon=tone==="day"?"☀":tone==="night"?"☾":tone==="duha"?"☀":"◷";
 const subtitle=tone==="day"?"من الفجر للمغرب":tone==="duha"?"بعد الشروق":tone==="night"?"من المغرب إلى الفجر":"حتى أذان الجمعة";
 const shortTitle=tone==="day"?"النهار":tone==="night"?"الليل":tone==="duha"?"الضحى":title;
 if(!interval)return <article className={`np-r232-window np-r234-window tone-${tone}`} data-phase="unavailable">
  <div className="np-r234-card-title"><span className="np-r234-symbol" aria-hidden="true">{icon}</span><h3 aria-label={title}>{shortTitle}</h3></div><p className="np-r248-subtitle">{subtitle}</p>
  <p className="np-r232-help">{unavailable}</p>
 </article>;
 const state=r232Countdown(interval,nowMs);
 return <article className={`np-r232-window np-r234-window tone-${tone}`} data-phase={state.phase}>
  <div className="np-r234-card-title">
    <span className="np-r234-symbol" aria-hidden="true">{icon}</span>
    <h3 aria-label={title}>{shortTitle}</h3>
    <span className="np-r234-state">{state.phase==="active"?"جارٍ الآن":state.phase==="finished"?"انتهت":"لم تبدأ بعد"}</span>
  </div>
  <p className="np-r248-subtitle">{subtitle}</p>
  <div className="np-r234-times" dir="rtl">
    <span className="np-r234-time-point"><small>من</small><strong>{clock(interval.startMs,timeZone)}</strong></span>
    <span className="np-r234-time-line" aria-hidden="true"/>
    <span className="np-r234-time-point"><small>إلى</small><strong>{clock(interval.endMs,timeZone)}</strong></span>
  </div>
  <div className="np-r234-card-bottom">
    <span className="np-r234-duration">المدة {duration(interval.durationMs)}</span>
    {showTimer?<div className="np-r247-timer" role={state.phase==="active"?"timer":"status"} aria-label={state.phase==="finished"?"انتهت الفترة":state.phase==="upcoming"?"لم تبدأ بعد":"الوقت المتبقي"}>
       {state.phase==="active"?<>
         <span className="np-r247-timer-caption">متبقٍ</span>
         <strong className="np-r232-counter np-r234-counter np-r247-digits" dir="ltr">{remaining(interval.endMs-nowMs)}</strong>
       </>:<span className={state.phase==="finished"?"np-r247-finished":"np-r247-inactive"}>{state.phase==="finished"?"انتهت":"لم تبدأ بعد"}</span>}
     </div>:<span className="np-r234-muted np-r247-inactive" data-testid="fasting-timer-disabled-r232">مؤقت الصيام متوقف</span>}
  </div>
  {showTimer?<div className="np-r232-progress np-r234-progress" role="progressbar"
    aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress)}>
    <span style={{width:`${state.progress}%`}}/>
  </div>:null}
 </article>;
}

export function NoorR232TimeWindows({prayers,nowMs,timeZone,preferences,nextFajrAt,precedingNight,onPreferencesChange}:{
 prayers:readonly Prayer[];nowMs:number;timeZone:string;
 preferences:NoorR232Preferences;nextFajrAt?:string|undefined;
 precedingNight?:R283PrecedingNight|null;
 onPreferencesChange?:(value:NoorR232Preferences)=>void;
}):ReactElement {
 const windows=r232DailyWindows(prayers,nextFajrAt,
   preferences.afterSunrise,preferences.beforeDhuhr);
 const activeNight=r283CarriedNightWindow(nowMs,precedingNight);
 const fasting=r232FastingCountdownEnabled({
   fastingStartMs:windows.fastingDay?.startMs??NaN,timeZone,
   outsideRamadanEnabled:preferences.fastingTimerOutsideRamadan,
 });
 const friday=r232LocalWeekday(nowMs,timeZone)===5;
 const fridayHours=friday?r283FridayHoursAtDhuhr({
   nowMs,timeZone,prayers,sunriseOffsetMinutes:preferences.afterSunrise,
  }):null;
 return <section className="np-card np-r232-section np-r246-rhythm-card np-r247-rhythm-card np-r248-reference-card" data-rhythm-layout="three-visible-columns-r246" data-reference-design="preview-r248" data-rhythm-visual="digital-contrast-r247" data-testid="noor-day-night-friday-r232"
   aria-label="ساعات النهار والليل والضحى والجمعة">
   <div className="np-r232-heading">
    <div className="np-r234-heading-label"><span className="np-r234-orbit" aria-hidden="true">◐</span><div><h2>إيقاع اليوم</h2><p>الضحى، النهار، الليل وفق مواقيت نور المعتمدة</p></div></div>
    <span className="np-r234-basis">من مواقيت الصلاة المعتمدة</span>
   </div>
   <div className="np-r232-grid np-r234-grid np-r235-unified-rows np-r237-horizontal-strip np-r238-time-order np-r246-three-up np-r247-rhythm-strip np-r248-reference-strip" role="group" aria-label="الضحى والنهار والليل وساعات الجمعة في صف واحد">
    <WindowCard title="وقت صلاة الضحى" tone="duha" window={windows.duha}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="يلزم موعد الشروق والظهر المؤكد."/>
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
        nowMs={nowMs} timeZone={timeZone} showTimer={true}
        unavailable="لا توجد مواقيت فجر ومغرب مؤكدة لهذا اليوم."/>
    </div>
    <WindowCard title="ساعات الليل الشرعي" tone="night" window={activeNight??windows.islamicNight}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="لم تتوفر مواقيت الغد من مصدر نور المعتمد."/>
   <p className="np-r232-note np-r237-detail-note">بداية الضحى تقديرية بعد الشروق بـ{preferences.afterSunrise} دقيقة، والنهاية قبل الظهر بـ{preferences.beforeDhuhr} دقائق. يمكن تغيير الهامش من مركز التحكم.</p>
   {friday?<div className="np-r232-friday np-r235-friday-inline np-r237-friday-inline" data-testid="friday-five-hours-r232">
    <h3>ساعات الجمعة الخمس</h3>
    <p className="np-r232-note">من ارتفاع الشمس إلى موعد الظهر المعتمد يوم الجمعة، موزعة على خمس فترات متساوية.</p>
    {fridayHours?<div className="np-r232-five-grid np-r235-five-rows np-r237-friday-hours">
     {fridayHours.map(hour=><WindowCard key={hour.number}
       title={`الساعة ${["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][hour.number-1]}`}
       tone="friday"
       window={hour} nowMs={nowMs} timeZone={timeZone} unavailable="—"/>)}
    </div>:<p role="status" className="np-r232-help">
     يلزم توفر وقت الشروق والظهر المعتمدين ليوم الجمعة من نور.
    </p>}
   </div>:null}
   </div>
  </section>;
}
