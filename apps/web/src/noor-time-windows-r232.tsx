import {useEffect,useState,type ReactElement} from "react";
import {r232Countdown,r232DailyWindows,r283FridayHoursAtDhuhr,r283CarriedNightWindow,r232FastingCountdownEnabled,
 type R232Window,type R283PrecedingNight} from "./noor-islamic-daylight-r232.js";
import type {NoorR232Preferences} from "./noor-time-display-preferences-r232.js";
import {fridayVirtueR284,NOOR_FRIDAY_VIRTUES_SOURCE_R284} from "./noor-friday-virtues-r284.js";
import {noorFridayPresentationR310} from "./noor-friday-visibility-r310.js";

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
function WindowCard({title,window:interval,nowMs,timeZone,unavailable,showTimer=true,tone="day",nightCarry=false,fridayHour,fridaySelected=false,fridaySelectionBusy=false,onSelectFridayHour}:{
 title:string;window:R232Window|null;nowMs:number;timeZone:string;unavailable:string;
 showTimer?:boolean;tone?:"day"|"night"|"duha"|"friday";nightCarry?:boolean;fridayHour?:1|2|3|4|5;
 fridaySelected?:boolean;fridaySelectionBusy?:boolean;onSelectFridayHour?:(hour:1|2|3|4|5)=>void;
}):ReactElement{
 const icon=tone==="day"?"☀":tone==="night"?"☾":tone==="duha"?"☀":"◷";
 const subtitle=tone==="day"?"من الفجر للمغرب":tone==="duha"?"بعد الشروق":tone==="night"?(nightCarry?"حتى فجر اليوم":"حتى فجر الغد"):"حتى أذان الجمعة";
 const shortTitle=tone==="day"?"النهار":tone==="night"?"الليل":tone==="duha"?"الضحى":title.replace(/^الساعة\s+/u,"");
 const fridayVirtue=fridayHour===undefined?null:fridayVirtueR284(fridayHour);
 if(!interval)return <article className={`np-r232-window np-r234-window tone-${tone}`} data-phase="unavailable">
  <div className="np-r234-card-title"><span className="np-r234-symbol" aria-hidden="true">{icon}</span><h3 aria-label={title}>{shortTitle}</h3></div><p className="np-r248-subtitle">{subtitle}</p>
  <p className="np-r232-help">{unavailable}</p>
 </article>;
 const state=r232Countdown(interval,nowMs);
 return <article className={`np-r232-window np-r234-window tone-${tone}${fridaySelected?" np-r311-visited":""}`} data-phase={state.phase} data-friday-selected={fridayHour===undefined?undefined:fridaySelected}>
  <div className="np-r234-card-title">
    <span className="np-r234-symbol" aria-hidden="true">{icon}</span>
    <h3 aria-label={title}>{shortTitle}</h3>
    {fridayVirtue?<p className="np-r284-friday-virtue" data-testid={`friday-virtue-${fridayHour}`}><span aria-hidden="true">{fridayVirtue.icon}</span><span>{fridayVirtue.description}</span></p>:null}
    <span className="np-r234-state">{state.phase==="active"?"جارٍ الآن":state.phase==="finished"?"انتهت":"لم تبدأ بعد"}</span>
  </div>
  <p className="np-r248-subtitle">{subtitle}</p>
  <div className="np-r234-times" dir="rtl">
    <span className="np-r234-time-point"><small>من</small><strong>{clock(interval.startMs,timeZone)}</strong></span>
    <span className="np-r234-time-line" aria-hidden="true"/>
    <span className="np-r234-time-point"><small>إلى</small><strong>{clock(interval.endMs,timeZone)}</strong></span>
  </div>
  <div className="np-r234-card-bottom">
    <span className="np-r234-duration" data-testid={tone==="day"?"r288-day-total-hours":tone==="night"?"r288-night-total-hours":undefined}>{tone==="day"?"ساعات النهار":tone==="night"?"ساعات الليل":"المدة"}: {duration(interval.durationMs)}</span>
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
  {fridayHour!==undefined&&onSelectFridayHour?
    <button type="button" className="np-r311-friday-select" data-testid={`r311-select-friday-${fridayHour}`}
      aria-label={fridaySelected?`إلغاء تسجيل الوصول إلى المسجد خلال ${title}`:`تسجيل الوصول إلى المسجد خلال ${title}`}
      aria-pressed={fridaySelected} disabled={fridaySelectionBusy}
      onClick={()=>onSelectFridayHour(fridayHour)}/>:null}
  {fridaySelected?<span aria-hidden="true" className="np-r311-selected-mark">✓</span>:null}
 </article>;
}

export function NoorR232TimeWindows({prayers,nowMs,timeZone,preferences,nextFajrAt,precedingNight,onPreferencesChange,selectedFridayHour=null,onSelectFridayHour,fridaySelectionBusy=false}:{
 prayers:readonly Prayer[];nowMs:number;timeZone:string;
 preferences:NoorR232Preferences;nextFajrAt?:string|undefined;
 precedingNight?:R283PrecedingNight|null;
 onPreferencesChange?:(value:NoorR232Preferences)=>void;
 selectedFridayHour?:1|2|3|4|5|null;
 onSelectFridayHour?:(hour:1|2|3|4|5)=>void;
 fridaySelectionBusy?:boolean;
}):ReactElement {
 const [detailsOpen,setDetailsOpen]=useState(false);
 useEffect(()=>{if(!detailsOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setDetailsOpen(false);};document.addEventListener("keydown",onKey);return ()=>document.removeEventListener("keydown",onKey);},[detailsOpen]);
 const windows=r232DailyWindows(prayers,nextFajrAt,
   preferences.afterSunrise,preferences.beforeDhuhr);
 const activeNight=r283CarriedNightWindow(nowMs,precedingNight);
 const fasting=r232FastingCountdownEnabled({
   fastingStartMs:windows.fastingDay?.startMs??NaN,timeZone,
   outsideRamadanEnabled:preferences.fastingTimerOutsideRamadan,
 });
 const fridayMode=noorFridayPresentationR310(nowMs,timeZone,prayers);
 const friday=fridayMode==="friday";
 const thursdayReminder=fridayMode==="thursday-reminder";
 const fridayHours=friday?r283FridayHoursAtDhuhr({
   nowMs,timeZone,prayers,sunriseOffsetMinutes:preferences.afterSunrise,
  }):null;
 const trustedNight=activeNight??windows.islamicNight;
 const nightCountdown=trustedNight?r232Countdown(trustedNight,nowMs):null;
 const nextFajrMs=nextFajrAt?Date.parse(nextFajrAt):NaN;
 // Count to a server-authenticated Fajr only. A missing previous Maghrib
 // never becomes a fabricated "night duration" or a shifted civil date.
 const earlyLocalHour=Number(new Intl.DateTimeFormat("en-GB",{hour:"2-digit",hourCycle:"h23",timeZone}).format(new Date(nowMs)));
 const fallbackToFajr=nightCountdown?.phase!=="active"
   &&Number.isFinite(nextFajrMs)&&nextFajrMs>nowMs&&nextFajrMs-nowMs<=12*3600000&&earlyLocalHour<7;
 const nightPreview=nightCountdown?.phase==="active"||fallbackToFajr;
 const todayDay=windows.fastingDay?r232Countdown(windows.fastingDay,nowMs):null;
 const dayPreview=!nightPreview&&todayDay?.phase==="active";
 const currentTitle=nightPreview?"الليل":dayPreview?"النهار":"إيقاع اليوم";
 const currentEnd=nightPreview?(nightCountdown?.phase==="active"?trustedNight!.endMs:nextFajrMs):dayPreview?windows.fastingDay!.endMs:NaN;
 const currentTimer=Number.isFinite(currentEnd)&&currentEnd>nowMs?remaining(currentEnd-nowMs):null;
 const currentWindow=nightPreview&&nightCountdown?.phase==="active"?trustedNight:dayPreview?windows.fastingDay:null;
 const currentFridayHour=fridayHours?.find(h=>r232Countdown(h,nowMs).phase==="active")??null;
 const previewLabel=(n:number)=>["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][n-1]??String(n);
 return <>
 <section className="np-card np-r322-timer-hub" data-testid="r322-premium-timer-hub" dir="rtl" aria-label="إيقاع اليوم والمؤقت النشط">
   <div className="np-r322-timer-head"><span className="np-r322-timer-icon" aria-hidden="true">◐</span>
     <div><h2>إيقاع اليوم</h2><p>المؤقت النشط من مواقيت نور المعتمدة</p></div>
   </div>
   <button type="button" className={"np-r322-timer-feature "+(nightPreview?"is-night":"is-day")}
     onClick={()=>setDetailsOpen(true)} aria-haspopup="dialog" aria-expanded={detailsOpen}
     data-testid="r322-open-time-windows">
    <span className="np-r322-active-title">{nightPreview?"☾":dayPreview?"☀":"◷"} مؤقت {currentTitle}</span>
    {currentTimer?<strong className="np-r322-main-countdown" dir="ltr" role="timer">{currentTimer}</strong>
     :<span className="np-r322-time-unavailable">لا توجد فترة نشطة الآن</span>}
    <span className="np-r322-feature-subtitle">{currentTimer?"متبقٍ حتى نهاية الفترة":"اضغط لعرض مواقيت اليوم"}</span>
    {currentWindow?<span className="np-r322-range">من {clock(currentWindow.startMs,timeZone)} إلى {clock(currentWindow.endMs,timeZone)} · المدة {duration(currentWindow.durationMs)}</span>
     :fallbackToFajr?<span className="np-r322-range">حتى الفجر المؤكد · لم تتوفر بداية الليل لحساب مدته</span>:null}
    <span className="np-r322-expand">عرض إيقاع اليوم كاملًا ←</span>
   </button>
   {friday?<button type="button" className="np-r322-friday-preview" onClick={()=>setDetailsOpen(true)} aria-haspopup="dialog">
     <span>ساعات الجمعة الخمس</span>
     <strong>{currentFridayHour?"الساعة "+previewLabel(currentFridayHour.number):"عرض ساعات الجمعة"}</strong>
     <span dir="ltr">{currentFridayHour?remaining(currentFridayHour.endMs-nowMs):"التفاصيل ←"}</span>
   </button>:thursdayReminder?<button className="np-r322-friday-preview" type="button" onClick={()=>setDetailsOpen(true)}>غدًا الجمعة · عرض ساعات التبكير ←</button>:null}
 </section>
 <div className="np-r322-modal" data-open={detailsOpen} role="presentation" aria-hidden={!detailsOpen} onMouseDown={event=>{if(event.target===event.currentTarget)setDetailsOpen(false);}}>
  <div role="dialog" aria-modal={detailsOpen} aria-label="إيقاع اليوم الكامل وساعات الجمعة" className="np-r322-sheet" dir="rtl">
   <header className="np-r322-sheet-head"><div><h2>إيقاع اليوم الكامل</h2><p>كل المواقيت والتفاصيل كما حُسبت من مصدر نور</p></div>
   <button type="button" onClick={()=>setDetailsOpen(false)} aria-label="إغلاق مؤقتات اليوم">✕</button></header>
 <section className="np-card np-r232-section np-r246-rhythm-card np-r247-rhythm-card np-r248-reference-card" data-rhythm-layout="three-visible-columns-r246" data-reference-design="preview-r248" data-rhythm-visual="digital-contrast-r247" data-testid="noor-day-night-friday-r232"
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
    <WindowCard title="ساعات الليل الشرعي" tone="night" window={activeNight??windows.islamicNight} nightCarry={activeNight!==null}
      nowMs={nowMs} timeZone={timeZone}
      unavailable="لم تتوفر مواقيت الغد من مصدر نور المعتمد."/>
   <p className="np-r232-note np-r237-detail-note">بداية الضحى تقديرية بعد الشروق بـ{preferences.afterSunrise} دقيقة، والنهاية قبل الظهر بـ{preferences.beforeDhuhr} دقائق. يمكن تغيير الهامش من مركز التحكم.</p>
   {friday||thursdayReminder?<div className="np-r232-friday np-r235-friday-inline np-r237-friday-inline" data-friday-mode={fridayMode} data-testid="friday-five-hours-r232">
    <h3>ساعات الجمعة الخمس</h3>
    <p className="np-r232-note">من ارتفاع الشمس إلى موعد الظهر المعتمد يوم الجمعة، موزعة على خمس فترات متساوية. فضائل التبكير بالترتيب الوارد في الحديث، وليست حسابًا رقميًا للأجر.</p>
    {thursdayReminder?<p className="np-r310-friday-caption" role="status">تذكير: غدًا الجمعة · استعد للتبكير</p>:null}
    {thursdayReminder?<>
      <div className="np-r232-five-grid np-r235-five-rows np-r237-friday-hours" role="group" aria-label="تذكير بساعات الجمعة الخمس">
        {([1,2,3,4,5] as const).map(number=>{
          const virtue=fridayVirtueR284(number);
          const hourLabel=["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][number-1]!;
          return <article key={number} className="np-r232-window np-r234-window tone-friday" data-phase="upcoming">
            <div className="np-r234-card-title">
              <h3 aria-label={`الساعة ${hourLabel}`}>{hourLabel}</h3>
              <p className="np-r284-friday-virtue" data-testid={`friday-virtue-${number}`}><span aria-hidden="true">{virtue.icon}</span><span>{virtue.description}</span></p>
            </div>
            <div className="np-r234-card-bottom"><div className="np-r247-timer" role="status" aria-label="تذكير ليوم الجمعة"><span className="np-r247-inactive">غدًا</span></div></div>
          </article>;
        })}
      </div>
      <details className="np-r308-friday-details" data-testid="r308-friday-details">
        <summary>فضائل ساعات الجمعة</summary>
        <ol>
          {([1,2,3,4,5] as const).map(number=>{
            const virtue=fridayVirtueR284(number);
            return <li key={number}><strong>الساعة {["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][number-1]}</strong><span>{virtue.icon} {virtue.description}</span></li>;
          })}
        </ol>
      </details>
    </>:fridayHours?<>
    <div className="np-r232-five-grid np-r235-five-rows np-r237-friday-hours" role="group" aria-label="الساعات الخمس مرتبة، جميعها ظاهرة">
     {fridayHours.map(hour=><WindowCard key={hour.number}
       title={`الساعة ${["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][hour.number-1]}`}
       tone="friday" fridayHour={hour.number}
       window={hour} nowMs={nowMs} timeZone={timeZone} unavailable="—"
       fridaySelected={selectedFridayHour===hour.number} fridaySelectionBusy={fridaySelectionBusy}
       onSelectFridayHour={onSelectFridayHour}/>)}
    </div>
    {onSelectFridayHour?<p className="np-r311-friday-hint" data-testid="r311-friday-hint" role="status">
      {selectedFridayHour?"تم تسجيل الساعة التي وصلت خلالها إلى المسجد. اضغط عليها مرة أخرى للإلغاء.":"اضغط على الساعة التي وصلت خلالها إلى المسجد لتسجيلها."}
    </p>:null}
    <details className="np-r308-friday-details" data-testid="r308-friday-details">
      <summary>تفاصيل ساعات الجمعة وفضائل التبكير</summary>
      <ol>
        {fridayHours.map(hour=>{
          const virtue=fridayVirtueR284(hour.number);
          return <li key={hour.number}>
            <strong>الساعة {["الأولى","الثانية","الثالثة","الرابعة","الخامسة"][hour.number-1]}</strong>
            <span>من {clock(hour.startMs,timeZone)} إلى {clock(hour.endMs,timeZone)}</span>
            <span>{virtue.icon} {virtue.description}</span>
          </li>;
        })}
      </ol>
    </details>
    </>:<p role="status" className="np-r232-help">
     يلزم توفر وقت الشروق والظهر المعتمدين ليوم الجمعة من نور.
    </p>}
    <p className="np-r284-friday-source">{NOOR_FRIDAY_VIRTUES_SOURCE_R284}. يعتمد الحساب الزمني على مواقيت نور، وقد تختلف بداية ساعات التبكير باختلاف الاجتهاد الفقهي ووقت خروج الإمام.</p>
   </div>:null}
   </div>
  </section>
  </div>
 </div>
 </>;
}
