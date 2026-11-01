import { parseStatisticRows, summarizeProgress, statisticPeriods, statisticDays, statisticEligible, statisticInsights, statisticCalendar, shiftStatisticMonth, wholeWeekAchievement, yesterdayAchievement, validStatisticDate, type StatisticRow } from "./progress-statistics.js";
import { loadCurrentTemperature } from "./public-weather-client.js";
import { readAppearance, saveAppearance, type NoorAppearance } from "./appearance-preference-store.js";
import { createPortal, flushSync } from "react-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";

import {
  financeSummary,
  debtElapsedPeriod,
  financeEditToken,
  fetchNoorPersonalToday,
  fetchNoorPersonalWorkspace,
  sendNoorPersonalCommandDetailed,
} from "./noor-personal-today-client.js";

import type {
  FinanceLedger,
  FinanceOperation,
  NoorPersonalCommandInput,
  NoorPersonalTodayResult,
  NoorPersonalWorkspaceResult,
} from "./noor-personal-today-client.js";

export interface NoorPersonalApplicationViewProps {
  readonly initialResult?: NoorPersonalTodayResult;
  readonly initialWorkspace?: NoorPersonalWorkspaceResult;
}

type FastCommand=Extract<NoorPersonalCommandInput,{type:'set-execution-completed'|'record-activity'|'edit-activity-note'}>;
type FastChange={command:FastCommand;executionId:string;definitionId:string;title:string;entry?:ActivityEntry};
type UnknownRecord = Record<string, unknown>;

type ExecutionItem = Readonly<{
  weight:number;
  id: string;
  definitionId: string;
  title: string;
  status: string;
  kind: "Task" | "Habit";
}>;

type ActivityEntry = Readonly<{ id:string; executionId:string; localDate:string; at:string; note:string; amount:number; endReason:"achieved"|"expired"|"cancelled"|null }>;
type DefinitionItem = Readonly<{
  weight:number;
  displayOrder?:number;
  timeOfDay?:string;
  revisionId:string;
  measurement?: {target:number;unit:string};
  activityLog: readonly ActivityEntry[];
  id: string;
  title: string;
  kind: "Task" | "Habit";
  state: string;
  category: string;
  scheduleKind: "OneTime" | "Daily" | "Weekdays";
  weekdays: readonly number[];
  startDate: string;
  endDate: string | null;
  importance: string;
}>;

type PeriodInsight = Readonly<{
  windowDays: number;
  scheduled: number;
  completed: number;
  completionRate: number;
  successfulDays: number;
}>;

type WorkspaceViewModel = Readonly<{
  statistics:Readonly<{currentDate:string|null;rows:readonly StatisticRow[]}>;
  categories:readonly string[];
  finance: FinanceLedger | null;
  definitions: readonly DefinitionItem[];
  currentStreakDays: number;
  bestStreakDays: number;
  periods: Readonly<{
    week: PeriodInsight;
    month: PeriodInsight;
    quarter: PeriodInsight;
    year: PeriodInsight;
  }>;
}>;

type TodayViewModel = Readonly<{
  localDate:string|null;
  timeZone: string;
  personalDayState: string;
  nextPrayer: Readonly<{
    name: string;
    at: string;
  }> | null;
  prayerTimes: readonly Readonly<{
    key: string;
    label: string;
    at: string;
  }>[];
  tasks: readonly ExecutionItem[];
  habits: readonly ExecutionItem[];
}>;

type HeaderLocation = Readonly<{
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}>;

const PRAYER_NAMES: Readonly<Record<string, string>> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
  Sunrise: "الشروق",
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  Planned: "مخطط",
  InProgress: "قيد التنفيذ",
  Pending: "بانتظار التنفيذ",
  Completed: "مكتمل",
  Deferred: "مؤجل",
  Cancelled: "ملغي",
  Skipped: "متجاوز",
  Missed: "فائت",
  Suppressed: "موقوف",
};

const WEEKDAYS = [
  [0, "الأحد"],
  [1, "الاثنين"],
  [2, "الثلاثاء"],
  [3, "الأربعاء"],
  [4, "الخميس"],
  [5, "الجمعة"],
  [6, "السبت"],
] as const;

const COMMON_CATEGORIES = [
  "الصحة والرياضة",
  "العبادات",
  "العمل",
  "التعلم",
  "الأسرة",
  "الشؤون الشخصية",
  "الأدوية والمكملات الغذائية",
] as const;

const PAGE_STYLES = `
  :root { color-scheme: light; }
  body { margin:0; background:#f7f4ee; }
  .np-page,.np-page *{box-sizing:border-box}
  .np-page{
    --bg:#f7f4ee;
    --panel:#fffdf9;
    --panel-2:#ffffff;
    --panel-soft:#f9f7f2;
    --border:#e7dfd2;
    --border-strong:#d9c9ad;
    --text:#102a43;
    --muted:#6b7f92;
    --muted-2:#8d9baa;
    --gold:#b8862b;
    --gold-soft:#fff4d6;
    --surface-elevated:#ffffff;
    --green:#2f8f6b;
    min-height:100vh;
    color:var(--text);
    background:
      radial-gradient(circle at 92% 4%,rgba(219,191,130,.20),transparent 26rem),
      radial-gradient(circle at 6% 18%,rgba(202,220,226,.24),transparent 24rem),
      linear-gradient(180deg,#fbfaf7 0%,#f5f1e9 100%);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;
    position:relative;overflow-x:hidden;
  }
  .np-page::before{
    content:"";position:fixed;inset:0;pointer-events:none;opacity:.16;
    background-image:
      linear-gradient(30deg,transparent 24%,rgba(184,134,43,.10) 25%,rgba(184,134,43,.10) 26%,transparent 27%,transparent 74%,rgba(184,134,43,.10) 75%,rgba(184,134,43,.10) 76%,transparent 77%),
      linear-gradient(150deg,transparent 24%,rgba(184,134,43,.07) 25%,rgba(184,134,43,.07) 26%,transparent 27%,transparent 74%,rgba(184,134,43,.07) 75%,rgba(184,134,43,.07) 76%,transparent 77%);
    background-size:44px 76px;background-position:right -18px top -20px;
    mask-image:linear-gradient(90deg,transparent 0%,black 13%,black 87%,transparent 100%);
  }
  .np-watermark{display:none}
  .np-wrap{position:relative;z-index:1;width:min(1376px,calc(100% - 32px));margin:0 auto;padding:32px 0 60px}
  .np-topbar{
    min-height:132px;display:grid;grid-template-columns:minmax(0,1.03fr) minmax(0,.97fr);
    grid-template-areas:"calendar status";align-items:center;gap:22px;margin-bottom:18px;
    padding:6px 138px 6px;direction:ltr;position:relative;
    border:1px solid #e9e0d1;border-radius:26px;
    background:
      radial-gradient(circle at 84% 35%,rgba(203,218,223,.38),transparent 16rem),
      radial-gradient(circle at 12% 75%,rgba(221,203,166,.23),transparent 17rem),
      rgba(255,253,249,.96);
    box-shadow:0 16px 42px rgba(81,61,31,.10),inset 0 1px 0 rgba(255,255,255,.9)
  }
  .np-topbar::after{
    content:"";position:absolute;right:4%;left:4%;bottom:0;height:42px;pointer-events:none;opacity:.12;
    background:linear-gradient(90deg,transparent,#7393a7 18%,#5f7f91 33%,transparent 34%,transparent 66%,#5f7f91 67%,#7393a7 82%,transparent);
    clip-path:polygon(0 100%,0 86%,6% 86%,8% 55%,10% 86%,20% 86%,22% 40%,24% 86%,37% 86%,39% 64%,41% 86%,58% 86%,60% 34%,62% 86%,76% 86%,78% 60%,80% 86%,91% 86%,93% 48%,95% 86%,100% 86%,100% 100%);
  }
  .np-brand{position:absolute;right:24px;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;direction:rtl;z-index:2}
  .np-logo-frame{
    width:96px;height:96px;border-radius:50%;overflow:hidden;background:#fff;
    border:1.5px solid #c9a64a;box-shadow:0 10px 28px rgba(106,78,25,.16),0 0 0 6px rgba(255,255,255,.72);flex:0 0 auto
  }
  .np-platform-logo{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
  .np-brand-subtitle{margin:0;color:var(--muted);font-size:11px;font-weight:700}
  .np-state-logo{display:block;width:76px;height:76px;object-fit:cover;object-position:center;border-radius:50%;background:#fff;border:1px solid #e6d7bc;margin:0 0 14px auto;box-shadow:0 8px 24px rgba(81,61,31,.10)}
  .np-top-actions{position:absolute;left:24px;top:50%;transform:translateY(-50%);display:flex;align-items:center;justify-content:center;direction:rtl;z-index:2}
  .np-icon-btn{
    width:54px;height:54px;display:grid;place-items:center;border:1px solid #e6d7bc;border-radius:17px;
    background:rgba(255,255,255,.94);color:#b8862b;cursor:pointer;transition:.18s ease;
    box-shadow:0 8px 22px rgba(89,63,23,.10)
  }
  .np-icon-btn:hover{background:#fffaf0;border-color:#c9a64a;transform:translateY(-2px)}
  .np-icon-btn svg{width:23px;height:23px}
  .np-header-calendar{
    grid-area:calendar;direction:rtl;text-align:center;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-inline:8px
  }
  .np-header-day{
    margin:0 0 8px;font-family:"Al Bayan","Geeza Pro","Noto Naskh Arabic","Traditional Arabic",Tahoma,Arial,sans-serif;
    font-size:clamp(32px,3vw,38px);font-weight:700;line-height:1.05;color:#10354a;letter-spacing:.01em;position:relative
  }
  .np-header-day::after{content:"";display:block;width:170px;height:1px;background:linear-gradient(90deg,transparent,#c9a64a,transparent);margin:7px auto 0}
  .np-header-date-pair{width:100%;display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);align-items:center;column-gap:18px;padding-top:0;position:relative;direction:ltr}
  .np-header-date-block{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-family:"Al Bayan","Geeza Pro","Noto Naskh Arabic","Traditional Arabic",serif;direction:rtl}.np-header-date-block:first-child{justify-self:end}.np-header-date-block:last-child{justify-self:start}
  .np-header-date-main{color:#183b56;font-size:13px;font-weight:700;line-height:1.5;white-space:nowrap}
  .np-header-date-main.hijri{color:#52677b}
  .np-header-date-caption{color:#8293a6;font-size:10px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}
  .np-header-date-divider{width:1px;height:36px;background:#d7c8ae}
  .np-header-status{grid-area:status;direction:rtl;min-width:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:0 12px}
  .np-header-clock{color:#102a43;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;font-size:clamp(32px,2.7vw,36px);font-weight:760;line-height:1.05;font-variant-numeric:tabular-nums;white-space:nowrap}
  .np-header-location{margin-top:5px;display:flex;align-items:center;gap:7px;color:#6b7f92;font-size:13px;font-weight:650}
  .np-header-location svg{width:18px;height:18px;color:#315f7b;flex:0 0 auto}
  .np-header-weather{margin-top:5px;display:flex;align-items:center;gap:9px;color:#6b7f92;transform:translateX(18px)}
  .np-weather-icon{width:44px;height:34px;position:relative;display:inline-block;flex:0 0 auto}
  .np-weather-icon::before{content:"";position:absolute;width:18px;height:18px;border-radius:50%;background:#f7c948;top:0;right:6px;box-shadow:0 0 0 6px rgba(247,201,72,.10)}
  .np-weather-icon::after{content:"";position:absolute;width:31px;height:15px;border-radius:14px 14px 9px 9px;background:#dbe8ef;bottom:1px;left:1px;box-shadow:10px -6px 0 -4px #dbe8ef}
  .np-header-temperature{color:#102a43;font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;font-size:28px;font-weight:760;font-variant-numeric:tabular-nums}
  .np-weather-caption{font-size:11px;color:#8a99a8}
  .np-card{border:1px solid #e9e0d1;border-radius:30px;background:rgba(255,253,249,.96);box-shadow:0 12px 34px rgba(81,61,31,.08)}
  .np-prayer-card{padding:12px 18px;margin-bottom:14px;overflow:hidden;direction:rtl;position:relative}
  .np-prayer-card::before{
    content:"";position:absolute;inset:0;pointer-events:none;opacity:.28;
    background:
      radial-gradient(circle at 8% 8%,rgba(184,134,43,.10),transparent 10rem),
      radial-gradient(circle at 95% 92%,rgba(112,151,169,.10),transparent 13rem)
  }
  .np-prayer-card-head{display:flex;align-items:center;justify-content:flex-start;gap:8px;margin-bottom:8px;padding:0;position:relative}
  .np-prayer-card-icon{width:28px;height:28px;display:grid;place-items:center;color:#b8862b;flex:0 0 auto}
  .np-prayer-card-icon svg{width:26px;height:26px}
  .np-prayer-card-title{margin:0;color:#10354a;font-family:"Al Bayan","Geeza Pro","Noto Naskh Arabic","Traditional Arabic",serif;font-size:21px;font-weight:760;line-height:1}
  .np-prayer-times{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;direction:rtl;position:relative}
  .np-prayer{
    min-height:92px;padding:5px 7px;border:1px solid #e5e8eb;border-radius:15px;background:rgba(255,255,255,.94);
    text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:.18s ease;position:relative;
    box-shadow:0 5px 14px rgba(66,78,87,.045)
  }
  .np-prayer:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(66,78,87,.07)}
  .np-prayer-symbol{width:28px;height:28px;margin-bottom:2px;color:#2e5c7b;display:grid;place-items:center;border-radius:50%;background:#eef4f7}
  .np-prayer-symbol svg{width:16px;height:16px}
  .np-prayer-label{display:block;margin-bottom:3px;color:#183b56;font-family:"Al Bayan","Geeza Pro","Noto Naskh Arabic","Traditional Arabic",serif;font-size:14px;font-weight:700;line-height:1.15}
  .np-prayer-time{color:#102a43;font-family:"Al Bayan","Geeza Pro","Noto Naskh Arabic","Traditional Arabic",serif;font-size:16px;font-weight:760;font-variant-numeric:tabular-nums;white-space:nowrap;line-height:1.1}
  .np-prayer.is-next{border-color:#d6a52f;background:linear-gradient(145deg,#fff8e7 0%,#fff0c7 100%);box-shadow:0 8px 20px rgba(184,134,43,.11)}
  .np-prayer.is-next .np-prayer-symbol{color:#9b6807;background:#fde8b0}
  .np-prayer.is-next .np-prayer-label{color:#8c5b00}.np-prayer.is-next .np-prayer-time{color:#6f4a00}
  .np-countdown{margin-top:3px;width:auto;display:flex;align-items:center;justify-content:center;gap:5px;min-height:20px;padding:3px 7px;border:0;border-radius:999px;background:linear-gradient(180deg,#d4a137,#b77d12);color:#fff;font-size:11px;font-weight:800;font-variant-numeric:tabular-nums;box-shadow:0 4px 9px rgba(154,103,14,.15)}
  .np-countdown svg{width:11px;height:11px;flex:0 0 auto}
  .np-night-event .np-prayer-symbol{color:#315f7b;background:#edf3f8}
  .np-main-grid{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(320px,430px);gap:18px;align-items:start;direction:ltr}
  .np-category-grid{display:grid;grid-template-columns:1fr;gap:16px;direction:rtl}
  .np-category{padding:18px;border-radius:22px}
  .np-category-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}
  .np-category-title{margin:0;font-size:18px;font-weight:790;color:#183b56}
  .np-category-count{padding:4px 8px;border-radius:999px;background:#f2eee6;color:#6b7f92;font-size:10px}
  .np-list{display:grid;gap:12px}
  .np-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border:1px solid #e5e8eb;border-radius:16px;background:#fff;min-height:68px}
  .np-item-main{min-width:0}.np-item-title{margin:0;font-size:15px;font-weight:720;color:#102a43}
  .np-item-meta{display:flex;gap:8px;align-items:center;margin-top:6px;color:#6b7f92;font-size:10.5px}
  .np-kind-badge{padding:4px 8px;border-radius:999px;background:#eef3f6;color:#52677b}
  .np-btn{border:1px solid #c9d7df;border-radius:10px;background:#f6fafb;color:#315f7b;padding:7px 10px;cursor:pointer;font:inherit;font-size:10.5px;font-weight:730;transition:.16s ease}
  .np-btn:hover:not(:disabled){background:#edf5f7;transform:translateY(-1px)}
  .np-btn.secondary{width:34px;height:34px;padding:0;border-radius:50%;border-color:#7cc2a8;background:#eef9f4;color:#287a5e;font-size:0}.np-btn.secondary::after{content:"↺";font-size:15px}
  .np-btn.complete{width:34px;height:34px;padding:0;border-radius:50%;border-color:#d2ae5b;background:#fff8e7;color:#946400;font-size:0}.np-btn.complete::after{content:"✓";font-size:15px}
  .np-btn.danger{border-color:#efb7b7;background:#fff3f3;color:#b14a4a}.np-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
  .np-side-stack{display:grid;gap:14px;direction:rtl}
  .np-side-card{padding:16px;border-radius:18px}
  .np-side-title,.np-summary-heading{margin:0 0 2px;font-size:22px;color:#183b56;font-weight:760}
  .np-metric-card{padding:16px;border-radius:18px;min-height:104px;display:flex;flex-direction:column;justify-content:center;gap:8px;background:#fff;border-color:#e5e8eb}
  .np-metric-label{color:#6b7f92;font-size:12px}.np-metric-value{color:#8c5b00;font-size:28px;font-weight:820;font-variant-numeric:tabular-nums}.np-metric-copy{color:#8d9baa;font-size:10.5px}
  .np-status-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;color:var(--muted);font-size:10.5px}.np-status-row+.np-status-row{border-top:1px solid #edf0f2}.np-status-value{color:#183b56;font-weight:760}
  .np-mini-stat{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0}.np-mini-stat-label{color:var(--muted);font-size:10px}.np-mini-stat-value{font-size:16px;font-weight:820}
  .np-empty{padding:22px 15px;border:1px dashed #d8dee3;border-radius:13px;color:var(--muted);text-align:center}.np-empty strong{display:block;margin-bottom:5px;color:#183b56;font-size:12px}.np-empty span{font-size:10.5px}
  .np-insights{margin-top:22px;padding:20px;border-radius:24px}.np-insights-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:12px}.np-insights-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  .np-insight{padding:16px;border:1px solid #e5e8eb;border-radius:18px;background:#fff;min-height:112px}.np-insight-label{color:#6b7f92;font-size:12px}.np-insight-rate{margin:8px 0 4px;font-size:28px;font-weight:820;color:#8c5b00}.np-insight-copy{color:#8d9baa;font-size:10px}.np-streaks{color:#6b7f92;font-size:10.5px}
  .np-action-error{margin:0 0 12px;padding:10px 12px;border:1px solid #efb7b7;border-radius:11px;background:#fff3f3;color:#b14a4a;font-size:11px}
  .np-control{padding:22px}.np-control-head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:18px}.np-control-title{margin:0;font-size:23px;color:#183b56}.np-control-subtitle{margin:5px 0 0;color:var(--muted);font-size:11px}
  .np-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;padding:17px;border:1px solid #e5e8eb;border-radius:15px;background:#fbfaf7;margin-bottom:18px}.np-field{display:grid;gap:6px}.np-field.full{grid-column:1/-1}.np-label{font-size:10.5px;color:#52677b;font-weight:700}
  .np-input,.np-select{width:100%;border:1px solid #dce3e7;border-radius:10px;background:#fff;color:#102a43;padding:9px 10px;outline:none;font:inherit;font-size:11px}.np-input:focus,.np-select:focus{border-color:#8fb5c8;box-shadow:0 0 0 3px rgba(79,130,158,.08)}
  .np-weekdays{display:flex;flex-wrap:wrap;gap:6px}.np-weekday{display:flex;align-items:center;gap:4px;padding:6px 8px;border:1px solid #e1e6e9;border-radius:9px;background:#fff;font-size:9.5px;color:#52677b}
  .np-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px}.np-definitions{display:grid;gap:8px}.np-definition{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #e5e8eb;border-radius:12px;background:#fff}.np-definition-name{font-weight:740;font-size:12px}.np-definition-copy{margin-top:4px;color:var(--muted);font-size:9.5px}.np-definition-actions{display:flex;gap:6px;flex-wrap:wrap}
  .np-platform-title{color:#183b56;font-weight:800}
  .np-eyebrow{color:#8d9baa}
  @media(max-width:1180px){
    .np-wrap{width:min(100% - 28px,1376px)}.np-topbar{min-height:126px;padding:6px 116px;gap:16px}.np-logo-frame{width:88px;height:88px}.np-header-day{font-size:35px}.np-header-date-main{font-size:14px}.np-header-clock{font-size:32px}
    .np-main-grid{grid-template-columns:minmax(0,1.75fr) minmax(280px,360px)}.np-prayer-times{grid-template-columns:repeat(8,minmax(0,1fr));gap:7px}.np-prayer{min-height:88px;padding-inline:6px}.np-prayer-time{font-size:15px}
  }
  @media(max-width:900px){
    .np-topbar{min-height:122px;padding:6px 90px;gap:10px}.np-logo-frame{width:72px;height:72px}.np-brand{right:12px}.np-top-actions{left:12px}.np-icon-btn{width:48px;height:48px;border-radius:15px}
    .np-header-day{font-size:31px;margin-bottom:7px}.np-header-date-pair{column-gap:12px;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr)}.np-header-date-main{font-size:11px}.np-header-date-caption{display:none}.np-header-clock{font-size:27px}.np-header-location{font-size:10px;margin-top:5px}.np-header-weather{margin-top:5px;transform:translateX(14px)}.np-weather-caption{display:none}.np-weather-icon{transform:scale(.82)}.np-header-temperature{font-size:24px}
    .np-prayer-card{padding:10px 8px}.np-prayer-times{grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}.np-prayer{min-height:84px;padding:4px}.np-prayer-label{font-size:12px}.np-prayer-time{font-size:14px}.np-main-grid{grid-template-columns:1fr}.np-side-stack{grid-template-columns:repeat(2,minmax(0,1fr));direction:rtl}.np-summary-heading{grid-column:1/-1}.np-insights-grid{grid-template-columns:repeat(2,1fr)}
  }
  @media(max-width:600px){
    .np-wrap{width:min(100% - 18px,1376px);padding-top:12px}.np-topbar{min-height:auto;grid-template-columns:1fr;grid-template-areas:"calendar" "status";padding:88px 14px 20px;gap:16px;border-radius:24px}
    .np-brand{right:12px;top:12px;transform:none}.np-top-actions{left:12px;top:20px;transform:none}.np-logo-frame{width:66px;height:66px}.np-header-calendar{padding:0}.np-header-day{font-size:31px}.np-header-date-pair{grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);column-gap:10px}.np-header-date-main{font-size:12px}.np-header-status{padding:14px 0 0;border-top:1px solid #e7dfd2}.np-header-clock{font-size:30px}.np-header-weather{transform:none}
    .np-prayer-card-title{font-size:20px}.np-prayer-times{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.np-prayer{min-height:88px}.np-side-stack{grid-template-columns:1fr}.np-insights-grid{grid-template-columns:1fr}.np-item,.np-definition{align-items:flex-start}.np-form{grid-template-columns:1fr}.np-field.full,.np-form-actions{grid-column:auto}
  }

/* NOOR_READABILITY_APPROVED_V1 BEGIN; verified preview CSS preserved verbatim. */
/* NOOR preview only. No colors, font families, logos, routes or application logic changed. */
.np-page .np-label { font-size:13px; line-height:1.5; }
.np-page .np-control-subtitle, .np-page .np-brand-subtitle, .np-page .np-metric-copy,
.np-page .np-kind-badge, .np-page .np-category-count, .np-page .np-header-date-caption,
.np-page .np-weather-caption, .np-page .np-item-meta > span:not(.np-kind-badge),
.np-page .np-empty > span,
.np-page .np-insight-copy, .np-page .np-streaks { font-size:12px; line-height:1.5; }
.np-page .np-btn:not(.secondary):not(.complete) { font-size:13px; line-height:1.4; }
.np-page .np-input, .np-page .np-select { font-size:14px; line-height:1.5; }
.np-page .np-item-meta { flex-wrap:wrap; row-gap:6px; }
@media (max-width:600px) { .np-page .np-input, .np-page .np-select { font-size:16px; } }
@media (max-width:900px) { .np-page .np-header-location > span { font-size:12px; line-height:1.5; } }
@media (min-width:601px) and (max-width:900px) { .np-page .np-header-date-main { font-size:12px; line-height:1.5; } }
/* NOOR_READABILITY_APPROVED_V1 END */

/* NOOR_DASHBOARD_R63 BEGIN */
.np-topbar[data-testid="platform-topbar"]{direction:ltr;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"status calendar"}
.np-control-icon{color:#315f7b;background:linear-gradient(145deg,#fff,#eef3f6);border-color:#d6e0e5;box-shadow:0 5px 14px rgba(24,59,86,.09),inset 0 1px 0 #fff}
.np-control-icon:focus-visible{outline:3px solid #8fb5c8;outline-offset:4px}
.np-execution-stack,.np-habits-section{min-width:0;display:grid;gap:16px;direction:rtl}
.np-section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:2px 4px}
.np-section-heading h2{margin:0;font-size:22px;color:#183b56}
.np-section-heading>span{font-size:12px;color:#52677b}
.np-category-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));align-items:start}
.np-habit-category{min-width:0;padding:18px;background:linear-gradient(155deg,#fffefa,#fff);border-color:#e7dfd0}
.np-category-heading{min-width:0;display:grid;gap:8px;justify-items:start}
.np-category-heading .np-category-title{overflow-wrap:anywhere;line-height:1.55}
.np-category-progress{position:relative;width:64px;height:64px;flex:0 0 64px;color:#a47a22;direction:ltr}
.np-category-progress svg{width:100%;height:100%;transform:rotate(-90deg)}
.np-category-progress circle{fill:none;stroke-width:4.5}
.np-ring-track{stroke:#efe9dd}
.np-ring-value{stroke:currentColor;stroke-linecap:round}
.np-category-progress>span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:750;font-variant-numeric:tabular-nums;color:#183b56}
.np-category-progress small{font-size:11px;margin-left:1px}
.np-category-progress.is-complete{color:#287a5e}
.np-habit-category .np-item{padding:12px;gap:10px;min-width:0;align-items:center}
.np-execution-stack .np-item-title{overflow-wrap:anywhere;line-height:1.6}
.np-execution-stack .np-item .np-btn{flex-shrink:0;min-width:34px}
.np-habits-empty{grid-column:1/-1}
@media(max-width:600px){
 .np-topbar[data-testid="platform-topbar"]{grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"status calendar";gap:10px;padding:88px 10px 20px}
 .np-topbar[data-testid="platform-topbar"] .np-header-status{border-top:0;padding:0}
 .np-topbar[data-testid="platform-topbar"] .np-header-day{font-size:28px}
 .np-topbar[data-testid="platform-topbar"] .np-header-day::after{width:100%;max-width:130px}
 .np-topbar[data-testid="platform-topbar"] .np-header-date-pair{display:flex;flex-direction:column;gap:5px}
 .np-topbar[data-testid="platform-topbar"] .np-header-date-divider{width:36px;height:1px}
 .np-topbar[data-testid="platform-topbar"] .np-header-location{flex-wrap:wrap;justify-content:center;gap:4px}
 .np-topbar[data-testid="platform-topbar"] .np-header-location>span{overflow-wrap:anywhere;text-align:center}
 .np-topbar[data-testid="platform-topbar"] .np-header-clock{font-size:27px}
}
/* NOOR_HEADER_POSITION_R63B */
/* NOOR_DASHBOARD_R63 END */
/* NOOR_HEADER_CENTER_R63C BEGIN */
.np-topbar[data-testid="platform-topbar"] .np-header-calendar,
.np-topbar[data-testid="platform-topbar"] .np-header-status{align-items:center;text-align:center}
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:100%}
.np-topbar[data-testid="platform-topbar"] .np-header-date-block{align-items:center;justify-content:center;justify-self:center;text-align:center;max-width:100%}
.np-topbar[data-testid="platform-topbar"] .np-header-date-divider{width:32px;height:1px;flex:0 0 1px;margin-inline:auto}
.np-topbar[data-testid="platform-topbar"] .np-header-location,
.np-topbar[data-testid="platform-topbar"] .np-header-weather{align-self:center;justify-content:center;max-width:100%;margin-inline:auto;text-align:center;transform:none}
/* NOOR_HEADER_CENTER_R63C END */



/* NOOR_DATES_PRAYER_TIMERS_R64 BEGIN */
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair{display:flex;flex-direction:row;flex-wrap:nowrap;justify-content:center;align-items:center;gap:10px;width:100%;direction:ltr}
.np-topbar[data-testid="platform-topbar"] .np-header-date-block{flex:0 1 auto;min-width:0;text-align:center;align-items:center;justify-self:center}
.np-topbar[data-testid="platform-topbar"] .np-header-date-divider{width:1px;height:30px;flex:0 0 1px;margin:0}
.np-date-compact{display:none}
.np-prayer-times{grid-template-columns:repeat(auto-fit,minmax(min(100%,110px),1fr));align-items:stretch}
.np-prayer{min-width:0;display:flex;flex-direction:column;align-items:center;overflow:hidden}
.np-prayer .np-countdown{box-sizing:border-box;max-width:100%;min-width:0;flex:0 0 auto;align-self:center;justify-content:center;padding:4px 6px;gap:4px;line-height:1.35;direction:ltr;white-space:nowrap;font-size:11px}
.np-prayer .np-countdown>span{min-width:0;font-variant-numeric:tabular-nums}
.np-prayer .np-countdown svg{flex:0 0 11px}
.np-night-event .np-countdown{background:linear-gradient(180deg,#47758f,#315f7b);box-shadow:0 4px 9px rgba(49,95,123,.14)}
@media(max-width:900px){
 .np-date-full{display:none}
 .np-date-compact{display:inline}
 .np-topbar[data-testid="platform-topbar"] .np-header-date-pair{gap:5px}
 .np-topbar[data-testid="platform-topbar"] .np-header-date-main{font-size:12px}
}
/* NOOR_DATES_PRAYER_TIMERS_R64 END */

/* NOOR_ARABIC_MONTHS_SINGLE_PRAYER_ROW_R64B BEGIN */
.np-topbar[data-testid="platform-topbar"] .np-date-full{display:inline}
.np-topbar[data-testid="platform-topbar"] .np-date-compact{display:none}
/* NOOR_DATE_ALIGNMENT_R66C */
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair{display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);align-items:center;gap:8px;direction:ltr;width:100%}
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair>.np-header-date-block{width:fit-content;min-width:0;max-width:100%;grid-row:1}
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair>.np-header-date-block:first-child{grid-column:3;justify-self:start}
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair>.np-header-date-block:last-child{grid-column:1;justify-self:end}
.np-topbar[data-testid="platform-topbar"] .np-header-date-pair>.np-header-date-divider{grid-column:2;grid-row:1;justify-self:center;margin:0}
.np-topbar[data-testid="platform-topbar"] .np-header-day{align-self:center;text-align:center;margin-inline:0}
.np-topbar[data-testid="platform-topbar"] .np-header-date-block{justify-self:stretch;min-width:0}
.np-topbar[data-testid="platform-topbar"] .np-header-date-main{white-space:normal;text-wrap:balance;line-height:1.55;max-width:100%;overflow-wrap:normal}
.np-topbar[data-testid="platform-topbar"] .np-header-date-divider{justify-self:center}
.np-topbar[data-testid="platform-topbar"] .np-header-weather{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);direction:rtl;align-items:center;gap:6px;width:100%;max-width:100%;transform:none}
.np-topbar[data-testid="platform-topbar"] .np-header-temperature{grid-column:2;grid-row:1;justify-self:center}
.np-topbar[data-testid="platform-topbar"] .np-weather-icon{grid-column:1;grid-row:1;justify-self:end}
.np-topbar[data-testid="platform-topbar"] .np-weather-caption{grid-column:3;grid-row:1;justify-self:start;white-space:nowrap}
.np-prayer-times{display:flex;flex-wrap:nowrap;gap:8px;align-items:stretch;overflow-x:auto;overflow-y:hidden;padding:2px 2px 9px;scroll-padding-inline:2px;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.np-prayer-times:focus-visible{outline:2px solid #8fb5c8;outline-offset:-2px}
.np-prayer-times .np-prayer{flex:1 0 110px;min-width:110px;margin:0}
/* NOOR_ARABIC_MONTHS_SINGLE_PRAYER_ROW_R64B END */

/* NOOR_EIGHT_PRAYERS_FIT_R64C BEGIN */
.np-prayer-times{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;overflow:visible;padding:2px 0 8px}
.np-prayer-times .np-prayer{min-width:0;width:100%;padding:6px 4px;flex:initial}
.np-countdown-full{display:inline}
.np-countdown-compact{display:none}
@media(max-width:900px){
 .np-prayer-times{gap:4px}
 .np-prayer .np-countdown{padding:3px 2px;gap:0;max-width:100%}
 .np-prayer .np-countdown>svg{display:none}
 .np-prayer .np-countdown-full{display:none}
 .np-prayer .np-countdown-compact{display:grid;gap:1px;text-align:center;font-size:11px;line-height:1.3}
 .np-countdown-compact>span{display:flex;justify-content:center;align-items:baseline;gap:2px;direction:ltr}
 .np-countdown-compact small{font-size:9px;font-weight:600}
 .np-prayer-time{white-space:normal;line-height:1.4}
}
@media(max-width:600px){
 .np-prayer-card{padding:10px 5px}
 .np-prayer-times{gap:2px}
 .np-prayer-times .np-prayer{padding:5px 1px;border-radius:9px}
 .np-prayer-label{font-size:10.5px;line-height:1.5;overflow-wrap:anywhere}
 .np-prayer-time{font-size:10.5px;line-height:1.5;overflow-wrap:normal}
 .np-prayer-symbol{width:22px;height:22px;flex:0 0 22px}
 .np-prayer-symbol svg{width:14px;height:14px}
}
/* NOOR_EIGHT_PRAYERS_FIT_R64C END */

/* NOOR_HORIZONTAL_COUNTDOWN_R64D BEGIN */
.np-prayer .np-countdown{display:flex;flex-direction:row;align-items:center;justify-content:center;font-size:11px;line-height:1.35;white-space:nowrap;direction:ltr}
.np-prayer .np-countdown-digits{display:block;white-space:nowrap;font-size:11px;line-height:1.35;font-variant-numeric:tabular-nums}
@media(max-width:900px){
 .np-prayer .np-countdown{padding:4px 1px}
 .np-prayer .np-countdown>svg{display:none}
}
@media(max-width:600px){
 .np-prayer-card{width:calc(100% + 10px);margin-inline:-5px;padding-inline:4px}
 .np-prayer-times{gap:1px}
 .np-prayer-times .np-prayer{padding-inline:0}
 .np-prayer .np-countdown{width:100%;max-width:100%;padding:4px 0;border-radius:8px}
 .np-prayer .np-countdown-digits{font-family:Arial,sans-serif;font-size:11px;letter-spacing:-.3px}
}
/* NOOR_HORIZONTAL_COUNTDOWN_R64D END */

/* NOOR_WIDE_COUNTDOWN_PILL_R64E BEGIN */
.np-prayer .np-countdown{width:100%;max-width:100%;box-sizing:border-box;min-height:24px;align-self:stretch;padding:4px 2px;border-radius:999px;justify-content:center}
.np-prayer .np-countdown-digits{flex:0 0 auto}
@media(max-width:600px){.np-prayer .np-countdown{padding:4px 0}}
/* NOOR_WIDE_COUNTDOWN_PILL_R64E END */
/* NOOR_CONTROL_CENTER_R65 BEGIN */
.np-cc{padding:0;overflow:hidden;border-radius:24px;background:#faf9f6}
.np-cc-header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px;border-bottom:1px solid #e4e4df;background:rgba(255,255,255,.8)}
.np-cc-kicker{font-size:12px;color:#6b7f92;margin:0 0 5px;line-height:1.6}
.np-cc-layout{display:grid;grid-template-columns:180px minmax(0,1fr) 260px;align-items:start;direction:rtl;min-height:540px}
.np-cc-layout:has(.np-cc-themes){grid-template-columns:180px minmax(0,1fr)}
.np-cc-nav{padding:20px 12px;display:grid;gap:6px;align-content:start;min-width:0}
.np-cc-nav-item{display:flex;align-items:center;gap:10px;padding:11px 12px;border:0;border-radius:11px;background:transparent;color:#52677b;font:inherit;font-size:14px;text-align:right;cursor:pointer}
.np-cc-nav-item svg,.np-cc-row-icon svg{width:21px;height:21px;flex-shrink:0}
.np-cc-nav-item small{margin-inline-start:auto;font-size:12px;font-variant-numeric:tabular-nums}
.np-cc-nav-item.is-selected{background:#e7ecee;color:#183b56;font-weight:750}
.np-cc-nav-note{font-size:12px;color:#6b7f92;line-height:1.9;padding:14px 10px}
.np-cc-main{min-width:0;min-height:540px;background:#fff;padding:25px;border-inline:1px solid #e9e9e4}
.np-cc-title{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:22px}
.np-cc-title h2{margin:0;font-size:24px;color:#183b56}.np-cc-title p{margin:5px 0 0;font-size:13px;color:#6b7f92}
.np-cc-button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:8px 13px;border:1px solid #d8dfe3;border-radius:10px;background:#fff;color:#315f7b;cursor:pointer;font:inherit;font-size:13px;font-weight:650;line-height:1.5;gap:6px}
.np-cc-button.primary{background:#315f7b;color:#fff;border-color:#315f7b}.np-cc-button.danger{color:#ad4545;background:#fff7f6;border-color:#edcfcb}
.np-cc-button:disabled{opacity:.5;cursor:wait}.np-cc button:focus-visible,.np-cc input:focus-visible,.np-cc select:focus-visible{outline:3px solid #8fb5c8;outline-offset:2px}
.np-cc-tools{display:grid;grid-template-columns:minmax(0,1fr) 140px;gap:10px}.np-cc-tools .np-input,.np-cc-tools .np-select{min-height:42px}
.np-cc-results{font-size:12px;color:#6b7f92;margin:16px 0 8px}.np-cc-list{display:grid;gap:4px}
.np-cc-row{width:100%;display:flex;gap:12px;align-items:center;padding:14px 11px;text-align:right;border:1px solid transparent;border-radius:13px;background:transparent;cursor:pointer;font:inherit;color:#183b56;min-width:0}
.np-cc-row:hover{background:#f6f8f9}.np-cc-row.is-selected{background:#eef4f7;border-color:#d9e7ee}.np-cc-row-icon{display:grid;place-items:center;width:36px;height:36px;flex:0 0 36px;border-radius:11px;background:#f0f2f3;color:#52677b}
.np-cc-row-copy{display:grid;gap:6px;flex:1;min-width:0}.np-cc-row-copy strong{font-size:14px;overflow-wrap:anywhere}.np-cc-row-copy>span{font-size:12px;line-height:1.8;color:#6b7f92;overflow-wrap:anywhere}
.np-cc-status{font-size:11px;white-space:nowrap;padding:4px 7px;border-radius:7px;background:#eaf4ef;color:#32765d}.np-cc-status.paused{background:#fff3d9;color:#91671b}.np-cc-status.archived{background:#eceff1;color:#67747d}
.np-cc-inspector{padding:25px 20px;min-width:0}.np-cc-inspector h2{font-size:20px;line-height:1.7;margin:0 0 20px;overflow-wrap:anywhere}.np-cc-inspector dl{margin:0;display:grid;gap:7px}.np-cc-inspector dt{font-size:12px;color:#6b7f92}.np-cc-inspector dd{font-size:13px;line-height:1.9;margin:0 0 12px;overflow-wrap:anywhere}
.np-cc-actions{display:grid;gap:10px;margin-top:20px}.np-cc-help{font-size:12px;line-height:1.9;color:#6b7f92}.np-cc-confirm{padding:12px;border:1px solid #edcfcb;border-radius:12px;background:#fff7f6}.np-cc-confirm p{font-size:13px;line-height:1.8}.np-cc-confirm .np-cc-button{margin:3px}
.np-cc-create{margin-top:20px;padding:18px;background:#f8f9fa;border:1px solid #e4e8eb;border-radius:14px}.np-cc-create[hidden]{display:none}.np-cc-create h3{margin:0 0 18px}.np-cc-create .np-form{margin:0}
.np-cc-create .np-form-actions .np-btn.complete{width:auto;height:auto;min-height:40px;font-size:13px;padding:8px 16px;border-radius:10px}.np-cc-create .np-form-actions .np-btn.complete::after{content:none}
.np-cc-themes{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:16px}.np-cc-theme{border:1px solid #dce2e5;border-radius:16px;padding:12px;background:#fff;display:grid;gap:10px;color:#183b56;text-align:right;font:inherit;cursor:pointer}.np-cc-theme[aria-pressed=true]{outline:2px solid #527d93;outline-offset:2px}.np-cc-theme>span:not(.np-cc-theme-preview),.np-cc-theme small{font-size:12px;line-height:1.8;color:#6b7f92}
.np-cc-theme-preview{display:flex;gap:7px;background:#f7f1e6;padding:18px 12px;border-radius:9px;height:90px;align-items:stretch}.np-cc-theme-preview i{background:#fffaf0;border:1px solid #dccb9b;border-radius:5px;flex:1}.np-cc-theme.light .np-cc-theme-preview{background:#edf1f4}.np-cc-theme.light i{background:white;border-color:#cfd7df}.np-cc-theme.dark .np-cc-theme-preview{background:#19222c}.np-cc-theme.dark i{background:#303d4b;border-color:#536477}
.np-page[data-appearance=light]{background:#f2f4f6;--bg:#f2f4f6;--panel:#fff;--border:#e0e4e8}.np-page[data-appearance=light]::before{opacity:.04}.np-page[data-appearance=light] .np-topbar,.np-page[data-appearance=light] .np-card{background:#fff;border-color:#e0e4e8}
.np-page[data-appearance=dark]{background:#151c24;color:#e2eaf2;--text:#e2eaf2;--muted:#afbdca;--border:#3a4959;--panel:#202b36;--panel-2:#202b36;--panel-soft:#263340}.np-page[data-appearance=dark]::before{opacity:.035}
.np-page[data-appearance=dark] :is(.np-card,.np-topbar,.np-prayer,.np-item,.np-insight,.np-cc-main,.np-cc-theme,.np-cc-header,.np-cc-create,.np-cc-row-icon){background:#202b36;border-color:#3a4959;color:#e2eaf2}
.np-page[data-appearance=dark] :is(h1,h2,h3,.np-item-title,.np-header-day,.np-header-clock,.np-header-date-main,.np-header-temperature,.np-prayer-label,.np-prayer-time,.np-metric-value,.np-metric-label,.np-insight-rate,.np-cc-row,.np-category-progress>span){color:#e2eaf2}
.np-page[data-appearance=dark] :is(.np-header-date-caption,.np-header-location,.np-weather-caption,.np-metric-copy,.np-cc-help,.np-cc-kicker,.np-cc-results,.np-cc-title p,.np-cc-row-copy>span,.np-cc-inspector dt,.np-cc-nav-note,.np-cc-theme>span:not(.np-cc-theme-preview),.np-cc-theme small){color:#afbdca}
.np-page[data-appearance=dark] :is(.np-input,.np-select,.np-cc-button){background:#18232e;border-color:#4b5f70;color:#e2eaf2}.np-page[data-appearance=dark] .np-cc-button.primary{background:#396c8a;color:#fff}.np-page[data-appearance=dark] .np-cc-button.danger{background:#38282e;color:#ffb7b0}.np-page[data-appearance=dark] .np-cc-confirm{background:#38282e;border-color:#805257}
.np-page[data-appearance=dark] :is(.np-cc-row.is-selected,.np-cc-nav-item.is-selected){background:#304759;color:#eef6ff;border-color:#4c708a}.np-page[data-appearance=dark] .np-cc-nav-item{color:#bdcad6}.np-page[data-appearance=dark] .np-prayer.is-next{background:#473a20;border-color:#b28d43}
@media(max-width:1100px){.np-cc-layout{grid-template-columns:150px minmax(0,1fr)}.np-cc-inspector{grid-column:2;border-top:1px solid #e4e8eb}.np-cc-main{min-height:350px}}
@media(max-width:700px){.np-cc-header{padding:18px 14px;align-items:flex-start}.np-cc-header .np-control-title{font-size:22px}.np-cc-layout,.np-cc-layout:has(.np-cc-themes){display:flex;flex-direction:column;min-height:0}.np-cc-nav{display:flex;width:100%;padding:10px;gap:5px;border-bottom:1px solid #e4e8eb}.np-cc-nav-item{flex:1;justify-content:center;font-size:13px;padding:10px 5px;gap:5px}.np-cc-nav-note{display:none}.np-cc-nav-item svg{width:17px;height:17px}.np-cc-main,.np-cc-inspector{width:100%;padding:18px 12px;min-height:0;border-inline:0}.np-cc-tools{grid-template-columns:minmax(0,1fr) 110px}.np-cc-row{flex-wrap:wrap;padding:12px 8px;gap:8px}.np-cc-row-copy{flex-basis:calc(100% - 48px)}.np-cc-status{margin-inline-start:44px}.np-cc-create{padding:12px}}
/* NOOR_CONTROL_CENTER_R65 END */

/* NOOR_CONTROL_HEADER_R65B BEGIN */
.np-cc-header{min-height:108px;direction:rtl;align-items:center;padding:20px 24px;gap:18px}
.np-cc-heading{display:flex;align-items:center;gap:16px;min-width:0}
.np-cc-heading-copy{min-width:0;text-align:right}
.np-cc-heading-copy .np-control-title{margin:0;line-height:1.5;font-size:27px}
.np-cc-heading-copy .np-cc-kicker{margin:0 0 3px;font-size:12px;letter-spacing:0}
.np-cc-header-logo{width:64px;height:64px;flex:0 0 64px;border-radius:50%;box-shadow:0 4px 12px rgba(81,61,31,.08)}
.np-cc-header>.np-cc-button{flex-shrink:0;margin-inline-start:auto}
@media(max-width:700px){
 .np-cc-header{min-height:88px;padding:15px 12px;gap:10px}
 .np-cc-heading{gap:10px}
 .np-cc-header-logo{width:46px;height:46px;flex-basis:46px}
 .np-cc-heading-copy .np-control-title{font-size:21px}
 .np-cc-header>.np-cc-button{font-size:12px;padding:7px 9px}
}
/* NOOR_CONTROL_HEADER_R65B END */

/* NOOR_CONTROL_MODAL_R65C BEGIN */
.np-cc-shell{display:grid;gap:18px}
.np-cc-shell>.np-cc-header{border:1px solid #e4e4df;border-radius:22px;background:#fff;box-shadow:0 5px 20px rgba(24,59,86,.04)}
.np-cc-modal-backdrop[hidden]{display:none}
.np-cc-modal-backdrop{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(13,25,38,.42);backdrop-filter:blur(6px);direction:rtl}
.np-cc-modal{width:min(680px,100%);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;background:#fff;color:#183b56;border:1px solid #e1e6e9;border-radius:22px;box-shadow:0 24px 90px rgba(8,21,34,.25);outline:none;overflow:hidden}
.np-cc-modal-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 24px;border-bottom:1px solid #e6e9ec;flex-shrink:0}
.np-cc-modal-head h2{font-size:23px;margin:0;line-height:1.5}
.np-cc-modal-body{padding:22px 24px;overflow-y:auto;min-height:0;overscroll-behavior:contain}
.np-cc-modal-body .np-form{margin:0}
.np-cc-modal .np-form-actions .np-btn.complete{width:auto;height:auto;min-height:42px;font-size:13px;padding:9px 18px;border-radius:10px}
.np-cc-modal .np-form-actions .np-btn.complete::after{content:none}
.np-cc-modal-footer{padding:12px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #e6e9ec;flex-shrink:0}
.np-cc-modal-footer>span{font-size:12px;color:#6b7f92}
.np-cc-modal button:focus-visible,.np-cc-modal input:focus-visible,.np-cc-modal select:focus-visible{outline:3px solid #8fb5c8;outline-offset:2px}
.np-page[data-appearance=dark] .np-cc-modal{background:#202b36;color:#e2eaf2;border-color:#3a4959}
.np-page[data-appearance=dark] :is(.np-cc-modal-head,.np-cc-modal-footer){border-color:#3a4959}
.np-page[data-appearance=dark] .np-cc-modal-footer>span{color:#afbdca}
@media(max-width:600px){.np-cc-shell{gap:12px}.np-cc-modal-backdrop{padding:10px}.np-cc-modal{max-height:calc(100dvh - 20px);border-radius:18px}.np-cc-modal-head{padding:16px}.np-cc-modal-body{padding:18px 16px}.np-cc-modal-footer{padding:12px 16px}.np-cc-modal .np-form{grid-template-columns:1fr}.np-cc-modal-head h2{font-size:21px}}
/* NOOR_CONTROL_MODAL_R65C END */

/* NOOR_INLINE_DETAILS_R65D BEGIN */
.np-cc-layout,.np-cc-layout:has(.np-cc-themes){grid-template-columns:180px minmax(0,1fr)}
.np-cc-expandable{min-width:0;border:1px solid transparent;border-radius:14px;overflow:hidden}
.np-cc-expandable:has(.np-cc-inline-detail){border-color:#d9e7ee;background:#f8fafb}
.np-cc-row{border-radius:12px}
.np-cc-inline-detail{padding:20px 22px;border-top:1px solid #dde7ed;min-width:0}
.np-cc-inline-detail h2{margin:0 0 16px;font-size:20px;overflow-wrap:anywhere}
.np-cc-inline-detail dl{margin:0;display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px 18px;font-size:13px;line-height:1.9}
.np-cc-inline-detail dt{color:#6b7f92}.np-cc-inline-detail dd{margin:0;overflow-wrap:anywhere}
.np-cc-inline-detail .np-cc-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.np-cc-inline-detail .np-cc-confirm{flex-basis:100%}
.np-page[data-appearance=dark] .np-cc-expandable:has(.np-cc-inline-detail){background:#1d2a35;border-color:#4c708a}
.np-page[data-appearance=dark] .np-cc-inline-detail{border-color:#3a4959}.np-page[data-appearance=dark] .np-cc-inline-detail dt{color:#afbdca}
@media(max-width:1100px){.np-cc-layout{grid-template-columns:150px minmax(0,1fr)}}
@media(max-width:700px){.np-cc-inline-detail{padding:16px 12px}.np-cc-inline-detail dl{grid-template-columns:90px minmax(0,1fr);gap:8px 12px}}
/* NOOR_INLINE_DETAILS_R65D END */

/* NOOR_COMPACT_VISIBLE_DETAILS_R65E BEGIN */
.np-cc-inline-detail{padding:14px 16px;max-height:min(440px,calc(100dvh - 48px));overflow-y:auto;overscroll-behavior:contain;scroll-margin-block:20px;scrollbar-gutter:stable}
.np-cc-inline-detail h2{font-size:17px;margin:0 0 10px;line-height:1.6}
.np-cc-inline-detail .np-cc-kicker{margin-bottom:3px}
.np-cc-inline-detail dl{grid-template-columns:100px minmax(0,1fr);gap:6px 12px;font-size:12px;line-height:1.8}
.np-cc-inline-detail .np-cc-actions{margin-top:12px;gap:8px}
.np-cc-inline-detail .np-cc-button{min-height:36px;padding:6px 11px;font-size:12px}
@media(max-width:700px){.np-cc-inline-detail{padding:12px;max-height:calc(100dvh - 48px)}.np-cc-inline-detail dl{grid-template-columns:85px minmax(0,1fr)}}
/* NOOR_COMPACT_VISIBLE_DETAILS_R65E END */

/* NOOR_PERMANENT_DELETE_R66 */
.np-cc-heading-copy{display:flex;align-items:center;min-height:64px}
.np-cc-heading-copy .np-control-title{margin:0}
@media(max-width:700px){.np-cc-heading-copy{min-height:46px}}

/* NOOR_PROGRESS_R67 */
.np-activity-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.np-pencil{display:grid;place-items:center;min-width:40px;min-height:40px;padding:8px}.np-habit-check{width:24px;height:24px;accent-color:#287b65;cursor:pointer}.np-progress-copy{display:grid;gap:6px;font-size:13px;margin-top:9px}.np-progress-copy progress{width:100%;height:7px;accent-color:#287b65}.np-activity-note{font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0;color:#657589}.np-activity-backdrop{position:fixed;inset:0;z-index:10000;background:#12243766;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}.np-activity-dialog{box-sizing:border-box;width:min(100%,480px);max-height:calc(100dvh - 32px);overflow:auto;background:#fff;color:#183b56;border-radius:22px;padding:24px;box-shadow:0 20px 70px #10203340}.np-activity-dialog h2{font-size:21px;margin:0 0 8px}.np-activity-dialog form{display:grid;gap:14px}.np-activity-dialog label{display:grid;gap:7px;font-size:14px;line-height:1.7}.np-activity-dialog input,.np-activity-dialog textarea,.np-activity-dialog select{box-sizing:border-box;width:100%;font:inherit;border:1px solid #ccd5dd;border-radius:10px;padding:10px;background:#f8fafb;color:#183b56}.np-activity-dialog textarea{resize:vertical}.np-activity-dialog small,.np-activity-help{font-size:12px;line-height:1.8;color:#66778a}.np-activity-footer{display:flex;gap:10px;justify-content:flex-end}.np-activity-history{margin-top:20px;border-top:1px solid #e2e7ec;padding-top:12px;font-size:13px}.np-activity-history>div{padding:10px 0;border-bottom:1px solid #eee}.np-activity-history p{white-space:pre-wrap;overflow-wrap:anywhere}.np-note-tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.np-note-tools .np-btn{min-height:40px;font-size:12px}.np-activity-dialog .np-note-delete{background:#fff0eb;color:#a53f2a}.np-note-editor{margin-top:10px;padding:12px;border:1px solid #d7e0e5;border-radius:12px;background:#f8fafb}.np-note-editor p{line-height:1.8}
.np-activity-history summary{cursor:pointer}.np-activity-dialog .np-btn{padding:10px 16px;border:0;border-radius:10px;cursor:pointer;font:inherit}.np-activity-dialog .secondary{background:#edf1f4;color:#304c61}.np-activity-dialog .complete{background:#287b65;color:white}.np-activity-dialog button:disabled{opacity:.55;cursor:wait}
@media(max-width:600px){.np-activity-item{flex-wrap:wrap}.np-activity-item .np-item-main{flex:1;min-width:110px}.np-activity-dialog{padding:18px}}

/* NOOR_ACTIVITY_BUTTONS_R67B */
.np-activity-actions .np-btn::before,.np-activity-actions .np-btn::after,
.np-activity-dialog .np-btn::before,.np-activity-dialog .np-btn::after{content:none;display:none}
.np-activity-actions .np-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:auto;height:40px;min-height:40px;border:1px solid #d5dfe3;border-radius:12px;padding:0 14px;font-size:13px;font-weight:600;line-height:1.4;transform:none;box-shadow:0 1px 2px #163d4c08}
.np-activity-actions .np-btn.np-pencil{width:40px;min-width:40px;padding:0;background:#f3f6f7;border-color:#dce4e7;color:#526b7b;border-radius:12px}
.np-activity-actions .np-pencil svg{display:block;width:18px;height:18px;flex:none}
.np-activity-actions .np-btn.complete{min-width:64px;background:#edf6f2;border-color:#cce2d8;color:#24674f}
.np-activity-actions .np-btn:hover:not(:disabled){background:#e8f1ed;border-color:#b6cfc4;transform:none}
.np-activity-dialog .np-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:auto;height:42px;min-height:42px;min-width:82px;padding:0 18px;border:1px solid transparent;border-radius:12px;font-size:14px;font-weight:600;line-height:1.4;transform:none;box-shadow:none}
.np-activity-dialog .np-btn.secondary{background:#f1f4f6;border-color:#dce3e8;color:#486071}
.np-activity-dialog .np-btn.complete{background:#287b65;border-color:#287b65;color:#fff}
.np-activity-dialog .np-btn.complete:hover:not(:disabled){background:#216652}
.np-activity-dialog .np-btn.secondary:hover:not(:disabled){background:#e7edf0}
.np-activity-actions .np-btn:focus-visible,.np-activity-dialog .np-btn:focus-visible{outline:3px solid #83b8d1;outline-offset:3px}
@media(max-width:600px){.np-activity-actions .np-btn{height:44px;min-height:44px}.np-activity-actions .np-btn.np-pencil{width:44px;min-width:44px}.np-activity-dialog .np-btn{height:44px;min-height:44px}}

/* NOOR_MATCHED_ACTIVITY_CONTROLS_R67C */
.np-activity-actions{display:flex;align-items:center;justify-content:center;gap:10px;min-height:44px}
.np-activity-actions .np-btn.np-pencil{box-sizing:border-box;position:relative;isolation:isolate;display:inline-grid;place-items:center;width:24px;min-width:24px;height:24px;min-height:24px;padding:0;margin:0;border:1px solid #b9c8ce;border-radius:6px;background:#f7faf9;color:#376557;box-shadow:none;overflow:visible;vertical-align:middle}
.np-activity-actions .np-btn.np-pencil svg{width:15px;height:15px;display:block;pointer-events:none}
.np-activity-actions .np-habit-check{box-sizing:border-box;appearance:none;-webkit-appearance:none;position:relative;display:inline-block;flex:0 0 24px;width:24px;min-width:24px;height:24px;margin:0;border:1px solid #b9c8ce;border-radius:6px;background:#f7faf9;box-shadow:none;cursor:pointer;vertical-align:middle;accent-color:#287b65}
.np-activity-actions .np-habit-check:checked{border-color:#287b65;background-color:#287b65;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='m6 12 4 4 8-9' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-position:center;background-repeat:no-repeat;background-size:22px}
.np-activity-actions .np-btn.np-pencil:hover:not(:disabled),.np-activity-actions .np-habit-check:hover:not(:disabled):not(:checked){border-color:#83ac9c;background-color:#edf6f2}
.np-activity-actions .np-habit-check:focus-visible{outline:3px solid #83b8d1;outline-offset:3px}
.np-activity-actions .np-habit-check:disabled{opacity:.45;cursor:not-allowed}
/* Expanded transparent hit regions preserve the 24px visual controls. */
.np-activity-actions .np-btn.np-pencil::before{content:"";display:block;position:absolute;inset:-10px;z-index:-1;border-radius:10px}
.np-habit-check-target{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:-10px;cursor:pointer}
.np-activity-actions:has(.np-habit-check-target){gap:20px}
@media(forced-colors:active){.np-activity-actions .np-habit-check{appearance:auto;-webkit-appearance:auto}}

/* NOOR_FINANCE_R68 */
.nf{direction:rtl;min-width:0;color:#233f50}.nf *{box-sizing:border-box}.nf h2{margin:0;font-size:26px;letter-spacing:-.4px}.nf h3{margin:0;font-size:17px}.nf p{line-height:1.8;overflow-wrap:anywhere}.nf-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.nf-heading p{margin:4px 0;color:#758591;font-size:13px}.nf-heading .nf-eyebrow{font-size:11px;font-weight:650;color:#938060}.nf-button{appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 15px;border:1px solid #dce4e7;border-radius:11px;background:#f6f8f8;color:#365562;font:inherit;font-size:13px;font-weight:600;cursor:pointer;line-height:1.4;white-space:normal;transition:background .15s}.nf-button.primary{background:#287b65;border-color:#287b65;color:white}.nf-button:hover:not(:disabled){filter:brightness(.96)}.nf-button:disabled{opacity:.45;cursor:not-allowed}.nf-tabs{display:flex;gap:5px;padding:5px;background:#eef2f3;border-radius:12px;margin-bottom:20px;flex-wrap:wrap}.nf-tabs button{flex:1;border:0;border-radius:9px;background:transparent;min-height:36px;padding:8px;color:#6b7c86;font:inherit;font-size:12px;cursor:pointer}.nf-tabs .is-active{background:white;color:#234b50;box-shadow:0 1px 4px #183b5614;font-weight:650}.nf-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:22px}.nf-actions{display:flex;gap:7px;flex-wrap:wrap}.nf-period{font-size:12px;color:#6c8089;display:flex;align-items:center;gap:8px}.nf input,.nf select,.nf textarea{font:inherit;font-size:13px;min-width:0;max-width:100%;padding:9px 10px;border:1px solid #dce4e7;border-radius:9px;background:#fff;color:#2d4b5c}.nf-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.nf-metric{padding:16px;border:1px solid #e3e8e9;border-radius:16px;background:#f9fbfa;display:grid;gap:12px}.nf-metric span{font-size:12px;color:#768790}.nf-metric strong{font-size:19px;font-weight:650;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.nf-metric.featured{background:#edf6f0;border-color:#d5e9dc}.nf-help{font-size:12px;color:#768792;line-height:1.8;margin:14px 0}.nf-transactions{margin-top:24px}.nf-list-heading{display:flex;gap:12px;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap}.nf-list-heading>div{display:flex;gap:7px;max-width:100%;flex-wrap:wrap}.nf-entry,.nf-debt{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 0;border-bottom:1px solid #e9edef;min-width:0}.nf-entry>div:first-child,.nf-debt>div{min-width:0;flex:1}.nf-entry p,.nf-debt p{font-size:12px;color:#778793;margin:5px 0;white-space:pre-wrap}.nf-entry strong{font-size:14px}.nf-badge{display:inline-block;background:#edf3f4;color:#55737b;border-radius:6px;padding:3px 6px;font-size:10px;margin-inline-end:7px}.nf-entry-amount{display:grid;gap:8px;text-align:left;flex-shrink:0;font-variant-numeric:tabular-nums}.nf-entry.is-void{opacity:.6}.nf-entry.is-void .nf-entry-amount>strong{text-decoration:line-through}.nf-link{border:0;background:none;padding:3px;color:#8c7770;font:inherit;font-size:11px;cursor:pointer}.nf-entry-amount>span{font-size:11px;color:#8a7a71}.nf-empty{padding:24px;border:1px dashed #d7e0e4;border-radius:15px;margin:16px 0;text-align:center;color:#7a8c94;font-size:14px;line-height:1.9}.nf-empty p{font-size:13px}.nf-account-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.nf-account{padding:20px;border:1px solid #e0e7e7;border-radius:18px;background:#fafcfb;display:grid;gap:13px}.nf-account>strong{font-size:23px}.nf-account p{font-size:12px;color:#7a8b92;margin:0}.nf-account .nf-button{justify-self:start}.nf-debt h3{display:inline-block;font-size:15px}.nf-debt strong{display:block;margin-top:9px;font-size:20px}.nf-backdrop{position:fixed;inset:0;z-index:10010;background:#142c3e66;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}.nf-dialog{width:min(100%,470px);max-height:calc(100dvh - 32px);overflow:auto;background:white;color:#294655;border:1px solid #e2e8ea;border-radius:22px;padding:24px;box-shadow:0 24px 80px #143b4c35;box-sizing:border-box}.nf-dialog h2{font-size:21px;margin:0 0 22px}.nf-dialog fieldset{border:0;margin:0;padding:0;min-width:0;display:grid;gap:13px}.nf-dialog label{display:grid;gap:6px;font-size:13px;line-height:1.8}.nf-dialog input,.nf-dialog select,.nf-dialog textarea{box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid #d7e0e5;border-radius:10px;background:#f9fbfc;color:#284652;font:inherit;font-size:14px}.nf-dialog textarea{resize:vertical}.nf-dialog small{color:#7a8c95;font-size:11px;line-height:1.8}.nf-dialog .nf-help{margin:0}.nf-modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:10px}.nf-error{color:#ad4444;background:#fff1f0;border-radius:9px;padding:10px;font-size:13px;line-height:1.8}.nf-button:focus-visible,.nf input:focus-visible,.nf-dialog :is(input,select,textarea):focus-visible,.nf-tabs button:focus-visible{outline:3px solid #83b8d1;outline-offset:2px}
.np-page[data-appearance=dark] .nf{color:#dbe5eb}.np-page[data-appearance=dark] :is(.nf-account,.nf-metric,.nf-empty){background:#26333c;border-color:#40505a}.np-page[data-appearance=dark] .nf-tabs{background:#17252d}.np-page[data-appearance=dark] .nf-tabs .is-active{background:#34454e;color:#eff6f5}.np-page[data-appearance=dark] .nf :is(input,select){background:#24363e;color:#dbe5eb;border-color:#465963}
@media(max-width:1100px){.nf-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.nf-heading{align-items:flex-start;flex-wrap:wrap}.nf-heading h2{font-size:23px}.nf-metric{padding:13px}.nf-metric strong{font-size:17px}.nf-account-grid{grid-template-columns:1fr}.nf-tabs button{flex:1 1 40%;font-size:12px}.nf-entry,.nf-debt{align-items:flex-start;gap:10px}.nf-entry-amount>strong{font-size:12px}.nf-debt{flex-wrap:wrap}.nf-dialog{padding:18px}.nf-button{min-height:44px}.np-cc-nav{flex-wrap:wrap}}

/* NOOR_SPEED_R69 */
.np-sync-status{margin:0 0 10px;font-size:12px;line-height:1.7;color:#637e85;text-align:center}
/* NOOR_MOBILE_LAYOUT_R75: mobile presentation; all eight prayer events remain visible. */
@media(max-width:600px){
 .np-page .np-wrap{width:calc(100% - 20px);padding-top:12px;padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))}
 .np-page .np-topbar[data-testid="platform-topbar"]{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:8px;min-height:0;padding:65px 10px 16px;margin-bottom:12px;border-radius:22px;box-shadow:0 8px 24px rgba(81,61,31,.07)}
 .np-page .np-topbar .np-brand{top:12px;right:14px}
 .np-page .np-topbar .np-logo-frame{width:44px;height:44px;box-shadow:0 3px 10px rgba(106,78,25,.10),0 0 0 3px rgba(255,255,255,.7)}
 .np-page .np-topbar .np-top-actions{top:12px;left:14px}
 .np-page .np-topbar .np-icon-btn{width:44px;height:44px;border-radius:14px}
 .np-page .np-topbar .np-icon-btn svg{width:22px;height:22px}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-calendar{padding:0;min-width:0}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-day{font-size:27px;line-height:1.25;margin:0 0 8px}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-day::after{margin-top:5px;width:90px}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-date-pair{gap:5px;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr)}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-date-pair>.np-header-date-block{width:100%;justify-self:stretch}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-date-main{font-size:12px;line-height:1.6;text-wrap:initial}
 .np-page .np-date-month{display:block;white-space:normal;text-wrap:balance}
 .np-page .np-date-year{display:block;white-space:nowrap;color:#6b7f92;font-size:11px}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-date-divider{height:38px;align-self:center}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-status{padding:0;gap:0;align-self:center}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-clock{font-size:clamp(22px,6vw,28px);letter-spacing:-.5px;line-height:1.2}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-location{gap:3px;margin-top:5px;flex-wrap:nowrap}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-location>span{font-size:11px;line-height:1.5}
 .np-page .np-topbar .np-header-location svg{width:14px;height:14px}
 .np-page .np-topbar[data-testid="platform-topbar"] .np-header-weather{margin-top:3px;gap:2px}
 .np-page .np-topbar .np-header-temperature{font-size:23px;line-height:1.3}
 .np-page .np-topbar .np-weather-icon{transform:scale(.72);width:34px;height:28px;transform-origin:center}
 .np-page .np-topbar::after{height:22px;opacity:.07}
 .np-page .np-prayer-card{width:100%;margin-inline:0;margin-bottom:16px;padding:12px 4px 8px;border-radius:22px;box-shadow:0 6px 20px rgba(81,61,31,.06)}
 .np-page .np-prayer-card-head{gap:5px;padding-inline:8px;margin-bottom:10px}
 .np-page .np-prayer-card-title{font-size:19px;line-height:1.3}
 .np-page .np-prayer-card-icon{width:23px;height:23px}
 .np-page .np-prayer-card-icon svg{width:23px;height:23px}
 .np-page .np-prayer-times{grid-template-columns:repeat(8,minmax(0,1fr));gap:2px;padding:0 0 4px;overflow:visible;align-items:stretch}
 .np-page .np-prayer-times .np-prayer{display:grid;grid-template-rows:22px 34px 31px 24px;align-items:center;justify-items:center;align-content:center;gap:3px;min-height:128px;padding:6px 0;border-radius:11px;box-shadow:none}
 .np-page .np-prayer-symbol{margin:0;width:22px;height:22px}
 .np-page .np-prayer-label{width:100%;margin:0;font-size:11px;line-height:1.4;overflow-wrap:normal;text-wrap:balance}
 .np-page .np-prayer-time{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:12px;line-height:1.3;white-space:nowrap;font-variant-numeric:tabular-nums}
 .np-page .np-prayer-period{font-size:10px;line-height:1.2;color:#6b7f92}
 .np-page .np-prayer .np-countdown{grid-row:4;width:100%;min-width:0;min-height:24px;margin:0;padding:3px 0;box-shadow:none;border-radius:999px}
 .np-page .np-prayer .np-countdown-digits{font-family:Arial,sans-serif;font-size:11px;line-height:1.4;letter-spacing:-.65px;font-weight:700}
 .np-page .np-main-grid{gap:16px}
 .np-page .np-execution-stack,.np-page .np-habits-section{gap:10px}
 .np-page .np-section-heading{padding:0 4px;gap:6px}
 .np-page .np-section-heading h2,.np-page .np-summary-heading{font-size:21px;line-height:1.5}
 .np-page .np-section-heading>span{font-size:11px}
 .np-page .np-category-grid{gap:12px}
 .np-page .np-category{padding:14px;border-radius:20px}
 .np-page .np-habits-empty{padding:12px}
 .np-page .np-habits-empty .np-empty{padding:16px 12px;border-radius:14px;line-height:1.7}
 .np-page .np-habits-empty .np-empty strong{font-size:14px;margin-bottom:5px}
 .np-page .np-habits-empty .np-empty span{font-size:12px}
 .np-page .np-side-stack{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .np-page .np-summary-heading{grid-column:1/-1;margin:0;padding-inline:4px}
 .np-page .np-metric-card{padding:13px;min-height:102px;border-radius:18px;gap:5px;box-shadow:0 4px 14px rgba(81,61,31,.04)}
 .np-page .np-metric-label{font-size:12px;line-height:1.5}
 .np-page .np-metric-value{font-size:25px;line-height:1.2}
 .np-page .np-metric-copy{font-size:11px;line-height:1.5}
 .np-page .np-insights{margin-top:16px;padding:14px;border-radius:20px}
 .np-page .np-insights-head{gap:8px;align-items:center;flex-wrap:wrap}
 .np-page .np-insights-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .np-page .np-insight{padding:12px;min-height:100px;border-radius:15px}
 .np-page .np-insight-rate{font-size:25px}
}

.np-order-saving{font-size:12px;color:var(--muted);margin:8px 0}
.np-order-group{border:1px solid var(--border);border-radius:14px;padding:10px 12px;margin-top:12px;background:var(--panel)}.np-order-group h3{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px;font-size:15px}.np-order-group h3 small{font-size:12px;font-weight:400;color:var(--muted)}.np-order-group li:last-child{border-bottom:0}
.np-stat-filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:18px}.np-stat-filters label{display:grid;gap:7px;font-size:13px}.np-stat-overview{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0}.np-stat-overview>div{flex:1;min-width:170px;display:grid;gap:6px;padding:18px;border:1px solid var(--border);background:var(--panel-soft);border-radius:16px}.np-stat-overview strong,.np-stat-rate{font-size:32px;font-weight:750;font-variant-numeric:tabular-nums;color:var(--text)}.np-stat-overview small,.np-stat-help,.np-stat-panel>p{color:var(--muted);font-size:12px;line-height:1.9}.np-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:16px 0}.np-stat-panel{padding:18px;border:1px solid var(--border);border-radius:18px;background:var(--panel);min-width:0}.np-stat-panel h3{margin:0;font-size:17px}.np-stat-panel progress{display:block;width:100%;height:9px;accent-color:#287b65;margin:12px 0}.np-stat-days{display:grid;grid-template-columns:repeat(auto-fit,minmax(48px,1fr));gap:8px}.np-stat-day{display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 3px;border-radius:10px;background:var(--panel-soft);font-size:11px;font-variant-numeric:tabular-nums}.np-stat-day meter{width:100%;max-width:45px;height:12px;accent-color:#287b65}.np-stat-day small{font-size:10px;color:var(--muted)}.np-stat-week{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.np-stat-week span{display:grid;font-size:10px;gap:4px;padding:7px;background:var(--panel-soft);border-radius:8px}.np-page .np-weighted-today{position:relative;overflow:hidden;border-color:#c7d9cf;background:linear-gradient(145deg,var(--panel),var(--panel-soft))}.np-weighted-today:after{content:"";position:absolute;inset-inline-end:18px;top:22px;width:44px;height:44px;border-radius:50%;background:conic-gradient(#287b65 var(--today-progress),#dbe5df 0);mask:radial-gradient(circle,transparent 52%,#000 55%)}.np-weighted-today .np-metric-value{color:#287b65}@media(max-width:500px){.np-stat-grid{grid-template-columns:1fr}.np-stat-filters{grid-template-columns:1fr}.np-stat-panel{padding:14px}.np-stat-week{grid-template-columns:repeat(4,minmax(0,1fr))}}

/* NOOR statistics r92: overview, scheduled-day trend, interactive calendar and drilldown. */
.ns-center{--ns-accent:#287b65;--ns-soft:#e6f1eb;min-width:0;color:var(--text)}.ns-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:2px 0 22px}.ns-header h2{font-size:28px;line-height:1.4;margin:5px 0;font-weight:750;letter-spacing:-.5px}.ns-header p{margin:0;font-size:13px;color:var(--muted);line-height:1.8}.ns-eyebrow{font-size:11px;font-weight:650;color:var(--muted)}.ns-date{font-size:12px;white-space:nowrap;color:var(--muted);padding:8px 10px;background:var(--panel-soft);border-radius:9px}.ns-toolbar{display:grid;grid-template-columns:minmax(130px,1fr) minmax(180px,1.5fr);gap:12px;padding:14px;background:var(--panel-soft);border:1px solid var(--border);border-radius:16px;margin-bottom:18px}.ns-toolbar label{display:grid;gap:6px;color:var(--muted);font-size:11px}.ns-toolbar .np-select{min-height:42px;background:var(--panel);font-size:13px}.ns-periods{display:flex;gap:6px;overflow-x:auto;padding:4px;border-radius:14px;background:var(--panel-soft);margin-bottom:18px}.ns-periods button{flex:1;min-width:86px;display:grid;gap:4px;text-align:center;border:1px solid transparent;border-radius:10px;background:transparent;color:var(--muted);padding:10px 12px;font:inherit;font-size:13px;cursor:pointer}.ns-periods button small{font-size:10px;white-space:nowrap}.ns-periods button.is-active{background:var(--panel);border-color:var(--border);color:var(--text);box-shadow:0 2px 6px #10203309;font-weight:700}.ns-hero{display:grid;grid-template-columns:168px minmax(0,1fr);align-items:center;gap:24px;padding:24px;border:1px solid var(--border);border-radius:22px;background:linear-gradient(130deg,var(--panel),var(--panel-soft));margin-bottom:14px}.ns-score{position:relative;width:160px;height:160px;display:grid;place-items:center}.ns-ring{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}.ns-ring circle{fill:none;stroke-width:8}.ns-ring-track{stroke:var(--border)}.ns-ring-value{stroke:var(--ns-accent);stroke-linecap:round}.ns-score>div{display:grid;text-align:center;gap:5px}.ns-score strong{font-size:36px;line-height:1.1;letter-spacing:-1px;font-variant-numeric:tabular-nums}.ns-score span{font-size:11px;color:var(--muted)}.ns-hero-copy{display:grid;gap:9px;min-width:0}.ns-hero-copy h3{font-size:22px;margin:0;line-height:1.55}.ns-hero-copy p{font-size:12px;margin:0;color:var(--muted)}.ns-points{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums}.ns-points small{font-size:12px;font-weight:400;color:var(--muted)}.ns-change{font-size:11px;color:var(--ns-accent);font-weight:650}.ns-change.down{color:#ac7047}.ns-quiet{font-size:11px;color:var(--muted);line-height:1.7}.ns-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:22px}.ns-metrics>div{padding:15px;border:1px solid var(--border);border-radius:15px;display:grid;gap:9px;background:var(--panel);min-width:0}.ns-metrics>div>span{font-size:12px;color:var(--muted)}.ns-metrics strong{font-size:26px;font-weight:700;line-height:1.2;font-variant-numeric:tabular-nums}.ns-metrics strong small{font-size:10px;font-weight:400;color:var(--muted);display:inline-block}.ns-metrics p{margin:0;font-size:10px;color:var(--muted);line-height:1.6}.ns-panel{border:1px solid var(--border);border-radius:18px;background:var(--panel);padding:18px;min-width:0}.ns-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}.ns-panel-head h3{font-size:15px;margin:0;line-height:1.7}.ns-panel-head p{font-size:11px;color:var(--muted);margin:3px 0 0;line-height:1.7}.ns-unit{font-size:10px;color:var(--muted);white-space:nowrap}.ns-chart{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(28px,1fr);gap:7px;overflow-x:auto;overscroll-behavior-x:contain;padding:8px 0 10px;min-width:0}.ns-chart-day{display:grid;grid-template-rows:18px 124px 18px;align-items:end;justify-items:center;gap:8px;border:0;background:transparent;color:var(--muted);font:inherit;padding:0;cursor:pointer;min-width:28px;border-radius:6px}.ns-chart-value{font-size:9px;font-variant-numeric:tabular-nums}.ns-chart-label{font-size:10px}.ns-chart-track{height:124px;display:flex;align-items:flex-end;width:26px;max-width:90%;border-radius:6px;background:var(--panel-soft);overflow:hidden}.ns-chart-track i{display:block;width:100%;border-radius:6px;background:var(--ns-accent)}.ns-chart-day.is-selected .ns-chart-label{font-weight:750;color:var(--text);text-decoration:underline;text-underline-offset:5px}.ns-center [data-level=empty]{background:var(--panel-soft);color:var(--muted)}.ns-center [data-level=missed]{background:#f1e2d6;color:#895d40}.ns-center [data-level=partial]{background:#d1e7dc;color:#285e4e}.ns-center [data-level=strong]{background:#78b29b;color:#143f30}.ns-center [data-level=complete]{background:#287b65;color:#fff}.ns-detail-grid{display:grid;grid-template-columns:minmax(240px,1fr) minmax(0,1.05fr);gap:14px;margin-top:14px}.ns-calendar-nav{gap:8px}.ns-calendar-nav button{width:36px;height:36px;border:1px solid var(--border);border-radius:10px;background:var(--panel-soft);color:var(--text);font:inherit;font-size:23px;cursor:pointer}.ns-calendar-nav button:disabled{opacity:.35;cursor:default}.ns-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.ns-weekday{font-size:10px;color:var(--muted);text-align:center;padding:4px 0 9px}.ns-calendar-day{aspect-ratio:1;min-width:0;min-height:30px;padding:0;border:2px solid transparent;border-radius:9px;font:inherit;font-size:12px;font-variant-numeric:tabular-nums;cursor:pointer}.ns-calendar-day:disabled{opacity:.32;cursor:default}.ns-calendar-day.is-selected{border-color:var(--text);box-shadow:0 0 0 2px var(--panel)}.ns-calendar-day.is-today{font-weight:800}.ns-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;font-size:9px;color:var(--muted)}.ns-legend span{display:inline-flex;gap:4px;align-items:center}.ns-legend i{width:9px;height:9px;border-radius:3px;display:inline-block}.ns-day-details .ns-panel-head>strong{font-size:23px;font-variant-numeric:tabular-nums}.ns-day-details ul{list-style:none;padding:0;margin:0;max-height:320px;overflow:auto;overscroll-behavior:contain}.ns-day-details li{display:flex;align-items:center;gap:9px;padding:12px 0;border-top:1px solid var(--border)}.ns-status-dot{width:25px;height:25px;flex:0 0 25px;border-radius:50%;background:var(--panel-soft);color:var(--muted);display:grid;place-items:center}.ns-status-dot.done{background:var(--ns-soft);color:var(--ns-accent)}.ns-day-details li>div{min-width:0;display:grid;gap:5px}.ns-day-details li>div strong{font-size:12px;overflow-wrap:anywhere}.ns-day-details li>div small{font-size:10px;color:var(--muted)}.ns-row-points{font-size:13px;font-weight:700;margin-inline-start:auto;flex-shrink:0;font-variant-numeric:tabular-nums}.ns-row-points small{font-size:10px;font-weight:400;color:var(--muted)}.ns-day-empty{font-size:12px;line-height:1.9;color:var(--muted);padding:26px 8px;text-align:center}.ns-next-period{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 3px;color:var(--muted);font-size:11px}.ns-next-period strong{font-weight:500}.ns-method{margin-top:8px;padding-top:14px;border-top:1px solid var(--border);color:var(--muted);font-size:11px;line-height:1.9}.ns-method summary{cursor:pointer}.ns-empty{display:grid;justify-items:center;text-align:center;gap:12px;padding:50px 20px;border:1px dashed var(--border);border-radius:20px;color:var(--muted)}.ns-empty h3{margin:0;font-size:18px;color:var(--text)}.ns-empty p{font-size:13px;line-height:1.9;max-width:360px;margin:0}.ns-center button:focus-visible{outline:3px solid #78a9bd;outline-offset:3px}.np-page[data-appearance=dark] .ns-center{--ns-accent:#8bc7ae;--ns-soft:#294a3c}.np-page[data-appearance=dark] .ns-center [data-level=complete]{background:#427f66;color:#fff}.np-page[data-appearance=dark] .ns-center [data-level=missed]{background:#4a3b32;color:#e4b594}.np-page[data-appearance=dark] .ns-center [data-level=partial]{background:#324e42;color:#c1dfd1}.np-page[data-appearance=dark] .ns-center [data-level=strong]{background:#47765e;color:#e9fff3}@media(max-width:1000px){.ns-detail-grid{grid-template-columns:1fr}}@media(max-width:500px){.ns-header{gap:8px;flex-wrap:wrap;margin-bottom:16px}.ns-header h2{font-size:25px}.ns-toolbar{grid-template-columns:1fr;padding:12px}.ns-hero{grid-template-columns:118px minmax(0,1fr);padding:16px 12px;gap:12px;border-radius:18px}.ns-score{width:116px;height:116px}.ns-score strong{font-size:28px}.ns-score span{font-size:9px}.ns-hero-copy h3{font-size:17px}.ns-hero-copy p,.ns-points small{font-size:10px}.ns-points{font-size:17px}.ns-metrics{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.ns-metrics>div{padding:12px 8px;gap:7px}.ns-metrics>div>span{font-size:10px}.ns-metrics strong{font-size:22px}.ns-metrics strong small{display:block;margin-top:5px}.ns-metrics p{display:none}.ns-panel{padding:14px}.ns-panel-head{gap:6px}.ns-unit{display:none}.ns-chart-track{height:110px;width:22px}.ns-chart-day{grid-template-rows:18px 110px 18px}.ns-calendar-day{min-height:32px}.ns-calendar{gap:6px}.ns-metrics>div:nth-child(4){grid-column:1/-1;display:flex;align-items:center;justify-content:space-between}.ns-metrics>div:nth-child(4) strong small{display:inline-block}}

.np-page .np-main-grid.np-daily-only{grid-template-columns:minmax(0,1fr)}
.np-page .np-day-achievement{display:grid;grid-template-columns:62px minmax(0,1fr) auto;align-items:center;gap:12px 18px;margin:0 0 16px;padding:16px 20px;border:1px solid var(--border);border-radius:14px;background:var(--panel);box-shadow:none;direction:rtl}
.np-day-ring{width:62px;height:62px;position:relative;display:grid;place-items:center;color:var(--text)}.np-day-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}.np-day-ring circle{fill:none;stroke-width:5;stroke-linecap:round}.np-day-ring-track{stroke:var(--border)}.np-day-ring-fill{stroke:var(--text);opacity:.8}.np-day-ring strong{font-size:17px;font-weight:650;font-variant-numeric:tabular-nums}
.np-day-achievement-copy{min-width:0}.np-day-achievement-copy h2{font-size:18px;margin:0 0 5px;line-height:1.5;font-weight:650}.np-day-achievement-copy h2 small{font-size:10px;font-weight:400;color:var(--muted);margin-inline-start:6px}.np-day-achievement-copy p{font-size:12px;color:var(--muted);margin:0;line-height:1.75}.np-day-remaining{display:grid;justify-items:center;gap:3px;padding-inline-start:18px;border-inline-start:1px solid var(--border)}.np-day-remaining strong{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}.np-day-remaining span{font-size:10px;color:var(--muted)}
.np-day-context{grid-column:1/-1;display:grid;grid-template-columns:minmax(160px,.6fr) minmax(0,2fr);gap:18px;padding-top:13px;border-top:1px solid var(--border);min-width:0}
.np-yesterday{display:grid;grid-template-columns:minmax(0,1fr) auto;align-content:start;gap:7px;padding:4px 0 4px 16px;border:0;border-inline-end:1px solid var(--border);border-radius:0;background:none;min-width:0;align-self:start}.np-yesterday-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;font-weight:600}.np-yesterday-heading time{font-size:10px;color:var(--muted);font-weight:400}.np-yesterday-score{grid-column:2;grid-row:1/3;align-self:center;margin:0}.np-yesterday-score>strong{font-size:23px;line-height:1.3;font-weight:600;font-variant-numeric:tabular-nums}.np-yesterday-score>span{display:none}.np-yesterday>p{grid-column:1;font-size:10px;line-height:1.7;color:var(--muted);margin:0}.np-yesterday-details{grid-column:1/-1;font-size:10px;margin:0}.np-yesterday-details summary{cursor:pointer;color:var(--muted);width:fit-content}.np-yesterday-details summary:hover{color:var(--text)}.np-yesterday-details ul{list-style:none;padding:0;margin:8px 0 0;max-height:170px;overflow:auto;overscroll-behavior:contain}.np-yesterday-details li{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--border)}.np-yesterday-details li>span{min-width:0;overflow-wrap:anywhere;font-size:11px}.np-yesterday-details li small{display:block;font-size:9px;color:var(--muted);margin-top:3px;font-weight:400}.np-yesterday-details li>strong{flex-shrink:0;font-size:12px;font-variant-numeric:tabular-nums}
.np-week-achievement{min-width:0}.np-week-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px}.np-week-heading h3{margin:0;font-size:12px;font-weight:600}.np-week-heading>span{font-size:10px;color:var(--muted);font-variant-numeric:tabular-nums}.np-week-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}.np-week-day{display:grid;justify-items:center;align-content:start;gap:5px;padding:6px 2px;min-width:0;border:0;border-radius:0;font-variant-numeric:tabular-nums}.np-week-day+.np-week-day{border-inline-start:1px solid var(--border)}.np-week-day.is-today{background:var(--panel-soft);border-radius:6px}.np-week-name{font-size:10px;font-weight:400;white-space:nowrap;color:var(--muted)}.np-week-value{height:23px;display:grid;place-items:center;width:100%}.np-week-value strong{font-size:14px;font-weight:600;color:var(--text)}.np-week-day time{font-size:9px;color:var(--muted);white-space:nowrap}.np-week-day>small{font-size:9px;color:var(--muted);min-height:11px;white-space:nowrap}.np-week-day.is-today>small{color:var(--text);font-weight:600}.np-week-day.is-future .np-week-name,.np-week-day.is-future time{opacity:.7}
@media(max-width:700px){.np-page .np-day-achievement{grid-template-columns:54px minmax(0,1fr) auto;padding:14px;gap:12px;border-radius:12px}.np-day-ring{width:54px;height:54px}.np-day-ring strong{font-size:15px}.np-day-achievement-copy h2{font-size:16px;margin-bottom:3px}.np-day-achievement-copy p{font-size:11px}.np-day-achievement-copy h2 small{font-size:9px}.np-day-remaining{padding-inline-start:10px}.np-day-remaining strong{font-size:19px}.np-day-remaining span{font-size:9px}.np-day-context{grid-template-columns:minmax(0,1fr);gap:12px;padding-top:12px}.np-yesterday{grid-template-columns:auto auto minmax(0,1fr);gap:6px 12px;align-items:center;padding:0 0 10px;border-inline-end:0;border-bottom:1px solid var(--border)}.np-yesterday-heading{justify-content:start;font-size:11px}.np-yesterday-heading time{display:none}.np-yesterday-score{grid-column:2;grid-row:1;align-self:center}.np-yesterday-score>strong{font-size:18px}.np-yesterday>p{grid-column:3;font-size:10px;text-align:end}.np-yesterday-details{grid-column:1/-1}.np-week-day{padding:5px 1px;gap:4px}.np-week-name{font-size:9px}.np-week-value strong{font-size:12px}.np-week-day time,.np-week-day>small{font-size:9px}.np-week-heading h3{font-size:11px}}

.np-order-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}.np-order-tabs [aria-pressed=true]{background:#e7ecee;color:#183b56;font-weight:700}.np-order-list{list-style:none;padding:0;margin:0;display:grid;gap:8px}.np-order-list li{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #dce3e8;padding:10px 0}.np-order-list li>span{min-width:0;overflow-wrap:anywhere}.np-order-list li>div{display:flex;gap:6px;flex-shrink:0}.np-order-list button{min-width:44px;min-height:44px}.np-order-list button:disabled{opacity:.4;cursor:default}
/* NOOR_HABIT_TRACKER_CARDS_R76: category groups with independent completion and note controls. */
.np-page .np-category-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}
.np-page .np-habit-category{padding:0;border-radius:22px;border-color:var(--border);background:var(--panel);box-shadow:0 7px 24px rgba(32,55,67,.055);overflow:hidden}
.np-page .np-habit-category>.np-category-head{padding:14px 16px 12px;margin:0;gap:12px;min-height:76px}
.np-page .np-habit-category .np-category-heading{display:grid;grid-template-columns:36px minmax(0,1fr);column-gap:10px;row-gap:3px;align-items:center;min-width:0}
.np-page .np-category-symbol{grid-column:1;grid-row:1 / 3;display:grid;place-items:center;width:36px;height:36px;border-radius:12px;background:var(--panel-soft);border:1px solid var(--border);color:#527485}
.np-page .np-category-symbol svg{width:20px;height:20px}
.np-page .np-habit-category .np-category-title{grid-column:2;margin:0;color:var(--text);font-size:17px;line-height:1.55;font-weight:750;overflow-wrap:anywhere}
.np-page .np-habit-category .np-category-count{grid-column:2;padding:0;background:none;border-radius:0;color:var(--muted);font-size:12px;line-height:1.6}
.np-page .np-habit-category .np-category-progress{width:54px;height:54px;flex:0 0 54px}
.np-page .np-habit-category .np-category-progress>span{color:var(--text);font-size:15px;font-weight:700}
.np-page .np-habit-category .np-category-progress small{font-size:10px}
.np-page .np-habit-category .np-ring-track{stroke:var(--border)}
.np-page .np-habit-category>.np-list{gap:0;padding:0 12px 6px}
.np-page .np-habit-category .np-habit-row{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:6px;min-width:0;min-height:54px;padding:4px 0;margin:0;border:0;border-top:1px solid var(--border);border-radius:0;background:transparent;box-shadow:none;direction:rtl}
.np-page .np-habit-row>.np-item-main{grid-column:2;grid-row:1;min-width:0}
.np-page .np-habit-row .np-item-title{color:var(--text);font-size:14px;font-weight:650;line-height:1.65;overflow-wrap:anywhere}
.np-page .np-habit-row .np-item-meta{gap:0;margin-top:3px;font-size:12px;line-height:1.5;color:var(--muted)}
.np-page .np-habit-row .np-kind-badge{display:none}
.np-page .np-habit-row .np-activity-actions{display:contents}
.np-page .np-habit-row .np-habit-check-target{grid-column:1;grid-row:1;justify-self:center;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;margin:0;padding:0}
.np-page .np-habit-row .np-btn.np-pencil{grid-column:3;grid-row:1;justify-self:center;align-self:center;width:24px;min-width:24px;height:24px;min-height:24px;border-radius:7px;border-color:#b9c8ce;background:#f5f8f8;color:#526f7c;padding:0;margin:0}
.np-page .np-habit-row .np-btn.np-pencil svg{width:15px;height:15px}
.np-page .np-habit-row .np-btn.np-pencil::before{content:"";display:block;position:absolute;inset:-10px;border-radius:12px;z-index:-1}
.np-page .np-habit-row .np-habit-check{width:24px;min-width:24px;height:24px;min-height:24px;flex:0 0 24px;border-radius:7px;border-color:#b9c8ce;background-color:#f5f8f8}
.np-page .np-habit-row .np-habit-check:checked{border-color:#287b65;background-color:#287b65}
.np-page .np-habit-row.is-completed .np-item-title{color:#287b65}
.np-page .np-habit-row.is-completed .np-item-meta{color:#468471}
.np-page .np-habit-row .np-activity-note{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;margin:3px 0 0;padding:4px 8px;border-inline-start:2px solid #bed3cb;border-radius:0 5px 5px 0;background:var(--panel-soft);color:var(--muted);font-size:12px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.np-page .np-habit-row .np-progress-copy{font-size:12px;line-height:1.6;margin-top:6px}
.np-page[data-appearance=dark] .np-habit-row .np-btn.np-pencil,.np-page[data-appearance=dark] .np-habit-row .np-habit-check:not(:checked){background-color:#263744;border-color:#64808d;color:#c1d5de}
.np-page[data-appearance=dark] .np-habit-row.is-completed .np-item-title,.np-page[data-appearance=dark] .np-habit-row.is-completed .np-item-meta{color:#8bd0b4}
.np-page[data-appearance=dark] .np-category-symbol{color:#b5ccd6}
@media(max-width:600px){
 .np-page .np-category-grid{grid-template-columns:1fr;gap:12px}
 .np-page .np-habit-category>.np-category-head{padding:12px 14px 10px;min-height:70px}
 .np-page .np-habit-category .np-category-title{font-size:16px}
 .np-page .np-habit-category>.np-list{padding:0 8px 8px}
 .np-page .np-habit-category .np-habit-row{gap:4px;min-height:54px;padding:4px 0}
 .np-page .np-habit-row .np-item-title{font-size:14px}
}

/* NOOR_MANAGEMENT_R77 */
.np-category-editor{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:20px}.np-category-editor .np-input{flex:1;min-width:160px}.np-category-registry{display:grid;gap:8px}.np-category-registry>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border);border-radius:12px}.np-category-registry span{overflow-wrap:anywhere}.np-form small{line-height:1.7}.np-form .np-weekday{font-size:13px;min-height:40px}.np-form .np-weekday input{width:18px;height:18px}

/* NOOR_DEBT_REGISTER_R77 */
.nf-debt-totals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.nf-debt-totals article{padding:14px;border:1px solid var(--border);background:var(--panel-soft);border-radius:14px}.nf-debt-totals h3{font-size:14px}.nf-debt-totals dl{display:grid;grid-template-columns:1fr auto;gap:7px;margin:12px 0 0;font-size:12px}.nf-debt-totals dd{margin:0;font-variant-numeric:tabular-nums}.nf-debt-scroll{max-width:100%;overflow:auto;border:1px solid var(--border);border-radius:15px}.nf-debt-table{width:100%;border-collapse:collapse;min-width:1040px;font-size:12px;text-align:right}.nf-debt-table caption{padding:12px;color:var(--muted);text-align:right;font-size:12px}.nf-debt-table :is(th,td){padding:12px 10px;border-bottom:1px solid var(--border);vertical-align:top;line-height:1.7}.nf-debt-table th{background:var(--panel-soft);font-weight:650}.nf-debt-table td>strong,.nf-debt-table time{display:block;white-space:nowrap;font-variant-numeric:tabular-nums}.nf-debt-table td:first-child strong{white-space:normal;min-width:100px}.nf-debt-table p{margin:4px 0;max-width:220px;white-space:pre-wrap}.nf-debt-table .nf-button{font-size:12px;min-height:36px;padding:6px 9px;margin-top:6px}.nf-debt-table details{margin-top:10px}.nf-debt-table summary{cursor:pointer;color:var(--muted)}.nf-debt-table details>div{padding:8px 0;border-bottom:1px solid var(--border)}.nf-payment-state{display:inline-block;padding:4px 7px;border-radius:7px;background:#edf1f4;color:#526c7e;font-size:11px}.nf-payment-state.paid{background:#e4f4eb;color:#26704f}.nf-payment-state.partial{background:#fff2d9;color:#8a6018}.nf-payment-state.overdue{background:#fff0ed;color:#a1493b}
@media(max-width:700px){.nf-debt-totals{grid-template-columns:1fr}.nf-debt-scroll{border:0;overflow:visible}.nf-debt-table{min-width:0;display:block}.nf-debt-table caption{display:block;padding:8px 0}.nf-debt-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.nf-debt-table tbody{display:grid;gap:12px}.nf-debt-table tr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:10px;border:1px solid var(--border);border-radius:16px;background:var(--panel)}.nf-debt-table td{display:block;min-width:0;padding:8px;border:0;overflow-wrap:anywhere}.nf-debt-table td::before{content:attr(data-label);display:block;color:var(--muted);font-size:11px;margin-bottom:4px}.nf-debt-table td:first-child,.nf-debt-table td:last-child{grid-column:1/-1}.nf-debt-table td:first-child::before{display:none}.nf-debt-table td>strong,.nf-debt-table time{white-space:normal}.nf-debt-table p{max-width:none}.nf-debt-table .nf-button{min-height:44px}.nf-debt-table details{padding-top:10px}}

/* NOOR_PEOPLE_GREGORIAN_DELETE_R78 */
.nf-payment-column{display:grid;gap:7px}.nf-payment-column>strong,.nf-payment-column>time{display:block;min-height:20px;white-space:nowrap;font-variant-numeric:tabular-nums}
.np-gregorian-date{border:0;padding:0;margin:0;min-width:0;align-content:start}.np-gregorian-date legend{padding:0;margin-bottom:7px}.np-gregorian-parts{display:grid;grid-template-columns:minmax(0,.75fr) minmax(0,1.35fr) minmax(0,1fr);gap:5px}.np-gregorian-parts select{box-sizing:border-box;width:100%;min-width:0;max-width:100%;font:inherit;font-size:14px;border:1px solid #d5dfe5;border-radius:9px;padding:9px 4px;background:#fff;color:#183b56;min-height:42px}.np-gregorian-hint{font-size:11px;color:#6b7f92;line-height:1.6}.np-date-clear{justify-self:start;background:transparent;border:0;font:inherit;color:#526e80;font-size:12px;padding:4px;cursor:pointer}.np-page[data-appearance=dark] .np-gregorian-parts select{background:#18232e;color:#e2eaf2;border-color:#4b5f70}
.np-delete-backdrop{position:fixed;inset:0;z-index:11000;display:flex;align-items:center;justify-content:center;padding:16px;background:#102a4366;direction:rtl;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif;box-sizing:border-box}.np-delete-dialog,.np-delete-dialog *{box-sizing:border-box}.np-delete-dialog{width:min(100%,440px);max-height:calc(100dvh - 32px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #e2e6e9;border-radius:20px;background:#fff;color:#183b56;box-shadow:0 22px 70px #102a4333}.np-delete-dialog header{padding:14px 18px;display:flex;gap:10px;justify-content:space-between;align-items:center;flex:0 0 auto;border-bottom:1px solid #e9edef}.np-delete-dialog h2{font-size:20px;margin:0}.np-delete-dialog header button{width:44px;height:44px;border:0;border-radius:12px;background:#f1f4f6;color:#526e80;font-size:24px;cursor:pointer}.np-delete-dialog form{display:flex;flex-direction:column;min-height:0;overflow:hidden;margin:0}.np-delete-body{overflow:auto;min-height:0;padding:18px;overscroll-behavior:contain}.np-delete-body>strong{display:block;font-size:16px;overflow-wrap:anywhere}.np-delete-body p{font-size:14px;line-height:1.8;margin:12px 0;overflow-wrap:anywhere}.np-delete-body label{display:block;font-size:14px;margin:14px 0 8px}.np-delete-body input{width:100%;padding:10px 12px;border:1px solid #d7dfe5;border-radius:10px;font:inherit;font-size:16px;color:#183b56;background:#fff}.np-delete-body [role=alert]{color:#ad493b}.np-delete-dialog footer{display:flex;gap:10px;padding:14px 18px;border-top:1px solid #e9edef;flex:0 0 auto;background:#fff}.np-delete-dialog footer button{flex:1;min-height:44px;font:inherit;font-size:13px;border-radius:10px;border:1px solid #d6dfe5;padding:9px;cursor:pointer}.np-delete-dialog .cancel{background:#f3f6f8;color:#37556b}.np-delete-dialog .confirm{background:#af423a;border-color:#af423a;color:white}.np-delete-dialog button:disabled{opacity:.45;cursor:not-allowed}.np-delete-dialog :is(button,input):focus-visible{outline:3px solid #83b8d1;outline-offset:2px}
.nf-person-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin:16px 0}.nf-person{display:grid;gap:9px;padding:18px;border:1px solid var(--border);border-radius:18px;background:var(--panel);color:var(--text);font:inherit;text-align:right;cursor:pointer;min-width:0}.nf-person strong{font-size:17px;overflow-wrap:anywhere}.nf-person span,.nf-person small{font-size:12px;line-height:1.8;color:var(--muted);overflow-wrap:anywhere}.nf-person:hover{border-color:#8fafb7}.nf-debt-filters{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.nf-age-cell{font-variant-numeric:tabular-nums}.nf-age-cell.age-yellow{background:#fff7cf;color:#755d00}.nf-age-cell.age-orange{background:#ffe8c7;color:#895318}.nf-age-cell.age-red{background:#ffe3df;color:#963f34}.nf-age-cell.age-paid{background:#e0f4e7;color:#26714e}.np-page[data-appearance=dark] .nf-age-cell.age-yellow{background:#4a4226;color:#f5dfa4}.np-page[data-appearance=dark] .nf-age-cell.age-orange{background:#4f3b25;color:#f4c990}.np-page[data-appearance=dark] .nf-age-cell.age-red{background:#50302d;color:#ffc3b9}.np-page[data-appearance=dark] .nf-age-cell.age-paid{background:#23453a;color:#a0dcc0}
@media(max-width:700px){.nf-person-grid{grid-template-columns:1fr}.nf-debt-table td:nth-child(10),.nf-debt-table td:nth-child(11){grid-column:1/-1}.nf-debt-table td:first-child,.nf-debt-table td:last-child{grid-column:1/-1}.nf-age-cell{border-radius:8px}.np-delete-backdrop{padding:12px}.np-delete-dialog{max-height:calc(100dvh - 24px)}.np-gregorian-parts select{font-size:16px;min-height:44px}}

/* NOOR_LEDGER_DESIGN_R80 */
.nf-person-card{border:1px solid var(--border);border-radius:18px;background:var(--panel);overflow:hidden;min-width:0;display:flex;flex-direction:column;transition:border-color .18s,box-shadow .18s}.nf-person-card:hover{border-color:#91acb9;box-shadow:0 8px 24px #183b560b}.nf-person-card .nf-person{width:100%;border:0;border-radius:0;background:transparent;flex:1;padding:20px;gap:10px;box-shadow:none}.nf-person-card .nf-person strong{font-size:18px}.nf-person-card .nf-person-open{color:var(--text);font-size:13px;font-weight:600;margin-top:6px}.nf-person-card-actions{border-top:1px solid var(--border);padding:8px 14px;background:var(--panel-soft);display:flex;justify-content:flex-end}.nf-person-card-actions .nf-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;font-size:13px;margin:0}.nf-person-card :is(button):focus-visible{outline:3px solid #68a9c7;outline-offset:-4px}.nf-debt-register .nf-list-heading{align-items:center;gap:16px;flex-wrap:wrap}.nf-debt-register .nf-list-heading>div:last-child{display:flex;gap:8px;flex-wrap:wrap}.nf-ledger-guide{font-size:12px;color:var(--muted);margin:12px 0}.nf-ledger-guide>summary{cursor:pointer;min-height:32px;display:list-item;align-content:center}.nf-debt-filters>input{flex:1;min-width:160px}.nf-debt-filters>select{min-width:140px}.nf-debt-register .nf-debt-totals{grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}.nf-debt-register .nf-debt-totals article{padding:16px;background:var(--panel);border-radius:16px}.nf-debt-register .nf-debt-totals dd{font-size:14px;font-weight:600}.nf-debt-register .nf-debt-totals dt{color:var(--muted)}
.nf-ledger-table{min-width:940px;font-size:13px;border-collapse:separate;border-spacing:0}.nf-ledger-table caption{padding:18px;text-align:right;color:var(--text);font-size:15px;font-weight:650;background:var(--panel)}.nf-ledger-table caption>span{display:block;font-size:12px;color:var(--muted);font-weight:400;margin-top:5px}.nf-ledger-table th{font-size:12px;padding:13px 16px;color:var(--muted);white-space:nowrap;border-top:1px solid var(--border);background:var(--panel-soft)}.nf-ledger-table td{padding:20px 16px;vertical-align:top;background:var(--panel);border-bottom:1px solid var(--border)}.nf-ledger-table tbody tr:last-child td{border-bottom:0}.nf-ledger-table tbody tr:hover td{background:var(--panel-soft)}.nf-ledger-table td:first-child strong{min-width:90px;max-width:150px;font-size:14px;overflow-wrap:anywhere}.nf-ledger-table td>small{display:block;font-size:11px;color:var(--muted);margin-top:7px;line-height:1.8}.nf-ledger-table .nf-ledger-money{font-size:14px;font-weight:650;line-height:1.6;font-variant-numeric:tabular-nums}.nf-ledger-table .nf-ledger-remaining{color:var(--text);font-size:15px}.nf-ledger-table .nf-ledger-date{display:block;font-size:11px;color:var(--muted);margin-top:7px;white-space:nowrap;unicode-bidi:plaintext}.nf-ledger-table .nf-badge{display:inline-block;margin-top:7px}.nf-ledger-table .nf-payment-state{margin-top:8px;font-size:11px;white-space:nowrap}.nf-ledger-age{display:inline-block;padding:7px 10px;border-radius:9px;line-height:1.7;font-size:12px;font-weight:600}.nf-ledger-age.age-yellow{background:#fff7d9;color:#79611e}.nf-ledger-age.age-orange{background:#ffecd5;color:#8b561c}.nf-ledger-age.age-red{background:#fbe7e3;color:#983e35}.nf-ledger-age.age-paid{background:#e3f4eb;color:#28694a}.nf-ledger-note{min-width:160px;max-width:240px}.nf-ledger-note p{margin:0!important;font-size:12px;line-height:1.9;overflow-wrap:anywhere}.nf-ledger-table .nf-ledger-payments{margin-top:10px}.nf-ledger-payments summary{font-size:11px;padding:4px 0}.nf-ledger-payments ol{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:8px}.nf-ledger-payments li{padding:9px;border:1px solid var(--border);border-radius:9px;min-width:150px}.nf-ledger-payments li>div{display:grid;gap:3px}.nf-ledger-payments strong{font-size:12px;white-space:nowrap}.nf-ledger-payments time{font-size:11px;color:var(--muted)}.nf-ledger-payments p{font-size:11px;overflow-wrap:anywhere}.nf-ledger-table .nf-ledger-actions .nf-button{min-height:44px;padding:9px 12px;margin:0;white-space:nowrap}.np-page[data-appearance=dark] .nf-ledger-age.age-yellow{background:#4a4226;color:#f5dfa4}.np-page[data-appearance=dark] .nf-ledger-age.age-orange{background:#4f3b25;color:#f4c990}.np-page[data-appearance=dark] .nf-ledger-age.age-red{background:#50302d;color:#ffc3b9}.np-page[data-appearance=dark] .nf-ledger-age.age-paid{background:#23453a;color:#a0dcc0}
@media(max-width:700px){.nf-debt-register .nf-list-heading>div:last-child{width:100%}.nf-debt-register .nf-list-heading>div:last-child>.nf-button{flex:1;min-height:44px}.nf-debt-filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.nf-debt-filters>input{grid-column:1/-1}.nf-debt-filters>:is(input,select){min-width:0;width:100%;font-size:16px;min-height:44px;box-sizing:border-box}.nf-ledger-table{min-width:0;display:block}.nf-ledger-table caption{padding:12px 0;background:transparent}.nf-ledger-table tbody{display:grid;gap:16px}.nf-ledger-table tr{padding:0;gap:0;overflow:hidden;border-radius:18px;border:1px solid var(--border)}.nf-ledger-table td{padding:14px;max-width:none;border:0;border-bottom:1px solid var(--border);min-width:0;grid-column:auto}.nf-ledger-table td:nth-child(n){grid-column:auto}.nf-ledger-table td:first-child{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--panel-soft)}.nf-ledger-table td:first-child strong{min-width:0;max-width:none;font-size:15px}.nf-ledger-table td:first-child .nf-badge{margin:0}.nf-ledger-table td:nth-child(6),.nf-ledger-table td:last-child{grid-column:1/-1}.nf-ledger-table td::before{font-size:11px;margin-bottom:7px}.nf-ledger-table td:last-child{border-bottom:0;display:flex;justify-content:flex-end}.nf-ledger-table td:last-child::before{display:none}.nf-ledger-table .nf-ledger-money{font-size:14px;white-space:normal;overflow-wrap:anywhere}.nf-ledger-table .nf-ledger-date{font-size:11px;white-space:normal;overflow-wrap:anywhere}.nf-ledger-payments li{min-width:0}.nf-ledger-table .nf-ledger-actions .nf-button{width:100%}.nf-ledger-table tbody tr:hover td{background:var(--panel)}.nf-ledger-table tbody tr:hover td:first-child{background:var(--panel-soft)}}

/* NOOR_LOCAL_R82 */
.np-habit-time{display:inline-block;font-size:13px;font-weight:600;color:var(--muted);font-variant-numeric:tabular-nums;margin:3px 0}.np-unscheduled{opacity:.7;display:flex;justify-content:space-between;align-items:center;gap:12px}.np-unscheduled small{display:block;font-size:12px;line-height:1.8;color:var(--muted)}.np-unscheduled input{width:20px;height:20px;flex:0 0 auto}.nf-person-card-actions{flex-wrap:wrap}.nf-ledger-actions{display:flex;flex-wrap:wrap;gap:8px}.np-save-notices{position:fixed;inset-inline-end:16px;bottom:max(16px,env(safe-area-inset-bottom));z-index:9999;width:min(420px,calc(100vw - 32px));max-height:35dvh;overflow:auto;pointer-events:none}.np-save-notices>*{pointer-events:auto;box-shadow:0 6px 24px #10203320}.np-save-notices:empty{display:none}
.np-pending-save,.np-failed-save{padding:12px 16px;margin:12px 0;border-radius:12px;background:var(--panel);border:1px solid var(--border);font-size:13px;line-height:1.8}.np-failed-save{border-color:#d9a08c}.np-failed-save button{min-height:44px;margin-inline-start:12px;padding:8px 12px;border-radius:9px;border:1px solid var(--border);background:var(--panel-soft);color:var(--text);font:inherit}

/* NOOR_CHECKBOX_INSTANT_R83 */
.np-habit-check[aria-busy=true]:not(:disabled){opacity:1;cursor:pointer}

/* NOOR_R100_PERSONAL_LOADING_START: quiet full-viewport waiting state */
.np-page.np-page-entry-loading {
  min-height:100vh;
  min-height:100dvh;
  background:#f7f4ee;
}
.np-page.np-page-entry-loading::before { display:none; }
.np-page.np-page-entry-loading > .np-wrap {
  width:100%;max-width:none;min-height:100vh;min-height:100dvh;
  margin:0;padding:0;display:grid;place-items:center;
}
.np-page .np-entry-loading {
  width:100%;min-height:100vh;min-height:100dvh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:32px 24px;text-align:center;background:#f7f4ee;
  color:#102a43;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,Tahoma,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.np-page .np-entry-loading-logo {
  display:block;width:66px;height:66px;object-fit:cover;object-position:center;
  border-radius:50%;margin:0 0 24px;border:1px solid rgba(184,134,43,.22);
  box-shadow:0 2px 12px rgba(16,42,67,.035);
}
.np-page .np-entry-loading-title {
  font-size:clamp(19px,4vw,22px);font-weight:650;line-height:1.55;
  letter-spacing:0;margin:0;color:#102a43;
}
.np-page .np-entry-loading-copy {
  font-size:14px;font-weight:400;line-height:1.8;
  margin:8px 0 0;color:#6b7f92;
}
.np-page .np-entry-loading-spinner {
  display:block;width:22px;height:22px;box-sizing:border-box;
  margin-top:24px;border-radius:50%;border:2px solid rgba(16,42,67,.12);
  border-top-color:#6b7f92;animation:np-entry-loading-spin 900ms linear infinite;
}
.np-page .np-entry-loading-content {
  display:flex;flex-direction:column;align-items:center;
  /* R101: do not restart the entrance animation after route authorization. */
  animation:none;
}
.np-page.np-page-entry-ready > .np-wrap {
  animation:np-entry-ready-appear 360ms cubic-bezier(.22,1,.36,1) both;
}
@keyframes np-entry-loading-spin { to { transform:rotate(360deg); } }
@keyframes np-entry-loading-appear {
  from { opacity:0;transform:translateY(6px); }
  to { opacity:1;transform:translateY(0); }
}
@keyframes np-entry-ready-appear {
  from { opacity:0;transform:translateY(6px); }
  to { opacity:1;transform:translateY(0); }
}
@media (prefers-reduced-motion:reduce) {
  .np-page .np-entry-loading-spinner,
  .np-page .np-entry-loading-content,
  .np-page.np-page-entry-ready > .np-wrap { animation:none; }
}
/* NOOR_R100_PERSONAL_LOADING_END */

/* NOOR_R102_UNIFIED_LOADING_GEOMETRY_BEGIN */
.noor-entry-screen,
.np-page .np-entry-loading {
  position: fixed;
  inset: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: 24px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #f7f4ee;
  color: #102a43;
  text-align: center;
  direction: rtl;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, Tahoma, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  opacity: 1;
  transform: none;
  animation: none;
}
.noor-entry-content,
.np-page .np-entry-loading-content {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 320px;
  margin: 0;
  padding: 0;
  gap: 0;
  opacity: 1;
  transform: none;
  animation: none;
}
.noor-entry-logo,
.np-page .np-entry-loading-logo {
  display: block;
  box-sizing: border-box;
  width: 88px;
  height: 88px;
  flex: 0 0 88px;
  border: 1px solid rgba(184, 134, 43, .22);
  border-radius: 50%;
  object-fit: cover;
  object-position: center;
  margin: 0 0 24px;
  box-shadow: 0 2px 12px rgba(16, 42, 67, .035);
}
.noor-entry-title,
.np-page .np-entry-loading-title {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  color: #102a43;
  font-size: clamp(19px, 4vw, 22px);
  font-weight: 650;
  line-height: 1.55;
  letter-spacing: 0;
}
.noor-entry-status,
.np-page .np-entry-loading-copy {
  box-sizing: border-box;
  margin: 8px 0 0;
  padding: 0;
  color: #6b7f92;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.8;
}
.noor-entry-ring,
.np-page .np-entry-loading-spinner {
  box-sizing: border-box;
  display: block;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  margin: 24px 0 0;
  border: 2px solid rgba(16, 42, 67, .12);
  border-top-color: #6b7f92;
  border-radius: 50%;
}
@media (prefers-reduced-motion: reduce) {
  .noor-entry-ring,
  .np-page .np-entry-loading-spinner { animation: none; }
}
/* NOOR_R102_UNIFIED_LOADING_GEOMETRY_END */

`;


function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function integerValue(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

function executionItems(value: unknown): readonly ExecutionItem[] | null {
  if (!Array.isArray(value)) return null;
  const result: ExecutionItem[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const id = stringValue(item.id);
    const definitionId = stringValue(item.definitionId);
    const title = stringValue(item.title);
    const status = stringValue(item.status);
    const kind = item.kind;
    if (!id || !definitionId || !title || !status || (kind !== "Task" && kind !== "Habit")) return null;
    const weight=isRecord(item.eligibility)?finiteNumber(item.eligibility.weight):finiteNumber(item.weight);result.push({ id, definitionId, title, status, kind,weight:weight!==null&&weight>0?weight:1 });
  }
  return result;
}

function definitionItems(value: unknown): readonly DefinitionItem[] | null {
  if (!Array.isArray(value)) return null;
  const result: DefinitionItem[] = [];
  for (const item of value) {
    if (!isRecord(item) || !isRecord(item.schedule)) return null;
    const id = stringValue(item.id);
    const title = stringValue(item.title);
    const state = stringValue(item.state);
    const kind = item.kind;
    const category = stringValue(item.category) ?? "عام";
    const scheduleKind = item.schedule.kind;
    const startDate = stringValue(item.effectiveFromDate);
    const endDate = item.effectiveUntilDate === undefined ? null : stringValue(item.effectiveUntilDate);
    const importance = stringValue(item.importance) ?? "Supporting";
    if (!id || !title || !state || !startDate || (kind !== "Task" && kind !== "Habit") || (scheduleKind !== "OneTime" && scheduleKind !== "Daily" && scheduleKind !== "Weekdays")) return null;
    const weekdays = scheduleKind === "Weekdays" && Array.isArray(item.schedule.weekdays)
      ? item.schedule.weekdays.filter((day): day is number => typeof day === "number" && Number.isInteger(day))
      : [];
    const measurement=isRecord(item.measurement) && typeof item.measurement.target==="number" && Number.isFinite(item.measurement.target) && item.measurement.target>0 && typeof item.measurement.unit==="string" ? {target:item.measurement.target,unit:item.measurement.unit} : undefined;
    const activityLog: ActivityEntry[] = Array.isArray(item.activityLog) ? item.activityLog.filter((e): e is ActivityEntry => isRecord(e) && typeof e.id==="string" && typeof e.executionId==="string" && typeof e.at==="string" && typeof e.localDate==="string" && typeof e.note==="string" && typeof e.amount==="number" && Number.isFinite(e.amount) && [null,"achieved","expired","cancelled"].includes(e.endReason as null)) : [];
    result.push({ weight:typeof item.weight==="number"&&item.weight>0?item.weight:1,...(typeof item.displayOrder==='number'&&Number.isSafeInteger(item.displayOrder)?{displayOrder:item.displayOrder}:{}),...(typeof item.timeOfDay==='string'?{timeOfDay:item.timeOfDay}:{}),id, revisionId:stringValue(item.revisionId)??"", title, state, kind, category, scheduleKind, weekdays, startDate, endDate, importance, ...(measurement?{measurement}:{}), activityLog });
  }
  return result;
}

function periodInsight(value: unknown): PeriodInsight | null {
  if (!isRecord(value)) return null;
  const windowDays = integerValue(value.windowDays);
  const scheduled = integerValue(value.scheduled);
  const completed = integerValue(value.completed);
  const completionRate = finiteNumber(value.completionRate);
  const successfulDays = integerValue(value.successfulDays);
  return windowDays === null || scheduled === null || completed === null || completionRate === null || successfulDays === null
    ? null
    : { windowDays, scheduled, completed, completionRate, successfulDays };
}

function buildWorkspaceViewModel(workspace: unknown): WorkspaceViewModel | null {
  if (!isRecord(workspace)) return null;
  const definitions = definitionItems(workspace.definitions);
  const insights = isRecord(workspace.insights) ? workspace.insights : null;
  const periods = insights && isRecord(insights.periods) ? insights.periods : null;
  if (!definitions || !insights || !periods) return null;
  const week = periodInsight(periods.week);
  const month = periodInsight(periods.month);
  const quarter = periodInsight(periods.quarter);
  const year = periodInsight(periods.year);
  const currentStreakDays = integerValue(insights.currentStreakDays);
  const bestStreakDays = integerValue(insights.bestStreakDays);
  if (!week || !month || !quarter || !year || currentStreakDays === null || bestStreakDays === null) return null;
  let finance:FinanceLedger|null=null;
  if(workspace.finance===undefined)finance={userId:"",currency:"SAR",accounts:[],debts:[],entries:[],requests:[]};
  else if(isRecord(workspace.finance)&&workspace.finance.currency==="SAR"&&Array.isArray(workspace.finance.accounts)&&Array.isArray(workspace.finance.debts)&&Array.isArray(workspace.finance.entries)&&Array.isArray(workspace.finance.requests)){
    try{financeSummary(workspace.finance as unknown as FinanceLedger);finance=workspace.finance as unknown as FinanceLedger;}catch{finance=null;}
  }
  const stats=isRecord(workspace.statistics)?workspace.statistics:null;
  return { statistics:{currentDate:stats?stringValue(stats.currentDate):null,rows:parseStatisticRows(stats?.rows)},categories:Array.isArray(workspace.categories)?workspace.categories.filter((c):c is string=>typeof c==="string"): [...new Set([...COMMON_CATEGORIES,...definitions.map(d=>d.category)])], definitions, finance, currentStreakDays, bestStreakDays, periods: { week, month, quarter, year } };
}

function buildViewModel(today: unknown): TodayViewModel | null {
  if (!isRecord(today)) return null;
  const personalDay = isRecord(today.personalDay) ? today.personalDay : null;
  const boundary = personalDay && isRecord(personalDay.boundary) ? personalDay.boundary : null;
  const islamicContext = isRecord(today.islamicContext) ? today.islamicContext : null;
  const rawPrayerTimes = islamicContext && isRecord(islamicContext.prayerTimes) ? islamicContext.prayerTimes : null;
  const timeZone = boundary ? stringValue(boundary.timeZone) : null;
  if (!timeZone) return null;
  const tasks = executionItems(today.tasks);
  const habits = executionItems(today.habits);
  if (!tasks || !habits) return null;
  const prayerDefinition = [["fajr","الفجر"],["sunrise","الشروق"],["dhuhr","الظهر"],["asr","العصر"],["maghrib","المغرب"],["isha","العشاء"]] as const;
  const prayerTimes = rawPrayerTimes
    ? prayerDefinition.flatMap(([key,label]) => {
        const at = stringValue(rawPrayerTimes[key]);
        return at ? [{ key, label, at }] : [];
      })
    : [];
  let nextPrayer: TodayViewModel["nextPrayer"] = null;
  if (isRecord(today.nextPrayer)) {
    const name = stringValue(today.nextPrayer.name);
    const at = stringValue(today.nextPrayer.at);
    if (name && at) nextPrayer = { name, at };
  }
  return {
    timeZone,
    localDate:boundary&&validStatisticDate(boundary.localDate)?boundary.localDate:null,
    personalDayState: personalDay ? stringValue(personalDay.state) ?? "Open" : "Open",
    nextPrayer,
    prayerTimes,
    tasks,
    habits,
  };
}

function arabicNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { useGrouping: false }).format(value);
}

function datePart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find(part => part.type === type)?.value ?? "";
}

export function civilLocalDate(nowMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat(
    "en-CA-u-ca-gregory-nu-latn",
    { year: "numeric", month: "2-digit", day: "2-digit", timeZone },
  ).formatToParts(new Date(nowMs));
  return `${datePart(parts,"year")}-${datePart(parts,"month")}-${datePart(parts,"day")}`;
}

export function civilDateLabels(nowMs: number, timeZone: string): Readonly<{ gregorian: string; hijri: string }> {
  const date = new Date(nowMs);
  const gregorianParts = new Intl.DateTimeFormat(
    "ar-SA-u-ca-gregory-nu-latn",
    { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone },
  ).formatToParts(date);
  const hijriParts = new Intl.DateTimeFormat(
    "ar-SA-u-ca-islamic-umalqura-nu-latn",
    { day: "numeric", month: "long", year: "numeric", timeZone },
  ).formatToParts(date);
  return {
    gregorian: `${datePart(gregorianParts,"weekday")} ${datePart(gregorianParts,"day")} ${datePart(gregorianParts,"month")} ${datePart(gregorianParts,"year")}`.trim(),
    hijri: `${datePart(hijriParts,"day")} ${datePart(hijriParts,"month")} ${datePart(hijriParts,"year")} هـ`.trim(),
  };
}

function formatTime(instant: string, timeZone: string): string {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", { hour: "numeric", minute: "2-digit", hour12: true, timeZone }).format(date);
}

export function nightMilestones(prayerTimes: readonly Readonly<{ key: string; label: string; at: string }>[]): Readonly<{ midnight: string; lastThird: string }> | null {
  const maghrib = prayerTimes.find(prayer => prayer.key === "maghrib");
  const fajr = prayerTimes.find(prayer => prayer.key === "fajr");
  if (!maghrib || !fajr) return null;
  const maghribMs = new Date(maghrib.at).getTime();
  let nextFajrMs = new Date(fajr.at).getTime();
  if (!Number.isFinite(maghribMs) || !Number.isFinite(nextFajrMs)) return null;
  while (nextFajrMs <= maghribMs) nextFajrMs += 24 * 60 * 60 * 1000;
  const nightDuration = nextFajrMs - maghribMs;
  return {
    midnight: new Date(maghribMs + nightDuration / 2).toISOString(),
    lastThird: new Date(maghribMs + (nightDuration * 2) / 3).toISOString(),
  };
}

export function nightCountdownState(prayerTimes: readonly Readonly<{ key: string; label: string; at: string }>[], nowMs: number): Readonly<{ midnight: string; lastThird: string; enabled: boolean }> | null {
  const milestones = nightMilestones(prayerTimes);
  const maghribMs = Date.parse(prayerTimes.find(prayer => prayer.key === "maghrib")?.at ?? "");
  const ishaMs = Date.parse(prayerTimes.find(prayer => prayer.key === "isha")?.at ?? "");
  let fajrMs = Date.parse(prayerTimes.find(prayer => prayer.key === "fajr")?.at ?? "");
  if (!milestones) return null;
  if (![nowMs,maghribMs,ishaMs,fajrMs].every(Number.isFinite)) return { ...milestones, enabled:false };
  const dayMs = 24 * 60 * 60 * 1000;
  while (fajrMs <= maghribMs) fajrMs += dayMs;
  if (ishaMs < maghribMs || ishaMs >= fajrMs) return { ...milestones, enabled:false };
  // Reuse the displayed schedule across civil midnight without opening tonight's counters early.
  const shift = [0,-dayMs,dayMs].find(offset => nowMs >= ishaMs + offset && nowMs < fajrMs + offset);
  const offset = shift ?? 0;
  return {
    midnight:new Date(Date.parse(milestones.midnight) + offset).toISOString(),
    lastThird:new Date(Date.parse(milestones.lastThird) + offset).toISOString(),
    enabled:shift !== undefined,
  };
}

// NOOR_COUNTDOWN_ROLLOVER_R81
export function liveNextPrayer(prayerTimes: readonly Readonly<{key:string;at:string}>[], snapshot: Readonly<{name:string;at:string}>|null, nowMs:number):Readonly<{key:string;at:string}>|null{
 const keys:Record<string,string>={Fajr:'fajr',Dhuhr:'dhuhr',Asr:'asr',Maghrib:'maghrib',Isha:'isha'};
 const candidates=prayerTimes.filter(p=>Object.values(keys).includes(p.key)).map(p=>({key:p.key,at:p.at}));
 if(snapshot&&keys[snapshot.name])candidates.push({key:keys[snapshot.name]!,at:snapshot.at});
 return candidates.filter(p=>Number.isFinite(Date.parse(p.at))&&Date.parse(p.at)>nowMs).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0]??null;
}

export function remainingPrayerSeconds(at: string, nowMs: number): number {
  const target = new Date(at).getTime();
  return Number.isFinite(target) ? Math.max(0, Math.ceil((target - nowMs) / 1000)) : 0;
}

function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${arabicNumber(hours).padStart(2,"0")}:${arabicNumber(minutes).padStart(2,"0")}:${arabicNumber(remainingSeconds).padStart(2,"0")}`;
}

const HEADER_LOCATIONS: Readonly<Record<string, HeaderLocation>> = {
  "Asia/Riyadh": { city:"الرياض", country:"السعودية", latitude:24.7136, longitude:46.6753 },
  "Africa/Cairo": { city:"القاهرة", country:"مصر", latitude:30.0444, longitude:31.2357 },
};

export function headerLocationForTimeZone(timeZone: string): HeaderLocation {
  return HEADER_LOCATIONS[timeZone] ?? {
    city: timeZone.split("/").at(-1)?.replaceAll("_"," ") ?? timeZone,
    country: "",
    latitude: 24.7136,
    longitude: 46.6753,
  };
}

export function formatLiveClock(nowMs: number, timeZone: string): string {
  return new Intl.DateTimeFormat(
    "ar-SA-u-nu-latn",
    { hour:"numeric", minute:"2-digit", second:"2-digit", hour12:true, timeZone },
  ).format(new Date(nowMs));
}


function completedCount(items: readonly ExecutionItem[]): number {
  return items.filter(item => item.status === "Completed").length;
}

function InsightCard({ label, insight }: { label: string; insight: PeriodInsight }): ReactElement {
  return <div className="np-insight"><div className="np-insight-label">{label}</div><div className="np-insight-rate">{arabicNumber(insight.completionRate)}٪</div><div className="np-insight-copy">{arabicNumber(insight.completed)} من {arabicNumber(insight.scheduled)} · {arabicNumber(insight.successfulDays)} أيام ناجحة</div></div>;
}

function scheduleLabel(definition: DefinitionItem): string {
  if (definition.scheduleKind === "OneTime") return `مرة واحدة · ${definition.startDate}`;
  if (definition.scheduleKind === "Daily") return `يوميًا · من ${definition.startDate}${definition.endDate ? ` إلى ${definition.endDate}` : ""}`;
  const labels = definition.weekdays.map(day => WEEKDAYS.find(([id]) => id === day)?.[1]).filter(Boolean).join("، ");
  return `${labels} · من ${definition.startDate}${definition.endDate ? ` إلى ${definition.endDate}` : ""}`;
}

function GregorianDateInput({id,name,label,defaultValue="",required=false,max}:{id:string;name:string;label:string;defaultValue?:string;required?:boolean;max?:string}):ReactElement{
 const initial=/^\d{4}-\d{2}-\d{2}$/.test(defaultValue)?defaultValue.split('-'):['','',''];
 const [parts,setParts]=useState({year:initial[0]??'',month:initial[1]??'',day:initial[2]??''});const first=useRef<HTMLSelectElement>(null);
 const countDays=(year:string,month:string)=>{if(!year||!month)return 31;const date=new Date(0);date.setUTCFullYear(Number(year),Number(month),0);return date.getUTCDate();};
 const change=(key:'day'|'month'|'year',value:string)=>setParts(old=>{const next={...old,[key]:value};if(next.day&&Number(next.day)>countDays(next.year,next.month))next.day=String(countDays(next.year,next.month)).padStart(2,'0');return next;});
 const all=!!(parts.year&&parts.month&&parts.day),any=!!(parts.year||parts.month||parts.day);const value=all?`${parts.year}-${parts.month}-${parts.day}`:'';
 const error=any&&!all?'أكمل اليوم والشهر والسنة.':max&&value>max?'اختر تاريخًا لا يتجاوز الحد المسموح.':'';
 useEffect(()=>{first.current?.setCustomValidity(error);},[error]);
 const yearNow=new Date().getFullYear(),years=[...new Set([...Array.from({length:121},(_,i)=>yearNow-100+i),...(parts.year?[Number(parts.year)]:[])])].sort((a,b)=>a-b);
 const months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
 return <fieldset className="np-field np-gregorian-date"><legend id={`${id}-label`} className="np-label">{label}{required?' *':''}</legend><div className="np-gregorian-parts" role="group" aria-labelledby={`${id}-label`}>
 <select ref={first} aria-label={`${label}: اليوم الميلادي`} required={required} value={parts.day} onChange={e=>change('day',e.currentTarget.value)}><option value="">اليوم</option>{Array.from({length:countDays(parts.year,parts.month)},(_,i)=>String(i+1).padStart(2,'0')).map(day=><option value={day} key={day}>{day}</option>)}</select>
 <select aria-label={`${label}: الشهر الميلادي`} required={required} value={parts.month} onChange={e=>change('month',e.currentTarget.value)}><option value="">الشهر الميلادي</option>{months.map((month,i)=><option value={String(i+1).padStart(2,'0')} key={month}>{month}</option>)}</select>
 <select aria-label={`${label}: السنة الميلادية`} required={required} value={parts.year} onChange={e=>change('year',e.currentTarget.value)}><option value="">السنة</option>{years.map(year=><option value={String(year)} key={year}>{String(year)}</option>)}</select></div>
 <input id={id} name={name} type="hidden" value={value} required={required} readOnly/><small className="np-gregorian-hint">{error||'التاريخ الميلادي'}{value?<bdi dir="ltr"> · {value}</bdi>:null}</small>
 {!required&&any?<button type="button" className="np-date-clear" onClick={()=>setParts({day:'',month:'',year:''})}>مسح التاريخ</button>:null}</fieldset>;
}

function PermanentDeleteDialog({title,busy,onClose,onDelete}:{title:string;busy:boolean;onClose:()=>void;onDelete:()=>Promise<boolean>}):ReactElement{
 const [viewport,setViewport]=useState(()=>({height:window.visualViewport?.height??window.innerHeight,top:window.visualViewport?.offsetTop??0}));
 useEffect(()=>{const update=()=>setViewport({height:window.visualViewport?.height??window.innerHeight,top:window.visualViewport?.offsetTop??0});const visual=window.visualViewport;visual?.addEventListener('resize',update);visual?.addEventListener('scroll',update);window.addEventListener('resize',update);return()=>{visual?.removeEventListener('resize',update);visual?.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[]);
 const [phrase,setPhrase]=useState(''),[error,setError]=useState('');const panel=useRef<HTMLDivElement>(null),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{const opener=document.activeElement as HTMLElement|null;const previous=document.body.style.overflow;document.body.style.overflow='hidden';input.current?.focus();return()=>{document.body.style.overflow=previous;if(opener?.isConnected)opener.focus();};},[]);
 const confirm=async(e:FormEvent)=>{e.preventDefault();if(busy||phrase.trim()!=='حذف')return;setError('');if(!await onDelete())setError('تعذر تأكيد الحذف. العنصر لم يُزل من هذه الشاشة؛ يمكنك إعادة المحاولة.');};
 return createPortal(<div className="np-delete-backdrop" style={{top:viewport.top,height:viewport.height,bottom:'auto'}} onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}><div className="np-delete-dialog" style={{maxHeight:Math.max(0,viewport.height-32)}} role="alertdialog" aria-modal="true" aria-labelledby="np-delete-title" aria-describedby="np-delete-warning" ref={panel} onKeyDown={e=>{if(e.key==='Escape'&&!busy){e.preventDefault();onClose();}if(e.key==='Tab'){const nodes=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')??[]);const first=nodes[0],last=nodes.at(-1);if(!first){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
 <header><h2 id="np-delete-title">حذف نهائي</h2><button type="button" aria-label="إغلاق تأكيد الحذف" disabled={busy} onClick={onClose}>×</button></header>
 <form onSubmit={e=>{void confirm(e);}}><div className="np-delete-body"><strong>{title}</strong><p id="np-delete-warning">سيُحذف العنصر وكل تنفيذاته وسجلاته المرتبطة نهائيًا، وسيتغير سجل الإنجاز والإحصاءات. لا يمكن التراجع من المنصة.</p><label htmlFor="np-delete-phrase">اكتب «حذف» للتأكيد</label><input ref={input} id="np-delete-phrase" autoComplete="off" value={phrase} disabled={busy} onChange={e=>setPhrase(e.currentTarget.value)} onInput={e=>setPhrase(e.currentTarget.value)}/>{error?<p role="alert">{error}</p>:null}</div><footer><button className="cancel" type="button" disabled={busy} onClick={onClose}>إلغاء</button><button className="confirm" type="submit" disabled={busy||phrase.trim()!=='حذف'}>{busy?'جارٍ الحذف…':'تأكيد الحذف النهائي'}</button></footer></form>
 </div></div>,document.body);
}


function DefinitionForm({busy,onCommand,defaultStartDate,defaultKind="Habit",initial,categories=COMMON_CATEGORIES}:{busy:boolean;onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>;defaultStartDate:string;defaultKind?:"Habit"|"Task";initial?:DefinitionItem;categories?:readonly string[]}):ReactElement {
 const [scheduleKind,setScheduleKind]=useState<"OneTime"|"Daily"|"Weekdays">(initial?.scheduleKind??"Daily");
 const [selectedKind,setSelectedKind]=useState(initial?.kind??defaultKind);
 const [duration,setDuration]=useState(initial?.endDate||initial?.scheduleKind==="OneTime"?"limited":"continuous");
 const [days,setDays]=useState<readonly number[]>(initial?.weekdays??[]);
 const [error,setError]=useState("");
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy)return;const data=new FormData(event.currentTarget),text=(key:string)=>String(data.get(key)??"").trim();
  if(scheduleKind==="Weekdays"&&!days.length){setError("اختر يومًا واحدًا على الأقل.");return;}
  const endDate=selectedKind==="Habit"&&duration==="continuous"?null:text("endDate")||null;
  const fields={weight:Number(text("weight")||initial?.weight||1),...(selectedKind==="Habit"&&text("timeOfDay")?{timeOfDay:text("timeOfDay")}:{}),kind:selectedKind,title:text("title"),category:text("category"),startDate:text("startDate"),endDate,scheduleKind,weekdays:scheduleKind==="Weekdays"?days:[],importance:text("importance") as "Essential"|"Important"|"Supporting"|"Optional",...(selectedKind==="Task"&&text("progressTarget")?{measurement:{target:Number(text("progressTarget")),unit:text("progressUnit")}}:{})};
  setError("");const ok=await onCommand(initial?{...fields,type:"update-definition",definitionId:initial.id,expectedRevisionId:initial.revisionId}:{...fields,type:"create-definition"});
  if(!ok)setError("تعذر تأكيد الحفظ. بياناتك محفوظة هنا؛ ربما عُدّل العنصر من جهاز آخر. أعد تحميله قبل المحاولة مجددًا.");
 };
 return <form className="np-form" onSubmit={e=>{void submit(e);}}>
  <div className="np-field"><label className="np-label" htmlFor="definition-kind">النوع *</label><select className="np-select" id="definition-kind" name="kind" disabled={!!initial||busy} value={selectedKind} onChange={e=>setSelectedKind(e.currentTarget.value as "Habit"|"Task")}><option value="Habit">عادة</option><option value="Task">مهمة</option></select></div>
  <div className="np-field"><label className="np-label" htmlFor="definition-title">الاسم *</label><input className="np-input" id="definition-title" name="title" maxLength={120} required defaultValue={initial?.title}/></div>
  <div className="np-field"><label className="np-label" htmlFor="definition-category">التصنيف *</label><input className="np-input" id="definition-category" name="category" list="np-categories" maxLength={60} required defaultValue={initial?.category}/><datalist id="np-categories">{categories.map(c=><option value={c} key={c}/>)}</datalist></div>
  {selectedKind==='Habit'?<div className="np-field"><label className="np-label" htmlFor="definition-time">موعد تنفيذ العادة (اختياري)</label><input className="np-input" id="definition-time" name="timeOfDay" type="time" defaultValue={initial?.timeOfDay}/><small>مناسب للأدوية والمكملات. موعد للعرض والتنظيم؛ لا يرسل تنبيهًا حاليًا.</small></div>:null}
  <div className="np-field"><label className="np-label" htmlFor="definition-importance">الأهمية *</label><select className="np-select" id="definition-importance" name="importance" defaultValue={initial?.importance??"Supporting"}><option value="Essential">أساسي</option><option value="Important">مهم</option><option value="Supporting">داعم</option><option value="Optional">اختياري</option></select></div>
  {selectedKind==="Habit"?<div className="np-field full"><label className="np-label" htmlFor="definition-duration">مدة العادة</label><select className="np-select" id="definition-duration" value={duration} onChange={e=>{setDuration(e.currentTarget.value);if(e.currentTarget.value==="continuous"&&scheduleKind==="OneTime")setScheduleKind("Daily");}}><option value="continuous">مستمرة — بدون نهاية</option><option value="limited">محددة — بداية ونهاية</option></select><small className="np-cc-help">العادة المستمرة تتكرر وفق جدولها، ويُسجّل إتمامها وملاحظاتها لكل يوم على حدة.</small></div>:null}
  <GregorianDateInput id="definition-start" name="startDate" label="تاريخ البداية الميلادي" required defaultValue={initial?.startDate??defaultStartDate}/>
  {selectedKind==="Task"||duration==="limited"?<GregorianDateInput id="definition-end" name="endDate" label="تاريخ النهاية الميلادي" required={selectedKind==="Habit"} defaultValue={initial?.endDate??""}/>:<div className="np-field"><span className="np-label">النهاية</span><p className="np-cc-help">مستمرة حتى توقفها أو تغيّر مدتها.</p></div>}
  <div className="np-field full"><label className="np-label" htmlFor="definition-repeat">التكرار *</label><select className="np-select" id="definition-repeat" name="scheduleKind" value={scheduleKind} onChange={e=>setScheduleKind(e.currentTarget.value as typeof scheduleKind)}><option value="Daily">يوميًا — 7 أيام في الأسبوع</option><option value="Weekdays">أيام محددة من الأسبوع</option><option value="OneTime" disabled={selectedKind==="Habit"&&duration==="continuous"}>مرة واحدة</option></select></div>
  {scheduleKind==="Weekdays"?<div className="np-field full"><span className="np-label">أيام التكرار: {days.length} من 7 *</span><div className="np-weekdays">{WEEKDAYS.map(([value,label])=><label className="np-weekday" key={value}><input type="checkbox" name="weekday" value={value} checked={days.includes(value)} onChange={e=>setDays(e.currentTarget.checked?[...days,value].sort():days.filter(d=>d!==value))}/>{label}</label>)}</div></div>:null}
  {selectedKind==="Task"?<><div className="np-field"><label className="np-label" htmlFor="progress-target">الكمية المستهدفة (اختياري)</label><input className="np-input" id="progress-target" name="progressTarget" type="number" min="0.000001" max="1000000000" step="0.000001" defaultValue={initial?.measurement?.target}/></div><div className="np-field"><label className="np-label" htmlFor="progress-unit">وحدة الإنجاز</label><input className="np-input" id="progress-unit" name="progressUnit" maxLength={30} defaultValue={initial?.measurement?.unit??"صفحة"}/></div></>:null}
  <div className="np-field full"><label className="np-label" htmlFor="definition-weight">وزن الإنجاز *</label><input className="np-input" id="definition-weight" name="weight" type="number" min="1" max="100" step="1" required defaultValue={initial?.weight??1}/><small>من 1 إلى 100. مثلًا: وزن 10 يساوي تأثير عشر عادات وزن كل منها 1. التعديل يطبّق على اليوم وما بعده، ويحافظ على أوزان الأيام السابقة.</small></div>
  {initial?<p className="np-cc-help np-field full">التعديل يؤثر على الجدول الحالي والقادم. سجل الإنجاز والملاحظات السابق محفوظ. لا يمكن خفض الهدف عن الإنجاز المسجل أو تغيير وحدته بعد بدء القياس.</p>:null}
  {error?<p role="alert" className="np-action-error np-field full">{error}</p>:null}
  <div className="np-form-actions"><button className="np-cc-button primary" type="submit" disabled={busy}>{busy?"جارٍ الحفظ…":initial?"حفظ التعديلات":"إضافة إلى نور"}</button></div>
 </form>;
}

// NOOR_DISPLAY_ORDER_R84: owner-persisted ordering; no optimistic financial or schedule mutations.
function DisplayOrderManager({workspace,busy,onCommand}:{workspace:WorkspaceViewModel|null;busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>}):ReactElement{
 const [scope,setScope]=useState<"Habit"|"Task"|"categories">("categories"),[error,setError]=useState("");
 const rows=scope==="categories"?(workspace?.categories??[]).map(c=>({id:c,title:c})): (workspace?.definitions??[]).filter(d=>d.kind===scope);
 const groups=scope!=="Habit"?[["",rows] as const]:(()=>{const map=new Map<string,typeof rows>();for(const row of rows){const category=("category" in row?String(row.category):"عام").trim().replace(/\s+/g," ");map.set(category,[...(map.get(category)??[]),row]);}const categories=(workspace?.categories??[]).map(c=>c.trim().replace(/\s+/g," "));return [...map.entries()].sort(([a],[b])=>{const rank=(c:string)=>{const i=categories.indexOf(c);return i<0?Number.MAX_SAFE_INTEGER:i;};return rank(a)-rank(b)||a.localeCompare(b,"ar");});})();
 const move=async(group:typeof rows,index:number,offset:number)=>{if(busy)return;const expected=rows.map(r=>r.id),order=[...expected];const other=index+offset;if(other<0||other>=group.length)return;const a=expected.indexOf(group[index]!.id),b=expected.indexOf(group[other]!.id);[order[a],order[b]]=[order[b]!,order[a]!];setError("");if(!await onCommand({type:"reorder-display",scope,expected,order}))setError("تعذر حفظ الترتيب. حدّث الصفحة ثم حاول مجددًا.");};
 return <section data-testid="display-order-r84" data-order-version="instant-grouped-r85"><div className="np-cc-title"><div><h2>ترتيب العرض</h2><p>رتّب العادات داخل كارت تصنيفها. يظهر الترتيب فورًا ويُحفظ بالخلفية.</p></div></div><div className="np-order-tabs">{([["categories","كروت التصنيفات"],["Habit","العادات"],["Task","المهام"]] as const).map(([id,label])=><button className="np-cc-button" type="button" aria-pressed={scope===id} disabled={busy} key={id} onClick={()=>{setScope(id);setError("");}}>{label}</button>)}</div>{error?<p role="alert">{error}</p>:null}{groups.map(([category,group])=><section className={category?"np-order-group":""} aria-label={category?`ترتيب عادات ${category}`:undefined} key={category}>{category?<h3>{category}<small>{group.length} عادات</small></h3>:null}<ol className="np-order-list">{group.map((row,index)=><li key={row.id}><span>{row.title}</span><div><button className="np-cc-button" type="button" aria-label={`نقل ${row.title} لأعلى`} disabled={busy||index===0} onClick={()=>{void move(group,index,-1);}}>↑</button><button className="np-cc-button" type="button" aria-label={`نقل ${row.title} لأسفل`} disabled={busy||index===group.length-1} onClick={()=>{void move(group,index,1);}}>↓</button></div></li>)}</ol></section>)}{!rows.length?<p className="np-empty">لا توجد عناصر لترتيبها.</p>:null}</section>;

}

function StatisticsCenter({workspace}:{workspace:WorkspaceViewModel|null}):ReactElement{
 const [kind,setKind]=useState("all"),[selected,setSelected]=useState(""),[periodKey,setPeriodKey]=useState("days"),[daySelection,setDaySelection]=useState<string|null>(null),[month,setMonth]=useState("");
 const history=workspace?.statistics.rows??[],currentDate=workspace?.statistics.currentDate??null;
 const options=[...new Map([...(workspace?.definitions??[]).map(d=>[d.id,{id:d.id,title:d.title,kind:d.kind}] as const),...history.map(r=>[r.definitionId,{id:r.definitionId,title:r.title,kind:r.kind}] as const)]).values()].filter(d=>kind==="all"||d.kind===kind);
 const rows=history.filter(r=>(kind==="all"||r.kind===kind)&&(!selected||r.definitionId===selected)),periods=statisticPeriods(rows,currentDate),subject=options.find(d=>d.id===selected),ready=periods.filter(p=>p.ready),chosen=ready.find(p=>p.key===periodKey);
 const rangeRows=chosen?.rows??rows,summary=summarizeProgress(rangeRows),insights=statisticInsights(rows,currentDate),days=statisticDays(rangeRows,chosen?.end??currentDate,chosen?.key==="week"?7:30,chosen?.key==="week"?chosen.start:undefined);
 const first=rows.filter(statisticEligible).map(r=>r.date).sort()[0],activeMonth=month||currentDate?.slice(0,7)||"",calendar=statisticCalendar(rows,activeMonth,currentDate),selectedDay=daySelection??currentDate;
 const dayRows=rows.filter(r=>r.date===selectedDay&&statisticEligible(r)),dayScore=summarizeProgress(dayRows),nextPeriod=periods.find(p=>!p.ready);
 const unit=subject?.kind==="Task"?rows.find(r=>r.unit)?.unit??"":"",quantity=rangeRows.reduce((n,r)=>n+r.amount,0);
 useEffect(()=>{setPeriodKey("days");setDaySelection(null);setMonth("");},[kind,selected,currentDate]);
 const formatDate=(date:string,opts:Intl.DateTimeFormatOptions={day:"numeric",month:"long"})=>new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{...opts,timeZone:"UTC"}).format(new Date(date+"T00:00:00Z"));
 const pickDay=(date:string)=>{setDaySelection(date);setMonth(date.slice(0,7));};
 const shiftMonth=(by:number)=>setMonth(shiftStatisticMonth(activeMonth+"-01",by).slice(0,7));
 const shade=(rate:number|null)=>rate===null?"empty":rate===100?"complete":rate===0?"missed":rate>=60?"strong":"partial";
 return <section className="ns-center" data-testid="statistics-center-r91" data-statistics-design="tracker-r92">
 <header className="ns-header"><div><span className="ns-eyebrow">نظرة إلى رحلتك</span><h2>الإحصائيات</h2><p>راقب الاستمرارية، وافهم اتجاه تقدّمك.</p></div>{currentDate?<span className="ns-date">{formatDate(currentDate,{day:"numeric",month:"long",year:"numeric"})}</span>:null}</header>
 <div className="ns-toolbar"><label>النشاط<select className="np-select" aria-label="نوع الإحصائيات" value={kind} onChange={e=>{setKind(e.currentTarget.value);setSelected("");}}><option value="all">العادات والمهام</option><option value="Habit">العادات</option><option value="Task">المهام</option></select></label><label>التركيز على<select className="np-select" aria-label="اختيار عادة أو مهمة للإحصائيات" value={selected} onChange={e=>setSelected(e.currentTarget.value)}><option value="">الصورة الكاملة</option>{options.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></label></div>
 {!first||!currentDate?<div className="ns-empty"><svg width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="7" y="10" width="34" height="31" rx="9" stroke="currentColor" strokeWidth="2"/><path d="M15 6v8m18-8v8M8 21h32m-24 8 5 5 11-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><h3>كل يوم، بداية لتقدّم جديد</h3><p>عند تسجيل أول نشاط مستحق لهذا الاختيار، سيظهر اتجاه الإنجاز وتقويمه هنا.</p></div>:<>
 <nav className="ns-periods" aria-label="فترة الإحصائيات"><button type="button" aria-pressed={!chosen} className={!chosen?"is-active":""} onClick={()=>{setPeriodKey("days");if(currentDate)pickDay(currentDate);}}><span>الأيام</span><small>من بداية التسجيل</small></button>{ready.map(p=><button type="button" className={chosen?.key===p.key?"is-active":""} aria-pressed={chosen?.key===p.key} data-period={p.key} key={p.key} onClick={()=>{setPeriodKey(p.key);pickDay(p.end);}}><span>{p.label}</span><small>{p.rate===null?"لا استحقاقات":p.rate+"%"}</small></button>)}</nav>
 <div className="ns-hero"><div className="ns-score"><svg className="ns-ring" viewBox="0 0 120 120" role="img" aria-label={`الإنجاز الموزون ${summary.rate??0}%`}><circle className="ns-ring-track" cx="60" cy="60" r="51"/><circle className="ns-ring-value" cx="60" cy="60" r="51" strokeDasharray={320.44} strokeDashoffset={320.44*(1-(summary.rate??0)/100)}/></svg><div><strong>{summary.rate===null?"—":summary.rate+"%"}</strong><span>الإنجاز الموزون</span></div></div><div className="ns-hero-copy"><span className="ns-eyebrow">{subject?.title??"الصورة الكاملة"}</span><h3>{chosen?`تقرير ${chosen.label}`:"خطوات صغيرة، أثر متراكم"}</h3><p>{chosen?`${formatDate(chosen.start)} — ${formatDate(chosen.end)}`:`من ${formatDate(first)} إلى ${formatDate(currentDate)}`}</p><span className="ns-points">{arabicNumber(summary.completedWeight)} <small>من {arabicNumber(summary.weight)} نقطة وزن</small></span>{insights.change!==null?<span className={`ns-change ${insights.change<0?"down":""}`}>{insights.change>0?"↑ ":insights.change<0?"↓ ":""}{Math.abs(insights.change)} نقطة مئوية مقارنة بالأسبوع السابق</span>:<span className="ns-quiet">تُتاح مقارنة الاتجاه بعد أسبوعين كاملين.</span>}</div></div>
 <div className="ns-metrics"><div><span>تنفيذات مكتملة</span><strong>{arabicNumber(summary.completed)}<small> / {arabicNumber(summary.scheduled)}</small></strong><p>خلال الفترة المختارة</p></div><div><span>الاستمرارية الحالية</span><strong>{arabicNumber(insights.current)}<small> أيام استحقاق</small></strong><p>الأيام غير المجدولة لا تقطعها</p></div><div><span>أفضل استمرارية</span><strong>{arabicNumber(insights.best)}<small> أيام استحقاق</small></strong><p>من بداية التسجيل</p></div>{subject?.kind==="Task"&&unit?<div><span>كمية التقدم</span><strong>{arabicNumber(quantity)}<small> {unit}</small></strong><p>المسجّل خلال الفترة</p></div>:null}</div>
 <section className="ns-panel"><div className="ns-panel-head"><div><h3>اتجاه الإنجاز</h3><p>{chosen?.key==="week"?"أيام الأسبوع المكتمل":"آخر أيام التسجيل"} · اضغط على يوم لعرض تفاصيله</p></div><span className="ns-unit">نسبة موزونة %</span></div><div className="ns-chart" aria-label="رسم الإنجاز اليومي">{days.map(d=><button type="button" className={`ns-chart-day ${selectedDay===d.date?"is-selected":""}`} key={d.date} aria-label={`${formatDate(d.date)}: ${d.rate===null?"لا استحقاقات":d.rate+"%"}`} aria-pressed={selectedDay===d.date} onClick={()=>pickDay(d.date)}><span className="ns-chart-value">{d.rate===null?"—":d.rate+"%"}</span><span className="ns-chart-track"><i data-level={shade(d.rate)} style={{height:`${d.rate===null?0:Math.max(3,d.rate)}%`}}/></span><span className="ns-chart-label">{formatDate(d.date,{day:"numeric"})}</span></button>)}</div></section>
 <div className="ns-detail-grid"><section className="ns-panel"><div className="ns-panel-head ns-calendar-nav"><button type="button" aria-label="الشهر السابق" disabled={activeMonth<=first.slice(0,7)} onClick={()=>shiftMonth(-1)}>›</button><h3>{formatDate(activeMonth+"-01",{month:"long",year:"numeric"})}</h3><button type="button" aria-label="الشهر التالي" disabled={activeMonth>=currentDate.slice(0,7)} onClick={()=>shiftMonth(1)}>‹</button></div><div className="ns-calendar" aria-label="تقويم الإنجاز">{["س","ح","ن","ث","ر","خ","ج"].map((d,i)=><span className="ns-weekday" key={i}>{d}</span>)}{Array.from({length:calendar.offset},(_,i)=><span aria-hidden="true" key={`blank-${i}`}/>)}{calendar.days.map(d=><button type="button" className={`ns-calendar-day ${selectedDay===d.date?"is-selected":""} ${d.date===currentDate?"is-today":""}`} data-level={shade(d.rate)} key={d.date} disabled={d.future||d.date<first} aria-label={`${formatDate(d.date)}: ${d.future?"يوم قادم":d.rate===null?"لا استحقاقات":d.rate+"%"}`} aria-pressed={selectedDay===d.date} onClick={()=>pickDay(d.date)}>{Number(d.date.slice(8))}</button>)}</div><div className="ns-legend"><span><i data-level="empty"/> غير مجدول</span><span><i data-level="missed"/> لم يُنجز</span><span><i data-level="partial"/> جزئي</span><span><i data-level="complete"/> مكتمل</span></div></section>
 <section className="ns-panel ns-day-details" aria-live="polite"><div className="ns-panel-head"><div><span className="ns-eyebrow">تفاصيل اليوم</span><h3>{selectedDay?formatDate(selectedDay,{weekday:"long",day:"numeric",month:"long"}):"اختر يومًا"}</h3></div><strong>{dayScore.rate===null?"—":dayScore.rate+"%"}</strong></div>{dayRows.length?<ul>{dayRows.map(r=><li key={r.id}><span className={`ns-status-dot ${r.status==="Completed"?"done":""}`} aria-hidden="true">{r.status==="Completed"?"✓":"·"}</span><div><strong>{r.title}</strong><small>{STATUS_LABELS[r.status]??r.status}{r.amount>0?` · ${arabicNumber(r.amount)} ${r.unit}`:""}</small></div><span className="ns-row-points">{r.status==="Completed"?r.weight:0}<small> / {r.weight}</small></span></li>)}</ul>:<p className="ns-day-empty">لا توجد عناصر مستحقة لهذا اليوم والاختيار. هذا اليوم لا يُحسب فشلًا.</p>}</section></div>
 {nextPeriod?<div className="ns-next-period"><span>التقرير القادم: {nextPeriod.label}</span><strong>يتاح {formatDate(nextPeriod.unlockDate)}</strong></div>:null}
 <details className="ns-method"><summary>كيف تُحسب الإحصائيات؟</summary><p>النسبة = مجموع أوزان العناصر المكتملة ÷ أوزان العناصر المستحقة. التقدم الجزئي للمهمة يظهر بكمّيته، وتُحتسب نقاط وزنها عند الإتمام. التقارير المكتملة تنتهي بالأمس، ولا تُعرض فترة قبل اكتمالها. الأيام بلا استحقاقات والعناصر المستبعدة أو الملغاة خارج النسبة. الاستمرارية تقيس أيام الاستحقاق المكتملة، وتظل أوزان الأيام السابقة محفوظة.</p></details>
 </>}
 </section>;
}

function CategoryManager({categories,busy,onCommand}:{categories:readonly string[];busy:boolean;onCommand:(c:NoorPersonalCommandInput)=>Promise<boolean>}):ReactElement{
 const [previous,setPrevious]=useState<string|null>(null),[name,setName]=useState(""),[error,setError]=useState("");
 const save=async(e:FormEvent)=>{e.preventDefault();if(busy)return;const ok=await onCommand({type:"manage-category",action:previous?"rename":"add",name:name.trim(),previousName:previous});if(ok){setPrevious(null);setName("");setError("");}else setError("تعذر الحفظ. تحقق من الاسم؛ لا يمكن دمج تصنيفين يحملان نفس الاسم.");};
 return <section data-testid="category-manager-r77"><div className="np-cc-title"><div><h2>التصنيفات</h2><p>تصنيفاتك تُحفظ في حسابك وتظهر على أجهزتك. تغيير الاسم يشمل العادات والمهام التابعة له.</p></div></div><form className="np-category-editor" onSubmit={e=>{void save(e);}}><label className="np-label" htmlFor="category-name">{previous?`تعديل «${previous}»`:"تصنيف جديد"}</label><input className="np-input" id="category-name" required maxLength={60} value={name} onChange={e=>setName(e.currentTarget.value)}/><button className="np-cc-button primary" disabled={busy||!name.trim()} type="submit">{previous?"حفظ الاسم":"إضافة تصنيف"}</button>{previous?<button className="np-cc-button" type="button" disabled={busy} onClick={()=>{setPrevious(null);setName("");}}>إلغاء</button>:null}</form>{error?<p role="alert" className="np-action-error">{error}</p>:null}<div className="np-category-registry">{categories.map(c=><div key={c}><span>{c}</span><button className="np-cc-button" disabled={busy} type="button" aria-label={`تعديل تصنيف ${c}`} onClick={()=>{setPrevious(c);setName(c);setError("");}}>تعديل الاسم</button></div>)}</div></section>;
}


const FINANCE_ACCOUNT_LABELS={cash:"نقدي",bank:"حساب بنكي",savings:"صندوق الادخار",emergency:"صندوق الطوارئ"};
const FINANCE_KIND_LABELS={income:"دخل",expense:"مصروف",transfer:"تحويل",repay:"سداد / تحصيل",lend:"إقراض",borrow:"اقتراض","opening-receivable":"دين سابق لي","opening-payable":"دين سابق عليّ"};
function moneyLabel(value:number,currency:'SAR'|'EGP'='SAR'):string {return new Intl.NumberFormat('ar-SA',{numberingSystem:'latn',minimumFractionDigits:2,maximumFractionDigits:2}).format(value/100)+(currency==='EGP'?' ج.م':' ر.س');}
function parseMoneyInput(value:string):number|null {
 const normalized=value.trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace('٫','.');
 if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))return null;
 const [whole,fraction='']=normalized.split('.');const minor=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 return Number.isSafeInteger(minor)&&minor<=1e12?minor:null;
}
function debtDuration(start:string,end:string):string{const p=debtElapsedPeriod(start,end);return p?[p.years?`${p.years} سنة`:'',p.months?`${p.months} شهر`:'',p.days?`${p.days} يوم`:''].filter(Boolean).join(' و ')||'0 يوم':'—';}
function FinanceCorrections({entry}:{entry:FinanceLedger['entries'][number]|undefined}):ReactElement|null{return entry?.corrections?.length?<details><summary>سجل التصحيحات ({entry.corrections.length})</summary>{entry.corrections.map((c,i)=><p key={i}>القيمة السابقة: {(c.amountMinor/100).toFixed(2)} · {c.date}<br/>السبب: {c.reason}{c.note?<><br/>{c.note}</>:null}</p>)}</details>:null;}
function DebtRegister({ledger,today,busy,onRepay,onAddPerson,onAddDebt,onEditPerson,onEditDebt,onEditPayment}:{ledger:FinanceLedger;today:string;busy:boolean;onRepay:(id:string)=>void;onAddPerson:()=>void;onEditDebt:(id:string)=>void;onEditPayment:(id:string)=>void;onEditPerson:(person:{id:string|null;name:string;note:string})=>void;onAddDebt:(person:{id:string|null;name:string})=>void}):ReactElement{
 const [view,setView]=useState<'people'|'statistics'>('people'),[selected,setSelected]=useState<string|null>(null),[query,setQuery]=useState(''),[direction,setDirection]=useState('all'),[state,setState]=useState('all');const summary=financeSummary(ledger);
 const profiles=new Map<string,{id:string|null;key:string;name:string;note:string}>();for(const p of ledger.people??[])profiles.set('person:'+p.id,{...p,key:'person:'+p.id});
 const personKey=(debt:FinanceLedger['debts'][number])=>{const p=ledger.people?.find(p=>debt.personId?p.id===debt.personId:p.name===debt.person);return p?'person:'+p.id:'legacy:'+debt.person;};
 for(const d of ledger.debts){const key=personKey(d);if(!profiles.has(key))profiles.set(key,{key,id:null,name:d.person,note:''});}
 const person=selected?profiles.get(selected):undefined;
 const allRows=ledger.debts.map(debt=>{const origin=ledger.entries.find(e=>e.debtId===debt.id&&e.kind!=='repay'&&!e.voidedAt);const payments=ledger.entries.filter(e=>e.debtId===debt.id&&e.kind==='repay'&&!e.voidedAt).slice().sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt));const paid=payments.reduce((n,e)=>n+e.amountMinor,0),remaining=summary.outstanding[debt.id]??0;const status=!origin?'cancelled':remaining===0?'paid':debt.dueDate&&debt.dueDate<today?'overdue':paid?'partial':'open';const end=payments.at(-1)?.date??today;const period=origin?debtElapsedPeriod(origin.date,end):null;return {debt,origin,payments,paid,remaining,status,end,period};});
 const rows=allRows.filter(r=>(view==='statistics'||personKey(r.debt)===person?.key)&&(direction==='all'||r.debt.direction===direction)&&(state==='all'||r.status===state)&&(!query||`${r.debt.person} ${r.debt.note}`.includes(query.trim())));
 const labels:Record<string,string>={paid:'تم السداد',partial:'سداد جزئي',overdue:'متأخر عن الاستحقاق',open:'لم يُسدّد',cancelled:'ملغى'};
 const showPeople=view==='people'&&!person;
 return <section className="nf-debt-register" data-testid="debt-register-r77" data-layout="people-r78" data-person-edit-version="NOOR_PERSON_EDIT_R79" data-ledger-design="NOOR_LEDGER_DESIGN_R80"><nav className="nf-tabs" aria-label="عرض الديون"><button type="button" className={view==='people'?'is-active':''} onClick={()=>{setView('people');setQuery('');}}>الأشخاص</button><button type="button" className={view==='statistics'?'is-active':''} onClick={()=>{setView('statistics');setQuery('');}}>الإحصائيات</button></nav>
 {showPeople?<><div className="nf-list-heading"><h3>الأشخاص</h3><button className="nf-button primary" type="button" disabled={busy} onClick={onAddPerson}>+ إضافة شخص</button></div><input aria-label="البحث عن شخص" placeholder="ابحث بالاسم" value={query} onChange={e=>setQuery(e.currentTarget.value)}/><div className="nf-person-grid">{[...profiles.values()].filter(p=>!query||p.name.includes(query.trim())).map(p=>{const debts=allRows.filter(r=>personKey(r.debt)===p.key);return <article className="nf-person-card" key={p.key}><button className="nf-person" type="button" onClick={()=>{setSelected(p.key);setQuery('');setDirection('all');setState('all');}}><strong>{p.name}</strong><span>{debts.length} مبالغ مسجلة · {debts.filter(r=>r.status==='paid').length} مسددة</span>{(['SAR','EGP'] as const).map(currency=>{const group=debts.filter(r=>(r.debt.currency??'SAR')===currency);return group.length?<small key={currency}>لي: {moneyLabel(group.filter(r=>r.debt.direction==='receivable').reduce((n,r)=>n+r.remaining,0),currency)} · عليّ: {moneyLabel(group.filter(r=>r.debt.direction==='payable').reduce((n,r)=>n+r.remaining,0),currency)}</small>:null;})}<span className="nf-person-open">فتح ملف الشخص ←</span></button><div className="nf-person-card-actions"><button className="nf-button" type="button" aria-label={`تعديل بيانات ${p.name}`} disabled={busy} onClick={()=>onEditPerson(p)}><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none"><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>الاسم والملاحظات</button><button className="nf-button" type="button" onClick={()=>{setSelected(p.key);setQuery('');setDirection('all');setState('all');}}>تعديل المبالغ</button></div></article>;})}</div>{!profiles.size?<p className="nf-empty">أضف الشخص أولًا، ثم سجل المبالغ ودفعات السداد داخل ملفه.</p>:null}</>:<>
 <div className="nf-list-heading"><div><h3>{person?person.name:'إحصائيات جميع الأشخاص'}</h3>{person?.note?<p className="nf-help">{person.note}</p>:null}</div><div>{person?<><button className="nf-button" type="button" onClick={()=>{setSelected(null);setQuery('');}}>العودة للأشخاص</button><button className="nf-button" type="button" disabled={busy} onClick={()=>onEditPerson(person)}>تعديل الشخص</button><button className="nf-button primary" type="button" disabled={busy} onClick={()=>onAddDebt(person)}>+ إضافة مبلغ لهذا الشخص</button></>:null}</div></div>
 <div className="nf-debt-filters"><input aria-label="بحث في الديون" placeholder="بحث في الملاحظات" value={query} onChange={e=>setQuery(e.currentTarget.value)}/><select aria-label="اتجاه الدين" value={direction} onChange={e=>setDirection(e.currentTarget.value)}><option value="all">الكل: لي وعليّ</option><option value="receivable">مدين لي — مبالغ لي</option><option value="payable">دائن عليّ — مبالغ عليّ</option></select><select aria-label="حالة السداد" value={state} onChange={e=>setState(e.currentTarget.value)}><option value="all">كل الحالات</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
 <details className="nf-ledger-guide"><summary>كيف تُحسب المدة والألوان؟</summary><p className="nf-help">المدة من تاريخ الدين حتى آخر تاريخ سداد إن وجد، وإلا حتى اليوم. الدفعة الجزئية لا تُغلق المبلغ المتبقي. الألوان: أصفر أقل من 6 أشهر، برتقالي من 6 إلى 8، أحمر من 9 فأكثر، وأخضر للمسدد بالكامل.</p></details>
 <div className="nf-debt-totals">{(['SAR','EGP'] as const).filter(currency=>rows.some(r=>(r.debt.currency??'SAR')===currency)).flatMap(currency=>(['receivable','payable'] as const).map(dir=>{const group=rows.filter(r=>(r.debt.currency??'SAR')===currency&&r.debt.direction===dir);return <article key={currency+dir}><h3>{dir==='receivable'?'مبالغ لي':'مبالغ عليّ'} · {currency==='SAR'?'ريال سعودي':'جنيه مصري'}</h3><dl><dt>أصل الدين</dt><dd>{moneyLabel(group.reduce((n,r)=>n+(r.origin?.amountMinor??0),0),currency)}</dd><dt>السداد</dt><dd>{moneyLabel(group.reduce((n,r)=>n+r.paid,0),currency)}</dd><dt>المتبقي</dt><dd>{moneyLabel(group.reduce((n,r)=>n+r.remaining,0),currency)}</dd></dl></article>;}))}</div>
 {rows.length===0?<p className="nf-empty">لا توجد مبالغ تطابق الاختيار.</p>:<div className="nf-debt-scroll" tabIndex={0} role="region" aria-label="جدول الشخص والديون والسداد"><table className="nf-debt-table nf-ledger-table"><caption>{person?'سجل '+person.name:'سجل جميع الأشخاص'}<span>{rows.length} مبالغ · إجماليات العملات منفصلة</span></caption><thead><tr>{['الشخص','الدين','السداد','المتبقي','المدة والحالة','الملاحظات','الإجراء'].map(x=><th scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(r=>{const age=r.status==='paid'?'paid':!r.origin?'cancelled':(r.period?.totalMonths??0)>=9?'red':(r.period?.totalMonths??0)>=6?'orange':'yellow';return <tr key={r.debt.id}>
 <td data-label="الشخص" className="nf-ledger-person"><strong>{r.debt.person}</strong><span className="nf-badge">{r.debt.direction==='receivable'?'لي عنده':'عليّ له'}</span></td>
 <td data-label="الدين"><strong className="nf-ledger-money">{moneyLabel(r.origin?.amountMinor??0,r.debt.currency)}</strong><time className="nf-ledger-date" dateTime={r.origin?.date}>{r.origin?.date??'ملغى'}</time></td>
 <td data-label="السداد"><strong className="nf-ledger-money">{moneyLabel(r.paid,r.debt.currency)}</strong>{r.payments.length?<><time className="nf-ledger-date" dateTime={r.end}>آخر دفعة: {r.end}</time><details className="nf-ledger-payments"><summary>دفعات السداد ({r.payments.length})</summary><ol>{r.payments.map(e=><li key={e.id}><div><strong>{moneyLabel(e.amountMinor,r.debt.currency)}</strong><time dateTime={e.date}>{e.date}</time></div>{e.note?<p>{e.note}</p>:null}<button className="nf-button" type="button" disabled={busy} onClick={()=>onEditPayment(e.id)}>تعديل الدفعة</button><FinanceCorrections entry={e}/></li>)}</ol></details></>:<small>لا توجد دفعات</small>}</td>
 <td data-label="المتبقي"><strong className="nf-ledger-money nf-ledger-remaining">{moneyLabel(r.remaining,r.debt.currency)}</strong><span className={`nf-payment-state ${r.status}`}>{r.status==='paid'?'✓ ':''}{labels[r.status]}</span></td>
 <td data-label="المدة والحالة"><span className={`nf-ledger-age age-${age}`}>{r.origin?debtDuration(r.origin.date,r.end):'—'}</span><small>{r.status==='paid'?'تم السداد':!r.origin?'ملغى':`${r.period?.totalMonths??0} شهر منذ الدين`}</small></td>
 <td data-label="الملاحظات" className="nf-ledger-note"><p>{r.debt.note||'بدون ملاحظات'}</p>{r.debt.dueDate?<small>الاستحقاق: <time className="nf-ledger-date" dateTime={r.debt.dueDate}>{r.debt.dueDate}</time></small>:<small>بدون موعد استحقاق</small>}</td>
 <td data-label="الإجراء" className="nf-ledger-actions"><FinanceCorrections entry={r.origin}/><button className="nf-button" type="button" disabled={busy||!r.origin} onClick={()=>onEditDebt(r.debt.id)}>تعديل المبلغ</button><button className="nf-button" type="button" disabled={busy||!r.origin||r.remaining===0} onClick={()=>onRepay(r.debt.id)}>{r.debt.direction==='receivable'?'تسجيل تحصيل':'تسجيل سداد'}</button></td>
 </tr>;})}</tbody></table></div>}

 </>}
 </section>;
}


function FinanceCenter({ledger,busy,onCommand,today}:{ledger:FinanceLedger|null;busy:boolean;onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>;today:string}):ReactElement {
 const [tab,setTab]=useState<'overview'|'entries'|'accounts'|'debts'>('overview');
 const [month,setMonth]=useState(today.slice(0,7));const [query,setQuery]=useState('');const [accountFilter,setAccountFilter]=useState('');const [limit,setLimit]=useState(25);
 const [modal,setModal]=useState<{kind:'person'|'editPerson'|'editDebt'|'editPayment'|'account'|'income'|'expense'|'transfer'|'debt'|'repay'|'void';id:string;debtId?:string;entryId?:string;personId?:string;personName?:string;personNote?:string;expected?:string}|null>(null);
 const [error,setError]=useState('');const [debtCurrency,setDebtCurrency]=useState<'SAR'|'EGP'>('SAR');const panel=useRef<HTMLDivElement>(null);
 const open=(kind:NonNullable<typeof modal>['kind'],extra:{debtId?:string;entryId?:string;personId?:string;personName?:string;personNote?:string;expected?:string}={})=>{setError('');setDebtCurrency('SAR');const entry=kind==='editDebt'?ledger?.entries.find(e=>e.debtId===extra.debtId&&e.kind!=='repay'&&!e.voidedAt):ledger?.entries.find(e=>e.id===extra.entryId);const debt=ledger?.debts.find(d=>d.id===extra.debtId);setModal({kind,id:globalThis.crypto.randomUUID(),...extra,...(entry&&(kind==='editDebt'||kind==='editPayment')?{expected:financeEditToken(entry,kind==='editDebt'?debt:undefined)}:{})});};
 const close=()=>{if(!busy)setModal(null);};
 useEffect(()=>{if(!modal)return;const previous=document.body.style.overflow;const opener=document.activeElement as HTMLElement;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();return()=>{document.body.style.overflow=previous;if(opener?.isConnected)opener.focus();};},[modal?.id]);
 useEffect(()=>setLimit(25),[month,query,accountFilter]);
 if(!ledger)return <div className="nf-empty"><h2>المالية غير متاحة حاليًا</h2><p>أعد تحميل الصفحة للمحاولة مجددًا.</p></div>;
 const summary=financeSummary(ledger,month||undefined);
 const accountName=(id:string|null)=>ledger.accounts.find(a=>a.id===id)?.name ?? 'بدون حركة نقدية';
 const debtName=(id:string|null)=>ledger.debts.find(d=>d.id===id)?.person ?? '';
 const selectedDebt=ledger.debts.find(d=>d.id===modal?.debtId);
 const selectedEntry=ledger.entries.find(e=>e.id===modal?.entryId);
 const editEntry=modal?.kind==='editDebt'?ledger.entries.find(e=>e.debtId===modal.debtId&&e.kind!=='repay'&&!e.voidedAt):selectedEntry;
 const entries=ledger.entries.filter(e=>(!month || e.date.startsWith(month))&&(!accountFilter || e.accountId===accountFilter || e.targetAccountId===accountFilter)&&(!query || `${e.category} ${e.note} ${accountName(e.accountId)} ${debtName(e.debtId)}`.includes(query.trim()))).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
 const totalFor=(kind:'savings'|'emergency')=>ledger.accounts.filter(a=>a.kind===kind).reduce((n,a)=>n+(summary.balances[a.id]??0),0);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy||!modal)return;
  const form=event.currentTarget,data=new FormData(form);const text=(key:string)=>String(data.get(key)??'').trim();
  if(modal.kind==='editDebt'||modal.kind==='editPayment'){
   const amountMinor=parseMoneyInput(text('amount'));if(!editEntry||!amountMinor){setError('اكتب مبلغًا صحيحًا أكبر من صفر.');return;}
   const common={id:modal.id,amountMinor,date:text('date'),note:text('note'),reason:text('reason')};
   const operation:FinanceOperation=modal.kind==='editDebt'?{...common,action:'edit-debt',debtId:modal.debtId!,expected:modal.expected??'',dueDate:text('dueDate')||null}:{...common,action:'edit-payment',entryId:modal.entryId!,expected:modal.expected??''};
   setError('');if(await onCommand({type:'finance',operation}))setModal(null);else setError('تعذر التصحيح. راجع المدفوع والرصيد والتاريخ، أو أعد فتح البيانات إذا تغيرت.');return;
  }
  if(modal.kind==='editPerson'){setError('');if(await onCommand({type:'finance',operation:{action:'edit-person',id:modal.id,personId:modal.personId??null,expectedName:modal.personName??'',expectedNote:modal.personNote??'',name:text('name'),note:text('note')}}))setModal(null);else setError('تعذر التعديل. قد يكون الاسم مستخدمًا أو تغيرت البيانات؛ أعد فتح الملف وحاول مجددًا.');return;}
  if(modal.kind==='person'){setError('');if(await onCommand({type:'finance',operation:{action:'create-person',id:modal.id,name:text('name'),note:text('note')}}))setModal(null);else setError('تعذر الحفظ. تحقق من الاسم؛ قد يكون الشخص مسجلًا بالفعل.');return;}
  const amount=parseMoneyInput(text('amount')||'0');if(amount===null || (modal.kind!=='account' && modal.kind!=='void' && amount===0)){setError('اكتب مبلغًا صحيحًا بحد أقصى منزلتين عشريتين.');return;}
  let operation:FinanceOperation;
  if(modal.kind==='account')operation={action:'create-account',id:modal.id,name:text('name'),kind:text('accountKind') as 'cash'|'bank'|'savings'|'emergency',openingMinor:amount,date:text('date')};
  else if(modal.kind==='debt')operation={action:'create-debt',currency:debtCurrency,...(modal.personId?{personId:modal.personId}:{}),id:modal.id,person:modal.personName??text('person'),direction:text('direction') as 'receivable'|'payable',amountMinor:amount,date:text('date'),dueDate:text('dueDate')||null,accountId:debtCurrency==='EGP'?null:text('accountId')||null,note:text('note')};
  else if(modal.kind==='repay')operation={action:'settle-debt',id:modal.id,debtId:modal.debtId!,amountMinor:amount,date:text('date'),accountId:text('accountId')||null,note:text('note')};
  else if(modal.kind==='void')operation={action:'void-entry',id:modal.id,entryId:modal.entryId!,reason:text('reason')};
  else operation={action:'record-entry',id:modal.id,kind:modal.kind,amountMinor:amount,date:text('date'),accountId:text('accountId'),targetAccountId:modal.kind==='transfer'?text('targetAccountId'):null,debtId:null,category:modal.kind==='transfer'?'تحويل بين الحسابات':text('category'),note:text('note')};
  if(operation.action==='settle-debt'&&amount>(summary.outstanding[operation.debtId]??0)){setError('المبلغ أكبر من المتبقي من الدين.');return;}
  if(operation.action==='record-entry'){
   if(operation.kind==='transfer' && operation.accountId===operation.targetAccountId){setError('اختر حسابين مختلفين للتحويل.');return;}
   if((operation.kind==='expense'||operation.kind==='transfer'||operation.kind==='repay'&&selectedDebt?.direction==='payable')&&amount>(summary.balances[operation.accountId]??0)){setError('رصيد الحساب لا يكفي لهذه الحركة.');return;}
   if(operation.kind==='repay'&&amount>(summary.outstanding[operation.debtId!]??0)){setError('المبلغ أكبر من المتبقي من الدين.');return;}
  }
  setError('');if(await onCommand({type:'finance',operation}))setModal(null);else setError('تعذر تأكيد الحفظ. راجع الرصيد والتاريخ، أو أعد المحاولة. مدخلاتك ما زالت محفوظة هنا.');
 };
 const accountOptions=ledger.accounts.map(a=><option key={a.id} value={a.id}>{a.name} — {moneyLabel(summary.balances[a.id]??0)}</option>);
 const summaryCards=[['الرصيد في كل الحسابات',summary.totalMinor],['دخل الفترة',summary.incomeMinor],['مصروفات الفترة',summary.expenseMinor],['صافي دخل الفترة',summary.incomeMinor-summary.expenseMinor],['مبالغ لي',summary.receivableMinor],['مبالغ عليّ',summary.payableMinor],['الادخار',totalFor('savings')],['الطوارئ',totalFor('emergency')]] as const;
 return <section className="nf" data-testid="finance-center-r68"><header className="nf-heading"><div><p className="nf-eyebrow">أموالك بوضوح</p><h2>المالية</h2><p>الحسابات والصناديق بالريال، والديون بالريال أو الجنيه</p></div><button className="nf-button" disabled={busy} onClick={()=>open('account')} type="button">+ حساب أو صندوق</button></header>
  <nav className="nf-tabs" aria-label="أقسام المالية">{([['overview','نظرة عامة'],['entries','الحركات'],['accounts','الحسابات والصناديق'],['debts','لي وعليّ']] as const).map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'is-active':''} onClick={()=>setTab(id)} type="button">{label}</button>)}</nav>
  <div className="nf-toolbar"><div className="nf-actions"><button className="nf-button primary" disabled={busy||!ledger.accounts.length} onClick={()=>open('income')} type="button">+ دخل</button><button className="nf-button" disabled={busy||!ledger.accounts.length} onClick={()=>open('expense')} type="button">− مصروف</button><button className="nf-button" disabled={busy||ledger.accounts.length<2} onClick={()=>open('transfer')} type="button">تحويل</button><button className="nf-button" disabled={busy} onClick={()=>{setTab('debts');open('person');}} type="button">+ شخص</button></div><label className="nf-period">الفترة <input aria-label="شهر التقرير المالي" type="month" value={month} onChange={e=>setMonth(e.currentTarget.value)}/></label></div>
  {!ledger.accounts.length ? <div className="nf-empty"><h3>ابدأ بحسابك الأول</h3><p>أضف النقدي أو البنك، ثم أنشئ صندوق الادخار والطوارئ عند الحاجة. الرصيد الافتتاحي لا يُحتسب دخلًا.</p><button className="nf-button primary" onClick={()=>open('account')} type="button">إضافة حساب</button></div>:null}
  {tab==='overview'?<><div className="nf-metrics">{summaryCards.map(([label,value],i)=><article key={label} className={i===0?'nf-metric featured':'nf-metric'}><span>{label}</span><strong>{moneyLabel(value)}</strong></article>)}</div><p className="nf-help">الأرصدة والديون والصناديق تُعرض حتى آخر حركة مسجلة. الدخل والمصروفات والصافي تخص الفترة المحددة. الصناديق جزء من إجمالي الرصيد؛ والتحويل والسداد لا يُحسبان دخلًا أو مصروفًا. أرقام النظرة العامة بالريال فقط؛ إجماليات الجنيه منفصلة في سجل الديون.</p></>:null}
  {tab==='accounts'?<div className="nf-account-grid">{ledger.accounts.map(a=><article className="nf-account" key={a.id}><span className="nf-badge">{FINANCE_ACCOUNT_LABELS[a.kind]}</span><h3>{a.name}</h3><strong>{moneyLabel(summary.balances[a.id]??0)}</strong><p>افتتاحي: {moneyLabel(a.openingMinor)} · {a.date}</p><button className="nf-button" onClick={()=>{setAccountFilter(a.id);setTab('entries');}} type="button">عرض الحركات</button></article>)}</div>:null}
  {tab==='debts'?<DebtRegister ledger={ledger} today={today} busy={busy} onRepay={id=>open('repay',{debtId:id})} onAddPerson={()=>open('person')} onEditDebt={id=>open('editDebt',{debtId:id})} onEditPayment={id=>open('editPayment',{entryId:id})} onEditPerson={person=>open('editPerson',{personName:person.name,personNote:person.note,...(person.id?{personId:person.id}:{})})} onAddDebt={person=>open('debt',{personName:person.name,...(person.id?{personId:person.id}:{})})}/>:null}
  {tab==='overview'||tab==='entries'?<section className="nf-transactions"><div className="nf-list-heading"><h3>{tab==='overview'?'آخر الحركات في الفترة':'سجل الحركات'}</h3><div><input aria-label="بحث في الحركات المالية" placeholder="بحث بالوصف أو الشخص" value={query} onChange={e=>setQuery(e.currentTarget.value)}/><select aria-label="تصفية الحساب المالي" value={accountFilter} onChange={e=>setAccountFilter(e.currentTarget.value)}><option value="">كل الحسابات</option>{ledger.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div></div>
  {entries.length===0?<p className="nf-empty">لا توجد حركات تطابق الفترة والبحث.</p>:entries.slice(0,tab==='overview'?5:limit).map(e=><article className={`nf-entry${e.voidedAt?' is-void':''}`} key={e.id}><div><span className="nf-badge">{FINANCE_KIND_LABELS[e.kind]}</span><strong>{e.category}{e.debtId?` · ${debtName(e.debtId)}`:''}</strong><p>{e.date} · {accountName(e.accountId)}{e.targetAccountId?` ← ${accountName(e.targetAccountId)}`:''}</p>{e.note?<p>{e.note}</p>:null}{e.voidedAt?<p>ملغاة للتصحيح: {e.voidReason}</p>:null}</div><div className="nf-entry-amount"><strong>{moneyLabel(e.amountMinor,ledger.debts.find(d=>d.id===e.debtId)?.currency)}</strong>{!e.voidedAt?<button className="nf-link" disabled={busy} onClick={()=>open('void',{entryId:e.id})} type="button">إلغاء للتصحيح</button>:<span>ملغاة</span>}</div></article>)}
  {tab==='entries'&&entries.length>limit?<button className="nf-button" onClick={()=>setLimit(limit+25)} type="button">عرض المزيد</button>:null}</section>:null}
  {modal?createPortal(<div className="nf-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><div role="dialog" aria-modal="true" aria-label="تسجيل حركة مالية" className="nf-dialog" ref={panel} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=Array.from(panel.current?.querySelectorAll<HTMLElement>('input:not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled)')??[]);if(!nodes.length){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}}}><h2>{({editDebt:'تعديل مبلغ الدين',editPayment:'تعديل دفعة السداد',editPerson:'تعديل الشخص',person:'إضافة شخص',account:'إضافة حساب أو صندوق',income:'تسجيل دخل',expense:'تسجيل مصروف',transfer:'تحويل بين الحسابات',debt:'تسجيل دين',repay:selectedDebt?.direction==='receivable'?'تحصيل مبلغ لي':'سداد مبلغ عليّ',void:'إلغاء حركة للتصحيح'})[modal.kind]}</h2>
  <form onSubmit={e=>{void submit(e);}}><fieldset disabled={busy}>
  {modal.kind==='editDebt'||modal.kind==='editPayment'?<><p className="nf-help">يُحفظ التصحيح في السجل. العملة والاتجاه والحساب تظل كما هي؛ الأرصدة تتحدث بقيمة التصحيح.</p><label>المبلغ<input name="amount" inputMode="decimal" required defaultValue={editEntry?String(editEntry.amountMinor/100):''}/></label><GregorianDateInput id="edit-finance-date" name="date" label="التاريخ الميلادي" required defaultValue={editEntry?.date??today} max={today}/>{modal.kind==='editDebt'?<GregorianDateInput id="edit-finance-due" name="dueDate" label="الاستحقاق (اختياري)" defaultValue={selectedDebt?.dueDate??''}/>:null}<label>ملاحظة<textarea name="note" maxLength={1000} defaultValue={modal.kind==='editDebt'?selectedDebt?.note:editEntry?.note}/></label><label>سبب التصحيح<textarea name="reason" required maxLength={500}/></label></>:modal.kind==='person'||modal.kind==='editPerson'?<><label>اسم الشخص / الجهة<input name="name" required maxLength={100} defaultValue={modal.kind==='editPerson'?modal.personName:''}/></label><label>ملاحظات الشخص (اختياري)<textarea name="note" maxLength={1000} rows={2} defaultValue={modal.kind==='editPerson'?modal.personNote:''}/></label><p className="nf-help">داخل ملف الشخص تستطيع إضافة عدة مبالغ ودفعات سداد، مع فصل العملات.</p></>:modal.kind==='void'?<><p>{selectedEntry?`${FINANCE_KIND_LABELS[selectedEntry.kind]} · ${moneyLabel(selectedEntry.amountMinor,ledger.debts.find(d=>d.id===selectedEntry.debtId)?.currency)}`:''}</p><p className="nf-help">سيُعكس أثر الحركة على الأرصدة، ويبقى أصلها وسبب الإلغاء في السجل. لا يمكن إلغاء أصل دين قبل إلغاء دفعاته، أو إلغاء حركة إذا تسبب ذلك في رصيد سالب.</p><label>سبب التصحيح<textarea name="reason" required maxLength={500} rows={3}/></label></>:<>
   {modal.kind==='account'?<><label>اسم الحساب<input name="name" required maxLength={60} placeholder="مثال: الحساب البنكي"/></label><label>النوع<select name="accountKind" defaultValue="cash">{Object.entries(FINANCE_ACCOUNT_LABELS).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label></>:null}
   {modal.kind==='debt'?<><label>الاسم / الجهة<input name="person" required maxLength={100} defaultValue={modal.personName??''} readOnly={!!modal.personName}/></label><label>اتجاه الدين<select name="direction" defaultValue="receivable"><option value="receivable">لي عند شخص</option><option value="payable">عليّ لشخص</option></select></label></>:null}
   {modal.kind==='repay'?<p>{selectedDebt?.person} · المتبقي {moneyLabel(summary.outstanding[modal.debtId!]??0,selectedDebt?.currency)}</p>:null}
   {modal.kind==='debt'?<label>العملة<select name="debtCurrency" value={debtCurrency} onChange={e=>setDebtCurrency(e.currentTarget.value as 'SAR'|'EGP')}><option value="SAR">ريال سعودي</option><option value="EGP">جنيه مصري</option></select></label>:null}
   <label>{modal.kind==='account'?'الرصيد الافتتاحي':'المبلغ'} ({(modal.kind==='debt'?debtCurrency:modal.kind==='repay'?selectedDebt?.currency:'SAR')==='EGP'?'ج.م':'ر.س'})<input name="amount" inputMode="decimal" required defaultValue={modal.kind==='account'?'0':''} placeholder="0.00" autoComplete="off"/></label>
   <GregorianDateInput id="finance-date" name="date" label={modal.kind==='account'?'تاريخ الرصيد الافتتاحي الميلادي':'تاريخ الحركة الميلادي'} required defaultValue={today} max={today}/>
   {modal.kind!=='account'?<label>{modal.kind==='debt'?'أثر الدين على الحساب':modal.kind==='transfer'?'من حساب':'الحساب'}<select name="accountId" required={modal.kind!=='debt'&&modal.kind!=='repay'} defaultValue={modal.kind==='debt'||modal.kind==='repay'?'':ledger.accounts[0]?.id??''}>{modal.kind==='debt'||modal.kind==='repay'?<option value="">{modal.kind==='debt'?'دين سابق — بدون تغيير الرصيد':'سداد خارج الحسابات المسجلة'}</option>:null}{(modal.kind==='debt'?debtCurrency:modal.kind==='repay'?selectedDebt?.currency:'SAR')==='EGP'?null:accountOptions}</select>{modal.kind==='repay'?<small>بدون حساب: تسجيل سداد سابق أو خارج الحسابات فقط، دون تغيير أرصدة الحسابات. اختيار حساب يربط الدفعة برصيده، وبنفس العملة.</small>:null}{modal.kind==='debt'?<small>اختيار حساب يعني أن المبلغ صُرف منه إذا كان الدين «لي»، أو أُضيف إليه إذا كان «عليّ».</small>:null}</label>:null}
   {modal.kind==='transfer'?<><label>إلى حساب / صندوق<select name="targetAccountId" required defaultValue={ledger.accounts[1]?.id??''}>{accountOptions}</select></label><p className="nf-help">هذا تحويل داخلي، ولن يُحتسب مصروفًا أو دخلًا.</p></>:null}
   {modal.kind==='income'||modal.kind==='expense'?<label>الفئة<input name="category" list="nf-categories" required maxLength={60} defaultValue={modal.kind==='income'?'راتب':''}/><datalist id="nf-categories">{(modal.kind==='income'?['راتب','عمل حر','دخل آخر']:['طعام','سكن','مواصلات','صحة','تعليم','التزامات','مصروف آخر']).map(x=><option value={x} key={x}/>)}</datalist></label>:null}
   {modal.kind==='debt'?<GregorianDateInput id="finance-due-date" name="dueDate" label="تاريخ الاستحقاق الميلادي (اختياري)"/>:null}
   {modal.kind!=='account'?<label>ملاحظة (اختياري)<textarea name="note" maxLength={1000} rows={2}/></label>:<p className="nf-help">الرصيد الافتتاحي يُستخدم لبدء المتابعة ولا يدخل ضمن الدخل.</p>}
  </>}
  <div className="nf-modal-actions"><button className="nf-button" onClick={close} type="button">إلغاء</button><button className="nf-button primary" type="submit">{busy?'جارٍ الحفظ…':modal.kind==='void'?'تأكيد الإلغاء':'حفظ'}</button></div></fieldset>{error?<p role="alert" className="nf-error">{error}</p>:null}</form></div></div>,document.body):null}
 </section>;
}

function ControlCenter({ busy, orderingPending=false, workspace, executions, onCommand, onClose, defaultStartDate, appearance, onAppearance }: { busy: boolean; orderingPending?:boolean; workspace: WorkspaceViewModel | null; executions: readonly ExecutionItem[]; onCommand: (command: NoorPersonalCommandInput) => Promise<boolean>; onClose: () => void; defaultStartDate: string; appearance: NoorAppearance; onAppearance: (value: NoorAppearance) => void }): ReactElement {
  const [section,setSection] = useState<"Habit" | "Task" | "appearance" | "finance" | "categories" | "ordering" | "statistics">("Habit");
  const [query,setQuery] = useState("");
  const [filter,setFilter] = useState("active");
  const [selectedId,setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if(!selectedId)return;
    const timer=window.setTimeout(()=>{
      const panel=document.getElementById(`np-detail-${selectedId}`);
      if(panel&&typeof panel.scrollIntoView==="function"){
        const reduce=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        panel.scrollIntoView({block:"nearest",inline:"nearest",behavior:reduce?"auto":"smooth"});
      }
    },0);
    return ()=>window.clearTimeout(timer);
  },[selectedId]);

  const [creating,setCreating] = useState(false);
  const [editing,setEditing] = useState<DefinitionItem|undefined>(undefined);
  const [formSession,setFormSession] = useState(0);
  const [formError,setFormError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!creating) return;
    const opener=document.activeElement as HTMLElement | null;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    dialogRef.current?.querySelector<HTMLInputElement>("#definition-title")?.focus();
    return () => { document.body.style.overflow=previousOverflow;if(opener?.isConnected)opener.focus(); };
  }, [creating]);
  const closeCreate = () => { if(!busy)setCreating(false); };
  const trapDialogKeys = (event: import("react").KeyboardEvent<HTMLDivElement>) => {
    if(event.key==="Escape"){event.preventDefault();event.stopPropagation();closeCreate();return;}
    if(event.key!=="Tab")return;
    const nodes=Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]')??[]);
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };

  const [confirmArchive,setConfirmArchive] = useState<string | null>(null);
  const [deleteId,setDeleteId]=useState<string|null>(null);
  const definitions = workspace?.definitions ?? [];
  const kind = section === "Task" ? "Task" : "Habit";
  const currentExecution = (id: string) => executions.find(item => item.definitionId === id);
  const all = definitions.filter(item => item.kind === kind);
  const matches = all.filter(item => {
    const execution = currentExecution(item.id);
    const stateMatch = filter === "all" || (filter === "active" && item.state === "Active") || (filter === "paused" && item.state === "Paused") || (filter === "archived" && item.state === "Archived") || (filter === "completed" && execution?.status === "Completed");
    const needle=query.trim().toLocaleLowerCase("ar");
    return stateMatch && (!needle || `${item.title} ${item.category}`.toLocaleLowerCase("ar").includes(needle));
  });
  const selected=matches.find(item=>item.id===selectedId) ?? null;
  const changeSection = (value: typeof section) => { setSection(value);setQuery("");setFilter("active");setSelectedId(null);setCreating(false);setConfirmArchive(null); };
  const apply = async (command: NoorPersonalCommandInput): Promise<boolean> => { const ok=await onCommand(command);if(command.type==="create-definition"||command.type==="update-definition")setFormError(ok?null:"تعذر الحفظ. راجع البيانات وحاول مرة أخرى.");if(ok){if(command.type==="delete-definition"){setSelectedId(null);setDeleteId(null);}setConfirmArchive(null);if(command.type==="create-definition"||command.type==="update-definition"){setCreating(false);setEditing(undefined);};}return ok; };
  const icon=(value:string)=><svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{value==="finance"?<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M15 14h3"/></>:value==="Habit"?<><rect x="4" y="4" width="16" height="16" rx="5"/><path d="m8 12 3 3 5-6"/></>:value==="Task"?<><path d="M10 6h10M10 12h10M10 18h10M4 6h1M4 12h1M4 18h1"/></>:<><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor"/></>}</svg>;
  return <div className="np-cc-shell" data-testid="control-center-r65">
    <header className="np-cc-header"><div className="np-cc-heading"><div className="np-logo-frame np-cc-header-logo"><img alt="شعار نور" className="np-platform-logo" src="/noor-platform-logo.jpeg" /></div><div className="np-cc-heading-copy"><h1 className="np-control-title">مركز التحكم</h1></div></div><button aria-label="العودة إلى اليوم" className="np-cc-button" onClick={onClose} type="button">العودة لليوم ←</button></header>
    <section className="np-card np-control np-cc"><div className="np-cc-layout">
      <nav aria-label="أقسام مركز التحكم" className="np-cc-nav">{([["Habit","العادات"],["Task","المهام"],["categories","التصنيفات"],["ordering","الترتيب"],["statistics","الإحصائيات"],["finance","المالية"],["appearance","المظهر"]] as const).map(([id,label])=><button aria-current={section===id?"page":undefined} className={`np-cc-nav-item${section===id?" is-selected":""}`} key={id} onClick={()=>changeSection(id)} type="button">{icon(id)}<span>{label}</span>{(id==="Habit"||id==="Task")?<small>{definitions.filter(d=>d.kind===id&&d.state==="Active").length}</small>:null}</button>)}<p className="np-cc-nav-note">إدارة هادئة لعاداتك ومهامك.<br/>إنجاز اليوم في شاشة اليوم.</p></nav>
      <main className="np-cc-main">
        {section==="statistics"?<StatisticsCenter workspace={workspace}/>:section==="ordering"?<DisplayOrderManager workspace={workspace} busy={busy&&!orderingPending} onCommand={onCommand}/>:section==="categories"?<CategoryManager categories={workspace?.categories??COMMON_CATEGORIES} busy={busy} onCommand={onCommand}/>:section==="finance"?<FinanceCenter ledger={workspace?.finance ?? null} busy={busy} onCommand={onCommand} today={defaultStartDate}/>:section==="appearance"?<><div className="np-cc-title"><div><h2>مظهر نور</h2><p>اختيارك يُحفظ على هذا المتصفح.</p></div></div><div aria-label="اختيار المظهر" className="np-cc-themes">{([["noor","نور","دفء كريمي ولمسات ذهبية"],["light","فاتح","أبيض ورمادي بألوان هادئة"],["dark","داكن","سطوح فحمية ونصوص واضحة"]] as const).map(([id,title,copy])=><button aria-pressed={appearance===id} className={`np-cc-theme ${id}`} key={id} onClick={()=>onAppearance(id)} type="button"><span aria-hidden="true" className="np-cc-theme-preview"><i/><i/><i/></span><strong>{title}</strong><span>{copy}</span><small>{appearance===id?"المظهر الحالي":"اختيار المظهر"}</small></button>)}</div></>:<>
          <div className="np-cc-title"><div><h2>{kind==="Habit"?"العادات":"المهام"}</h2><p>{kind==="Habit"?"ابنِ روتينك، خطوة بخطوة.":"رتّب ما تريد إنجازه."}</p></div><button className="np-cc-button primary" onClick={()=>{setEditing(undefined);setFormError(null);setFormSession(value=>value+1);setCreating(true);}} type="button" aria-expanded={creating}>{kind==="Habit"?"+ إضافة عادة":"+ إضافة مهمة"}</button></div>
          <div className="np-cc-tools"><input aria-label="البحث في العناصر" className="np-input" onChange={event=>setQuery(event.target.value)} onInput={event=>setQuery(event.currentTarget.value)} placeholder="ابحث بالاسم أو القسم…" type="search" value={query}/><select aria-label="تصفية الحالة" className="np-select" onChange={event=>{setFilter(event.target.value);setConfirmArchive(null);}} value={filter}><option value="active">النشطة</option><option value="paused">المتوقفة</option><option value="all">الكل</option>{kind==="Task"?<option value="completed">المكتملة اليوم</option>:null}<option value="archived">المؤرشفة</option></select></div>
          <div className="np-cc-results" aria-live="polite">{matches.length} {kind==="Habit"?"عادة":"مهمة"}</div>
          {!workspace?<p role="status" className="np-empty">تعذر تحميل العناصر حاليًا. أعد فتح مركز التحكم بعد تحديث الصفحة.</p>:matches.length===0?<div className="np-empty"><strong>لا توجد عناصر مطابقة</strong><span>غيّر البحث أو الفلتر، أو أضف عنصرًا جديدًا.</span></div>:<div aria-label={kind==="Habit"?"قائمة العادات":"قائمة المهام"} className="np-cc-list">{matches.map(item=><div className="np-cc-expandable" key={item.id}><button aria-expanded={selected?.id===item.id} aria-controls={`np-detail-${item.id}`} className={`np-cc-row${selected?.id===item.id?" is-selected":""}`} onClick={()=>{setSelectedId(selectedId===item.id?null:item.id);setConfirmArchive(null);}} type="button"><span className="np-cc-row-icon">{icon(item.kind)}</span><span className="np-cc-row-copy"><strong>{item.title}</strong><span>{item.category} · {scheduleLabel(item)}</span></span><span className={`np-cc-status ${item.state.toLowerCase()}`}>{item.state==="Paused"?"متوقفة":item.state==="Archived"?"مؤرشفة":currentExecution(item.id)?.status==="Completed"?"مكتملة اليوم":"نشطة"}</span></button>{selected?.id===item.id?<div aria-label="تفاصيل العنصر" className="np-cc-inline-detail" id={`np-detail-${item.id}`}><p className="np-cc-kicker">{selected.kind==="Habit"?"تفاصيل العادة":"تفاصيل المهمة"}</p><h2>{selected.title}</h2><dl><dt>القسم</dt><dd>{selected.category}</dd><dt>الحالة</dt><dd>{selected.state==="Active"?"نشطة":selected.state==="Paused"?"متوقفة مؤقتًا":selected.state==="Stopped"?"متوقفة نهائيًا":"مؤرشفة"}</dd><dt>تاريخ البداية</dt><dd>{selected.startDate}</dd><dt>تاريخ النهاية</dt><dd>{selected.endDate??"غير محدد"}</dd><dt>الجدول</dt><dd>{scheduleLabel(selected)}</dd>{selected.timeOfDay?<><dt>موعد التنفيذ</dt><dd>{selected.timeOfDay}</dd></>:null}<dt>الأهمية</dt><dd>{({Essential:"أساسي",Important:"مهم",Supporting:"داعم",Optional:"اختياري"} as Record<string,string>)[selected.importance]??selected.importance}</dd></dl><div className="np-cc-actions">
        <button className="np-cc-button primary" disabled={busy||!selected.revisionId} type="button" onClick={()=>{setEditing(selected);setFormError(null);setFormSession(v=>v+1);setCreating(true);}}>تعديل البيانات والجدول</button>
        {selected.state!=="Archived"?<button className="np-cc-button" disabled={busy} onClick={()=>{void apply({type:"set-definition-state",definitionId:selected.id,state:selected.state==="Paused"?"Active":"Paused"});}} type="button">{selected.state==="Paused"?"إعادة التشغيل":"إيقاف مؤقت"}</button>:null}
        {selected.kind==="Task"&&selected.state!=="Archived"&&currentExecution(selected.id)?<button className="np-cc-button primary" disabled={busy||currentExecution(selected.id)?.status==="Suppressed"} onClick={()=>{const item=currentExecution(selected.id);if(item)void apply({type:"set-execution-completed",executionId:item.id,completed:item.status!=="Completed"});}} type="button">{currentExecution(selected.id)?.status==="Completed"?"إعادة فتح المهمة":"إنهاء مهمة اليوم"}</button>:selected.kind==="Task"&&selected.state!=="Archived"?<p className="np-cc-help">يظهر زر الإنجاز عندما يكون للمهمة تنفيذ مجدول اليوم.</p>:null}
        {selected.state!=="Archived"?<button className="np-cc-button danger" disabled={busy} onClick={()=>setConfirmArchive(selected.id)} type="button">أرشفة {selected.kind==="Habit"?"العادة":"المهمة"}</button>:<p className="np-cc-help">العنصر مؤرشف، وسجله محفوظ.</p>}
        <button className="np-cc-button danger" disabled={busy} onClick={()=>{setDeleteId(selected.id);}} type="button">حذف نهائي من قاعدة البيانات</button>

        {confirmArchive===selected.id?<div className="np-cc-confirm" role="alert"><p>أرشفة هذا العنصر؟ سيُحفظ تاريخه.</p><button className="np-cc-button danger" disabled={busy} onClick={()=>{void apply({type:"archive-definition",definitionId:selected.id});}} type="button">تأكيد الأرشفة</button><button className="np-cc-button" disabled={busy} onClick={()=>setConfirmArchive(null)} type="button">إلغاء</button></div>:null}
      </div></div>:null}</div>)}</div>}
        </>}

      </main>
    </div></section>
    {deleteId&&definitions.some(d=>d.id===deleteId)?<PermanentDeleteDialog key={deleteId} title={definitions.find(d=>d.id===deleteId)!.title} busy={busy} onClose={()=>setDeleteId(null)} onDelete={()=>apply({type:"delete-definition",definitionId:deleteId,confirm:true})}/>:null}
    <div className="np-cc-modal-backdrop" hidden={!creating} onClick={event=>{if(event.target===event.currentTarget)closeCreate();}}>
      <div aria-labelledby="np-create-dialog-title" aria-modal="true" className="np-cc-modal" onKeyDown={trapDialogKeys} ref={dialogRef} role="dialog" tabIndex={-1}>
        <div className="np-cc-modal-head"><div><p className="np-cc-kicker">إضافة إلى نور</p><h2 id="np-create-dialog-title">{editing?"تعديل البيانات والجدول":kind==="Habit"?"عادة جديدة":"مهمة جديدة"}</h2></div><button aria-label="إغلاق نافذة الإضافة" className="np-cc-button" disabled={busy} onClick={closeCreate} type="button">إغلاق ×</button></div>
        <div className="np-cc-modal-body">{formError?<p className="np-action-error" role="alert">{formError}</p>:null}<DefinitionForm key={`${kind}-${formSession}`} busy={busy} defaultStartDate={defaultStartDate} defaultKind={kind} {...(editing?{initial:editing}:{})} categories={workspace?.categories??COMMON_CATEGORIES} onCommand={apply}/></div>
        <div className="np-cc-modal-footer"><span>الحقول المعلّمة بنجمة مطلوبة.</span><button className="np-cc-button" disabled={busy} onClick={closeCreate} type="button">إلغاء</button></div>
      </div>
    </div>
  </div>;
}

const END_REASON_LABELS = {achieved:"تم الإنجاز",expired:"انتهى الوقت دون اكتمال",cancelled:"إلغاء المهمة"};
function ActivityCard({item,definition,busy,pending=false,onCommand}:{item:ExecutionItem;definition?:DefinitionItem|undefined;busy:boolean;pending?:boolean;onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>}):ReactElement {
 const [mode,setMode]=useState<"note"|"finish"|null>(null);
 const [error,setError]=useState("");
 const [noteEdit,setNoteEdit]=useState<{entry:ActivityEntry;body:string;deleting:boolean}|null>(null);
 const [noteError,setNoteError]=useState("");
 const noteOpener=useRef<HTMLElement|null>(null);
 useEffect(()=>{if(!noteEdit)return;panel.current?.querySelector<HTMLElement>('[data-note-editor] textarea,[data-note-editor] button')?.focus();return()=>noteOpener.current?.focus();},[noteEdit?.entry.id,noteEdit?.deleting]);
 const editNote=(entry:ActivityEntry,deleting:boolean)=>{noteOpener.current=document.activeElement as HTMLElement;setNoteError("");setNoteEdit({entry,body:entry.note,deleting});};
 const saveNote=async()=>{if(!noteEdit||busy||pending)return;if(!noteEdit.deleting&&!noteEdit.body.trim()){setNoteError("اكتب الملاحظة، أو استخدم زر حذف الملاحظة.");return;}const edit=noteEdit;setNoteError("");let ok=false;try{ok=await onCommand({type:"edit-activity-note",executionId:edit.entry.executionId,entryId:edit.entry.id,expectedNote:edit.entry.note,note:edit.deleting?null:edit.body.trim()});}catch{ok=false;}if(ok){setNoteEdit(null);setMode(null);}else setNoteError("تعذر حفظ التعديل. النص ما زال هنا؛ أعد المحاولة أو ألغِ التعديل وحدّث الصفحة.");};
 const [entryId,setEntryId]=useState("");
 const panel=useRef<HTMLDivElement>(null);
 const opener=useRef<HTMLElement|null>(null);
 const log=definition?.activityLog ?? [];
 const total=Math.round(log.reduce((sum,e)=>sum+e.amount,0)*1e6)/1e6;
 const completed=item.status==="Completed";
 const task=item.kind==="Task";
 const displayTitle=definition?.title??item.title;
 const ended=definition?.state==="Stopped";
 const canRecord=item.status!=="Suppressed" && definition?.state==="Active";
 const disabled=busy || !canRecord;
 const relevant=task ? log : log.filter(e=>e.executionId===item.id);
 const latest=relevant.at(-1);
 const visibleHistory=relevant.filter(e=>e.note||e.amount>0||e.endReason);
 const latestNote=relevant.slice().reverse().find(e=>e.note);
 const open=(value:"note"|"finish")=>{opener.current=document.activeElement as HTMLElement;setError("");setNoteEdit(null);setNoteError("");setEntryId(globalThis.crypto.randomUUID());setMode(value);};
 useEffect(()=>{
  if(!mode)return;
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  const first=panel.current?.querySelector<HTMLElement>("textarea,input,select,button");first?.focus();
  return()=>{document.body.style.overflow=previous;opener.current?.focus();};
 },[mode]);
 const close=()=>{if(!busy)setMode(null);};
 const save=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy)return;
  const data=new FormData(event.currentTarget);
  const amount=Number(data.get("amount") || 0);
  const note=String(data.get("note") ?? "").trim();
  const endReason=mode==="finish" ? String(data.get("endReason")) as "achieved"|"expired"|"cancelled" : null;
  if(!note && !amount && !endReason){setError("اكتب ملاحظة أو أضف كمية منجزة.");return;}
  if(definition?.measurement && Math.round((total+amount)*1e6)/1e6>definition.measurement.target){setError("الكمية الجديدة تتجاوز الهدف المتبقي.");return;}
  if(endReason==="achieved" && definition?.measurement && Math.round((total+amount)*1e6)/1e6<definition.measurement.target){setError("سجّل الكمية المتبقية أولًا، أو اختر سبب إنهاء آخر.");return;}
  setError("");
  if(await onCommand({type:"record-activity",executionId:item.id,entryId,note,amount,endReason}))setMode(null);
  else setError("تعذر تأكيد الحفظ. بياناتك ما زالت هنا؛ يمكنك إعادة المحاولة.");
 };
 return <div className={`np-item np-activity-item${task?"":" np-habit-row"}${completed?" is-completed":""}`} data-testid={`activity-card-${item.id}`}>
  <div className="np-item-main"><p className="np-item-title">{displayTitle}</p>{definition?.timeOfDay?<time className="np-habit-time" dateTime={definition.timeOfDay}>◷ {definition.timeOfDay}</time>:null}{task?<div className="np-item-meta"><span className="np-kind-badge">مهمة</span><span>{ended && latest?.endReason ? END_REASON_LABELS[latest.endReason] : STATUS_LABELS[item.status] ?? item.status}</span></div>:null}
  {definition?.measurement ? <div className="np-progress-copy"><span>{arabicNumber(total)} / {arabicNumber(definition.measurement.target)} {definition.measurement.unit}</span><progress aria-label={`تقدم ${displayTitle}`} max={definition.measurement.target} value={total}/></div> : null}
  {latestNote?.note ? <p className="np-activity-note">{latestNote.note}</p> : null}</div>
  <div className="np-activity-actions"><button aria-label={`تسجيل ملاحظة${task?" أو تقدم":""}: ${displayTitle}`} title="تسجيل ملاحظة" className="np-btn secondary np-pencil" onClick={()=>open("note")} type="button"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
  {task ? <button className="np-btn complete" disabled={disabled||pending} onClick={()=>open("finish")} type="button">{ended?"منتهية":"إنهاء"}</button> : <label className="np-habit-check-target"><input aria-label={`إتمام عادة ${displayTitle} اليوم`} className="np-habit-check" type="checkbox" checked={completed} aria-busy={pending} disabled={disabled} onChange={event=>{void onCommand({type:"set-execution-completed",executionId:item.id,completed:event.currentTarget.checked});}}/></label>}</div>
  {mode ? createPortal(<div className="np-activity-backdrop" onClick={event=>{if(event.target===event.currentTarget)close();}}><div aria-modal="true" aria-label={`${mode==="finish"?"إنهاء":"تسجيل"} ${displayTitle}`} className="np-activity-dialog" ref={panel} role="dialog" onKeyDown={event=>{
   if(event.key==="Escape"){event.preventDefault();if(noteEdit){if(!busy){setNoteEdit(null);setNoteError("");}}else close();}
   if(event.key==="Tab"){
    const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)') ?? []);
    const first=controls[0],last=controls.at(-1);
    if(!first){event.preventDefault();return;}
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
   }
  }}><h2>{mode==="finish"?"إنهاء المهمة":"تسجيل ملاحظة أو إنجاز"}</h2><p>{displayTitle}</p>
  {canRecord ? <form onSubmit={event=>{void save(event);}}>
  {task && definition?.measurement ? <label>الكمية المنجزة الجديدة ({definition.measurement.unit})<input name="amount" type="number" min="0" max={Math.max(0,definition.measurement.target-total)} step="0.000001" defaultValue="0" disabled={busy}/><small>المسجل سابقًا: {arabicNumber(total)} — أضف إنجاز هذه المرة فقط.</small></label> : null}
  {mode==="finish" ? <label>سبب الإنهاء<select name="endReason" required disabled={busy} defaultValue=""><option disabled value="">اختر السبب</option><option value="achieved">تم الإنجاز</option><option value="expired">انتهى الوقت دون اكتمال</option><option value="cancelled">إلغاء المهمة</option></select></label> : null}
  <label>{task?"تفاصيل الإنجاز / الملاحظة":"ملاحظة اليوم"}<textarea name="note" rows={3} maxLength={2000} disabled={busy}/></label>
  {mode==="finish" ? <p className="np-activity-help">سيُحفظ السبب وتتوقف المهمة عن الظهور في الأيام التالية. الإنهاء دون إنجاز لا يُحسب إنجازًا.</p> : null}
  {error ? <p role="alert" className="np-action-error">{error}</p> : null}
  <div className="np-activity-footer"><button className="np-btn secondary" disabled={busy} onClick={close} type="button">إلغاء</button><button className="np-btn complete" disabled={busy} type="submit">{busy?"جارٍ الحفظ…":"حفظ"}</button></div></form> : <button className="np-btn secondary" onClick={close} type="button">إغلاق</button>}
  <details className="np-activity-history" open={!canRecord||visibleHistory.some(e=>e.note)||undefined} data-note-management="r86"><summary>السجل ({arabicNumber(visibleHistory.length)})</summary>{visibleHistory.length===0?<p>لا توجد تسجيلات بعد.</p>:visibleHistory.slice().reverse().map(e=><div key={e.id} data-note-entry={e.id}><time dateTime={e.at}>{e.localDate}</time>{e.amount>0?<span> +{arabicNumber(e.amount)} {definition?.measurement?.unit}</span>:null}{e.endReason?<strong> · {END_REASON_LABELS[e.endReason]}</strong>:null}{e.note?<p>{e.note}</p>:null}
  {noteEdit?.entry.id===e.id?<div data-note-editor="r86" className="np-note-editor">{noteEdit.deleting?<p>حذف نص الملاحظة؟ سيبقى الإنجاز المسجّل وحالة المهمة كما هما.</p>:<label>تعديل الملاحظة<textarea aria-label="تعديل نص الملاحظة" maxLength={2000} rows={3} disabled={busy} value={noteEdit.body} onInput={event=>setNoteEdit({...noteEdit,body:event.currentTarget.value})}/></label>}{noteError?<p role="alert">{noteError}</p>:null}<div className="np-note-tools"><button className="np-btn secondary" type="button" disabled={busy} onClick={()=>{setNoteEdit(null);setNoteError("");}}>إلغاء تعديل الملاحظة</button><button className={`np-btn ${noteEdit.deleting?"np-note-delete":"complete"}`} type="button" disabled={busy||pending} onClick={()=>{void saveNote();}}>{busy?"جارٍ الحفظ…":noteEdit.deleting?"تأكيد حذف الملاحظة":"حفظ تعديل الملاحظة"}</button></div></div>:e.note?<div className="np-note-tools"><button className="np-btn secondary" type="button" disabled={busy||pending} onClick={()=>editNote(e,false)}>تعديل الملاحظة</button><button className="np-btn np-note-delete" type="button" disabled={busy||pending} onClick={()=>editNote(e,true)}>حذف الملاحظة</button></div>:null}</div>)}</details>

  </div></div>,document.body) : null}
 </div>;
}

function Dashboard({ view:providedView, workspace, busy, actionError, onCommand, onOpenControl, nowMs,pendingIds=[],lockedIds=[] }: { view: TodayViewModel; workspace: WorkspaceViewModel | null; busy: boolean; actionError: string | null; onCommand: (command: NoorPersonalCommandInput) => Promise<boolean>; onOpenControl: () => void; nowMs: number;pendingIds?:readonly string[];lockedIds?:readonly string[] }): ReactElement {
  // Today's execution projection is authoritative for recurrence and the personal-day boundary.
  const definitionsById = new Map((workspace?.definitions ?? []).map(definition => [definition.id, definition] as const));
  const view=useMemo(()=>{const visible=(item:ExecutionItem)=>{const d=definitionsById.get(item.definitionId);return item.status!=="Suppressed"&&d?.state!=="Archived"&&d?.state!=="Paused"&&(d?.state!=="Stopped"||["Completed","Missed","Cancelled"].includes(item.status));};return {...providedView,tasks:providedView.tasks.filter(visible),habits:providedView.habits.filter(visible)};},[providedView,workspace]);
  const dates = civilDateLabels(nowMs, view.timeZone);
  const location = headerLocationForTimeZone(view.timeZone);
  const [temperature,setTemperature] = useState<number | null>(null);
  const taskCompleted = completedCount(view.tasks);
  const habitCompleted = completedCount(view.habits);
  const totalToday = [...view.tasks,...view.habits].filter(e=>e.status!=="Cancelled").length;
  const completedToday = taskCompleted + habitCompleted;
  const todayWeight=[...view.tasks,...view.habits].filter(e=>e.status!=="Cancelled").reduce((n,e)=>n+e.weight,0),doneWeight=[...view.tasks,...view.habits].filter(e=>e.status==="Completed").reduce((n,e)=>n+e.weight,0);
  const completionRate=todayWeight?Math.round(doneWeight/todayWeight*100):0;
  const achievementDate=view.localDate??workspace?.statistics.currentDate??civilLocalDate(nowMs,view.timeZone);
  const todayRows:StatisticRow[]=[...view.tasks,...view.habits].map(item=>({id:item.id,definitionId:item.definitionId,title:item.title,kind:item.kind,date:achievementDate,weight:item.weight,status:item.status,amount:0,unit:""}));
  const achievementWeek=wholeWeekAchievement(workspace?.statistics.rows??[],achievementDate,todayRows),yesterday=yesterdayAchievement(workspace?.statistics.rows??[],achievementDate);
  const weekFormats=useMemo(()=>({date:new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{day:"numeric",month:"numeric",timeZone:"UTC"}),weekday:new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn",{weekday:"long",timeZone:"UTC"})}),[]);
  const weekDateLabel=(date:string,weekday=false)=>(weekday?weekFormats.weekday:weekFormats.date).format(new Date(date+"T00:00:00Z"));

  const grouped = useMemo(() => {
    const map=new Map<string,{definition?:DefinitionItem;execution:ExecutionItem}[]>();
    for(const execution of view.habits){const definition=definitionsById.get(execution.definitionId),category=(definition?.category??'عام').trim().replace(/\s+/g,' ');const rows=map.get(category)??[];rows.push({...(definition?{definition}:{}),execution});map.set(category,rows);}
    for(const rows of map.values())rows.sort((a,b)=>(a.definition?.displayOrder??Number.MAX_SAFE_INTEGER)-(b.definition?.displayOrder??Number.MAX_SAFE_INTEGER)||(a.definition?.timeOfDay??'99:99').localeCompare(b.definition?.timeOfDay??'99:99')||(a.definition?.title??a.execution?.title??'').localeCompare(b.definition?.title??b.execution?.title??'','ar'));
    const categories=(workspace?.categories??[]).map(c=>c.trim().replace(/\s+/g,' '));const rank=(c:string)=>{const i=categories.indexOf(c);return i<0?Number.MAX_SAFE_INTEGER:i;};
    return [...map.entries()].sort(([a],[b])=>rank(a)-rank(b)||a.localeCompare(b,'ar'));
  }, [view.habits, workspace]);
  const nextPrayer=liveNextPrayer(view.prayerTimes,view.nextPrayer,nowMs);
  const countdown = nextPrayer ? remainingPrayerSeconds(nextPrayer.at, nowMs) : 0;
  const gregorianParts = new Intl.DateTimeFormat(
    "ar-SA-u-ca-gregory-nu-latn",
    { weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:view.timeZone },
  ).formatToParts(new Date(nowMs));
  const weekday = datePart(gregorianParts,"weekday");

  useEffect(() => {
    let cancelled = false;
    const refreshWeather = async () => {
      const value = await loadCurrentTemperature(location);
      if (!cancelled) setTemperature(value);
    };
    void refreshWeather();
    const timer = window.setInterval(() => { void refreshWeather(); },15 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [location.city,location.country,location.latitude,location.longitude]);

  const nextKey = nextPrayer?.key ?? null;

  const night = nightCountdownState(view.prayerTimes,nowMs);
  const eventTimes = [
    ...view.prayerTimes.map(p=>p.key===nextPrayer?.key?{...p,at:nextPrayer.at}:p),
    ...(night ? [
      { key:"midnight", label:"منتصف الليل", at:night.midnight },
      { key:"last-third", label:"الثلث الأخير", at:night.lastThird },
    ] : []),
  ];

  const dateOnlyParts = new Intl.DateTimeFormat(
    "ar-SA-u-ca-gregory-nu-latn",
    { day:"numeric", month:"long", year:"numeric", timeZone:view.timeZone },
  ).formatToParts(new Date(nowMs));
  const gregorianDate = `${datePart(dateOnlyParts,"day")} ${datePart(dateOnlyParts,"month")} ${datePart(dateOnlyParts,"year")}`;
  const hijriDateParts = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn",{day:"numeric",month:"long",year:"numeric",timeZone:view.timeZone}).formatToParts(new Date(nowMs));
  const compactCalendarDate = (calendar: "gregory" | "islamic-umalqura"): string => {
    const parts = new Intl.DateTimeFormat("en-GB-u-nu-latn",{calendar,day:"2-digit",month:"2-digit",year:"numeric",timeZone:view.timeZone}).formatToParts(new Date(nowMs));
    return `${datePart(parts,"day")}/${datePart(parts,"month")}/${datePart(parts,"year")}`;
  };


  const prayerSymbol = (key: string): ReactElement => {
    if (key === "isha" || key === "midnight" || key === "last-third") {
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M17.7 15.8A7.7 7.7 0 0 1 8.2 6.3a8 8 0 1 0 9.5 9.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/></svg>;
    }
    if (key === "sunrise" || key === "maghrib") {
      return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M4 18h16M7 15a5 5 0 0 1 10 0M12 3v3M4.9 7.9 7 10M19.1 7.9 17 10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/></svg>;
    }
    return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 2.8v2.3M12 18.9v2.3M2.8 12h2.3M18.9 12h2.3M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/></svg>;
  };

  return <>
    <div className="np-topbar" data-testid="platform-topbar">
      <div className="np-top-actions">
        <button aria-label="فتح مركز التحكم" className="np-icon-btn np-control-icon" onClick={onOpenControl} title="مركز التحكم" type="button">
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><circle cx="7" cy="7" r="1.35" fill="currentColor"/><rect x="3" y="14.5" width="18" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.6"/><circle cx="17" cy="17" r="1.35" fill="currentColor"/></svg>
        </button>
      </div>

      <div className="np-header-calendar" data-testid="header-information">
        <div className="np-header-day">{weekday}</div>
        <div className="np-header-date-pair">
          <div className="np-header-date-block">
            <span aria-label={gregorianDate} className="np-header-date-main"><span aria-hidden="true" className="np-date-full"><span className="np-date-month">{datePart(dateOnlyParts,"day")} {datePart(dateOnlyParts,"month")}</span><span className="np-date-year"> {datePart(dateOnlyParts,"year")}</span></span><span aria-hidden="true" className="np-date-compact">{compactCalendarDate("gregory")}</span></span>
            <span className="np-header-date-caption">التاريخ الميلادي</span>
          </div>
          <span className="np-header-date-divider" />
          <div className="np-header-date-block">
            <span aria-label={dates.hijri} className="np-header-date-main hijri"><span aria-hidden="true" className="np-date-full"><span className="np-date-month">{datePart(hijriDateParts,"day")} {datePart(hijriDateParts,"month")}</span><span className="np-date-year"> {datePart(hijriDateParts,"year")} هـ</span></span><span aria-hidden="true" className="np-date-compact">{compactCalendarDate("islamic-umalqura")}</span></span>
            <span className="np-header-date-caption">التاريخ الهجري</span>
          </div>
        </div>
      </div>

      <div className="np-header-status">
        <div className="np-header-clock" data-testid="live-clock">{formatLiveClock(nowMs,view.timeZone)}</div>
        <div className="np-header-location" data-testid="header-location">
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
          <span>{location.city}{location.country ? `، ${location.country}` : ""}</span>
        </div>
        <div className="np-header-weather">
          <span className="np-weather-icon" aria-hidden="true" />
          <span className="np-header-temperature" data-testid="header-temperature">{temperature === null ? "—°" : `${arabicNumber(Math.round(temperature))}°`}</span>
          <span className="np-weather-caption">درجة الحرارة</span>
        </div>
      </div>

      <div className="np-brand">
        <div className="np-logo-frame"><img alt="شعار نور" className="np-platform-logo" src="/noor-platform-logo.jpeg" /></div>
      </div>
    </div>

    <section aria-label="الصلوات" className="np-card np-prayer-card" data-header-layout="padding-only-132" data-prayer-layout="compact-1x8-until-600-92" data-testid="prayer-card">
      <div className="np-prayer-card-head">
        <span className="np-prayer-card-icon" aria-hidden="true">
          <svg fill="none" viewBox="0 0 32 32"><path d="M7 25h18M10 25V14h12v11M12 14c0-3.1 1.5-5.4 4-7 2.5 1.6 4 3.9 4 7M16 7V4M14.5 4h3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/></svg>
        </span>
        <h2 className="np-prayer-card-title">الصلوات وأوقات الليل</h2>
      </div>
      {!nextPrayer && view.nextPrayer ? <p className="np-action-error" role="status">جارٍ تحديث مواقيت الصلاة…</p> : null}
      <div data-countdown-version="NOOR_COUNTDOWN_ROLLOVER_R81" aria-label="مواقيت الصلاة وأوقات الليل" className="np-prayer-times" data-testid="prayer-times-strip" role="region" tabIndex={0}>
        {eventTimes.map(prayer => {
          const [prayerClock,prayerPeriod] = formatTime(prayer.at,view.timeZone).split(/\s+/);
          const isNext = prayer.key === nextKey;
          const isNightEvent = prayer.key === "midnight" || prayer.key === "last-third";
          const nightRemaining = isNightEvent ? remainingPrayerSeconds(prayer.at,nowMs) : 0;
          const showNightCountdown = isNightEvent && night?.enabled && nightRemaining > 0;

          return <div className={`np-prayer ${isNext ? "is-next" : ""} ${isNightEvent ? "np-night-event" : ""}`} data-prayer-key={prayer.key} data-event-at={prayer.at} data-night-countdown-active={isNightEvent ? String(Boolean(night?.enabled)) : undefined} key={prayer.key}>
            <span className="np-prayer-symbol">{prayerSymbol(prayer.key)}</span>
            <span className="np-prayer-label">{prayer.label}</span>
            <span className="np-prayer-time"><span>{prayerClock}</span>{" "}<span className="np-prayer-period">{prayerPeriod}</span></span>
            {isNext && nextPrayer ? <span className="np-countdown" data-testid="prayer-countdown">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7.8v4.6l3 1.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/></svg>
              <span className="np-countdown-digits">{formatCountdown(countdown)}</span>
            </span> : null}
            {showNightCountdown ? <span className="np-countdown" aria-label={`المتبقي حتى ${prayer.label}`} data-testid={`night-countdown-${prayer.key}`}>
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.5"/><path d="M12 7.8v4.6l3 1.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/></svg>
              <span className="np-countdown-digits">{formatCountdown(nightRemaining)}</span>
            </span> : null}
          </div>;
        })}
      </div>
    </section>

    {actionError ? <p className="np-action-error" role="alert">{actionError}</p> : null}

    <section className={`np-card np-day-achievement${totalToday>0&&completedToday===totalToday?" is-complete":""}`} data-testid="today-summary" data-today-design="whole-day-r93" data-week-achievement="r94" data-achievement-style="classic-r95" data-weighted-progress="r91" aria-label="إنجاز اليوم كاملًا">
      <div className="np-day-ring" role="progressbar" aria-label="الإنجاز الموزون لليوم كاملًا" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionRate} aria-valuetext={totalToday?`${completionRate}%، ${completedToday} من ${totalToday} عناصر`:"لا توجد عناصر مستحقة اليوم"}>
        <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="np-day-ring-track" cx="50" cy="50" r="42"/><circle className="np-day-ring-fill" cx="50" cy="50" r="42" strokeDasharray={263.894} strokeDashoffset={263.894*(1-completionRate/100)}/></svg><strong data-testid="today-completion-rate">{arabicNumber(completionRate)}%</strong>
      </div>
      <div className="np-day-achievement-copy"><h2>إنجاز اليوم <small>موزون</small></h2><p>{!totalToday?"لا توجد عادات أو مهام مستحقة اليوم.":completedToday===totalToday?"اكتملت كل عادات ومهام اليوم. أحسنت الاستمرار.":`${arabicNumber(completedToday)} من ${arabicNumber(totalToday)} عادات ومهام مكتملة اليوم`}</p></div>
      {totalToday?<div className="np-day-remaining"><strong>{arabicNumber(Math.max(0,totalToday-completedToday))}</strong><span>{completedToday===totalToday?"يوم مكتمل":"متبقية اليوم"}</span></div>:null}
      <div className="np-day-context">
        <section className={`np-yesterday${yesterday?.missed.length?" has-missed":""}`} aria-label="فائت أمس" data-testid="yesterday-achievement"><div className="np-yesterday-heading"><span>فائت أمس</span>{yesterday?<time dateTime={yesterday.date}>{weekDateLabel(yesterday.date)}</time>:null}</div><div className="np-yesterday-score"><strong>{arabicNumber(yesterday?.missed.length??0)}</strong><span>عادات ومهام غير مكتملة</span></div>{yesterday?.scheduled?<p>{yesterday.missed.length?"عناصر غير مكتملة" :"اكتملت كل استحقاقات أمس"} · إنجاز أمس {arabicNumber(yesterday.rate??0)}%</p>:<p>لا توجد استحقاقات مسجلة لأمس.</p>}{yesterday?.missed.length?<details className="np-yesterday-details"><summary>عرض الفائت</summary><ul>{yesterday.missed.map(row=><li key={row.id}><span>{row.title}<small>{row.kind==="Habit"?"عادة":"مهمة"} · {STATUS_LABELS[row.status]??row.status}{row.amount>0?` · ${arabicNumber(row.amount)} ${row.unit}`:""}</small></span><strong>{arabicNumber(row.weight)}<small> وزن</small></strong></li>)}</ul></details>:null}</section>
        <section className="np-week-achievement" aria-label="إنجاز أيام الأسبوع كاملًا"><div className="np-week-heading"><h3>هذا الأسبوع</h3>{achievementWeek[0]&&achievementWeek[6]?<span>{weekDateLabel(achievementWeek[0].date)} — {weekDateLabel(achievementWeek[6].date)}</span>:null}</div><div className="np-week-days" role="list">{achievementWeek.map(day=><div role="listitem" key={day.date} className={`np-week-day${day.current?" is-today":""}${day.future?" is-future":""}`} data-week-date={day.date} data-week-state={day.future?"future":day.current?"today":"past"} data-week-rate={day.rate??undefined} aria-label={`${weekDateLabel(day.date,true)} ${day.date}: ${day.future?"لم يأت بعد":day.rate===null?"لا استحقاقات مسجلة":`إنجاز ${day.rate}%`}`}><span className="np-week-name">{weekDateLabel(day.date,true)}</span><div className="np-week-value"><strong>{day.future?null:day.rate===null?"—":`${arabicNumber(day.rate)}%`}</strong></div><time dateTime={day.date}>{weekDateLabel(day.date)}</time><small>{day.current?"اليوم":""}</small></div>)}</div></section>
      </div>
    </section>
    <div className="np-main-grid np-daily-only">
      <div className="np-execution-stack">
        <section aria-label="عادات اليوم" className="np-habits-section">
          <div className="np-section-heading"><h2>عادات اليوم</h2><span>كل قسم، خطوة للأمام</span></div>
          <div className="np-category-grid" data-testid="habit-category-grid">
            {grouped.length === 0
              ? <section className="np-card np-category np-habits-empty"><div className="np-empty"><strong>مساحة لعاداتك</strong><span>لا توجد عادات مجدولة اليوم. ستظهر أقسامها هنا حسب تصنيفاتك الحالية.</span></div></section>
              : grouped.map(([category,items]) => {
                const due=items.flatMap(row=>row.execution&&row.execution.status!=='Suppressed'?[row.execution]:[]);
                const done = completedCount(due);
                const totalWeight=due.reduce((n,e)=>n+e.weight,0),completedWeight=due.filter(e=>e.status==="Completed").reduce((n,e)=>n+e.weight,0);
                const rate=totalWeight?Math.round(completedWeight/totalWeight*100):0;
                const circumference = 2 * Math.PI * 24;
                return <section aria-label={`عادات ${category}`} className="np-card np-category np-habit-category" data-habit-layout="tracker-r76" data-testid="habit-category-card" key={category}>
                  <div className="np-category-head">
                    <div className="np-category-heading"><span aria-hidden="true" className="np-category-symbol"><svg fill="none" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="6" height="6" rx="1.8" stroke="currentColor" strokeWidth="1.5"/><rect x="14.5" y="3.5" width="6" height="6" rx="1.8" stroke="currentColor" strokeWidth="1.5"/><rect x="3.5" y="14.5" width="6" height="6" rx="1.8" stroke="currentColor" strokeWidth="1.5"/><path d="m14.5 17.5 2 2 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span><h3 className="np-category-title">{category}</h3><span className="np-category-count">{arabicNumber(done)} من {arabicNumber(due.length)} مستحقة اليوم · {arabicNumber(items.length)} عادات</span></div>
                    <div aria-label={`إنجاز قسم ${category}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate} aria-valuetext={`${arabicNumber(done)} من ${arabicNumber(due.length)} مستحقة اليوم، ${arabicNumber(rate)}%`} className={`np-category-progress${rate === 100 ? " is-complete" : ""}`} role="progressbar">
                      <svg aria-hidden="true" viewBox="0 0 60 60"><circle className="np-ring-track" cx="30" cy="30" r="24"/><circle className="np-ring-value" cx="30" cy="30" r="24" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - rate / 100)}/></svg>
                      <span aria-hidden="true">{arabicNumber(rate)}<small>%</small></span>
                    </div>
                  </div>
                  <div className="np-list">{items.map(({execution:item,definition})=><ActivityCard key={item.id} item={item} definition={definition} busy={busy||lockedIds.includes(item.id)} pending={pendingIds.includes(item.id)} onCommand={onCommand}/>)}</div>
                </section>;
              })}
          </div>
        </section>
        {view.tasks.length > 0 ? <section aria-label="مهام اليوم" className="np-card np-category np-tasks-card"><div className="np-category-head"><h2 className="np-category-title">مهام اليوم</h2><span className="np-category-count">{arabicNumber(view.tasks.length)} مهام</span></div><div className="np-list">{[...view.tasks].sort((a,b)=>(definitionsById.get(a.definitionId)?.displayOrder??Number.MAX_SAFE_INTEGER)-(definitionsById.get(b.definitionId)?.displayOrder??Number.MAX_SAFE_INTEGER)).map(item => { return <ActivityCard key={item.id} item={item} definition={definitionsById.get(item.definitionId)} busy={busy||lockedIds.includes(item.id)} pending={pendingIds.includes(item.id)} onCommand={onCommand}/>; })}</div></section> : null}
      </div>


    </div>


  </>;
}

function PersonalEntryLoading(): ReactElement {
  return (
    <section
      className="np-entry-loading"
      data-testid="noor-personal-initial-loading-r100"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="np-entry-loading-content">
        <img className="np-entry-loading-logo" src="/noor-platform-logo.jpeg" alt="شعار نور" decoding="sync" loading="eager" />
        <h1 className="np-entry-loading-title">مرحبا بك في منصة نور</h1>
        <p className="np-entry-loading-copy">جارٍ تجهيز مساحتك الشخصية…</p>
        <span className="np-entry-loading-spinner" aria-hidden="true" />
      </div>
    </section>
  );
}

function StatePage({ title, copy }: { title: string; copy: string }): ReactElement {
  return <section className="np-card np-date-card"><img alt="شعار نور" className="np-state-logo" src="/noor-platform-logo.jpeg" /><h1 className="np-control-title">{title}</h1><p className="np-control-subtitle">{copy}</p></section>;
}

export function NoorPersonalApplicationView({ initialResult, initialWorkspace }: NoorPersonalApplicationViewProps): ReactElement {
  const [result,setResult] = useState<NoorPersonalTodayResult | null>(initialResult ?? null);
  const [workspaceResult,setWorkspaceResult] = useState<NoorPersonalWorkspaceResult | null>(initialWorkspace ?? null);
  const [busy,setBusy] = useState(false);
  type OrderCommand=Extract<NoorPersonalCommandInput,{type:"reorder-display"}>;
  const orderQueue=useRef<OrderCommand[]>([]),orderRunning=useRef(false);
  const [orderChanges,setOrderChanges]=useState<OrderCommand[]>([]),[orderError,setOrderError]=useState("");
  const fastQueue=useRef<FastChange[]>([]),fastRunning=useRef(false),alive=useRef(true);
  const [fastChanges,setFastChanges]=useState<FastChange[]>([]),[failedChanges,setFailedChanges]=useState<FastChange[]>([]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
  useEffect(()=>{if(!fastChanges.length&&!orderChanges.length)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[fastChanges.length,orderChanges.length]);
  const [actionError,setActionError] = useState<string | null>(null);
  const [controlOpen,setControlOpen] = useState(false);
  const [appearance,setAppearance] = useState<NoorAppearance>(readAppearance);
  const chooseAppearance = (value: NoorAppearance) => { setAppearance(value); saveAppearance(value); };

  const [nowMs,setNowMs] = useState(() => Date.now());
  const prayerRefreshRef = useRef({lastAttempt:0,pending:false,key:""});

  const refreshEpoch=useRef(0);
  const commandInFlight=useRef(false);
  const [syncing,setSyncing]=useState(false);
  const syncSequence=useRef(0);
  const refresh = async () => {
    const epoch=++refreshEpoch.current;
    const today=await fetchNoorPersonalToday();
    if(epoch!==refreshEpoch.current)return;
    setResult(previous=>today.kind==="unavailable" && previous?.kind==="success"?previous:today);
    if(today.kind==="success" && isRecord(today.today) && buildWorkspaceViewModel(today.today.workspace)){
      setWorkspaceResult({kind:"success",workspace:today.today.workspace});return;
    }
    const workspace=await fetchNoorPersonalWorkspace();
    if(epoch!==refreshEpoch.current)return;
    setWorkspaceResult(previous=>workspace.kind==="unavailable" && previous?.kind==="success"?previous:workspace);
  };
  const refreshInBackground=()=>{const sequence=++syncSequence.current;setSyncing(true);void refresh().finally(()=>{if(sequence===syncSequence.current)setSyncing(false);});};

  useEffect(() => {
    if (initialResult === undefined || initialWorkspace === undefined) {
      void refresh();
    }
  }, []);

  useEffect(() => {
    const tick=()=>setNowMs(Date.now());
    const visible=()=>{if(document.visibilityState==='visible')tick();};
    const timer = window.setInterval(tick,1000);
    window.addEventListener('focus',tick);window.addEventListener('pageshow',tick);document.addEventListener('visibilitychange',visible);
    return () => {window.clearInterval(timer);window.removeEventListener('focus',tick);window.removeEventListener('pageshow',tick);document.removeEventListener('visibilitychange',visible);};
  }, []);

  const baseView = useMemo(()=>result?.kind === "success" ? buildViewModel(result.today) : null,[result]);
  const baseWorkspace = useMemo(()=>workspaceResult?.kind === "success" ? buildWorkspaceViewModel(workspaceResult.workspace) : null,[workspaceResult]);
  const view=useMemo(()=>{if(!baseView)return null;const update=(item:ExecutionItem)=>{let status=item.status;for(const c of fastChanges.filter(c=>c.executionId===item.id)){if(c.command.type==='set-execution-completed')status=c.command.completed?'Completed':'Pending';else if(c.command.type==='record-activity'&&c.command.endReason)status=c.command.endReason==='achieved'?'Completed':'Cancelled';else if(c.command.type==='record-activity'&&c.command.amount>0&&status!=='Completed')status='InProgress';}return {...item,status};};return {...baseView,tasks:baseView.tasks.map(update),habits:baseView.habits.map(update)};},[baseView,fastChanges]);
  const activityWorkspace=useMemo(()=>baseWorkspace?{...baseWorkspace,definitions:baseWorkspace.definitions.map(d=>{const changes=fastChanges.filter(c=>c.definitionId===d.id);let activityLog=[...d.activityLog],state=d.state;for(const change of changes){if(change.command.type==='edit-activity-note'){const command=change.command;activityLog=activityLog.map(e=>e.id===command.entryId&&e.executionId===command.executionId?{...e,note:command.note??''}:e);}if(change.entry&&!activityLog.some(e=>e.id===change.entry!.id))activityLog.push(change.entry);if(change.entry?.endReason)state='Stopped';}return {...d,state,activityLog};})}:null,[baseWorkspace,fastChanges]);
  const workspace=useMemo(()=>{if(!activityWorkspace)return null;let result=activityWorkspace;for(const command of orderChanges){if(command.scope==='categories')result={...result,categories:command.order};else{const ranks=new Map(command.order.map((id,index)=>[id,index]));result={...result,definitions:result.definitions.map(d=>d.kind===command.scope&&ranks.has(d.id)?{...d,displayOrder:ranks.get(d.id)!}:d).sort((a,b)=>(a.displayOrder??Number.MAX_SAFE_INTEGER)-(b.displayOrder??Number.MAX_SAFE_INTEGER))};}}return result;},[activityWorkspace,orderChanges]);


  // A Personal Day may end independently of the next-prayer refresh.
  // Use the persisted UTC boundary rather than a browser-local calendar date.
  const dayBoundaryEndAt = (() => {
    if(result?.kind!=="success"||!isRecord(result.today))return null;
    const personalDay=result.today.personalDay;
    if(!isRecord(personalDay)||!isRecord(personalDay.boundary))return null;
    return stringValue(personalDay.boundary.endAt);
  })();
  useEffect(() => {
    const at=view?.nextPrayer?.at;
    const prayerDue=!!at&&Number.isFinite(Date.parse(at))&&nowMs>=Date.parse(at);
    const dayDue=!!dayBoundaryEndAt&&Number.isFinite(Date.parse(dayBoundaryEndAt))&&nowMs>=Date.parse(dayBoundaryEndAt);
    // R98: legacy Fajr-based days can span civil midnight; refresh at 00:00.
    const civilDate=view?.timeZone?civilLocalDate(nowMs,view.timeZone):null;
    // Only genuine persisted day boundaries trigger civil rollover; synthetic
    // legacy/partial view models without endAt remain backward-compatible.
    const civilDue=!!dayBoundaryEndAt&&!!civilDate&&!!view?.localDate&&civilDate!==view.localDate;
    if(!prayerDue&&!dayDue&&!civilDue)return;
    const state=prayerRefreshRef.current;
    if(state.pending||commandInFlight.current)return;
    const key=civilDue?`civil:${civilDate}`:dayDue?`day:${dayBoundaryEndAt}`:`prayer:${at}`;
    if(state.key===key&&nowMs-state.lastAttempt<30_000)return;
    state.key=key;state.lastAttempt=nowMs;state.pending=true;
    void refresh().finally(()=>{state.pending=false;});
  }, [nowMs,view?.nextPrayer?.at,dayBoundaryEndAt]);

  const runCommand = async (command: NoorPersonalCommandInput): Promise<boolean> => {
    if (commandInFlight.current) return false;
    commandInFlight.current=true;
    ++refreshEpoch.current;
    setBusy(true);
    setActionError(null);
    try {
      const reply = await sendNoorPersonalCommandDetailed(command);
      if (reply.kind !== "success") {
        setActionError(reply.kind === "conflict" ? "تعذر تنفيذ التغيير بسبب تعارض في الحالة الحالية." : "تعذر تنفيذ التغيير الآن. حاول مرة أخرى.");
        return false;
      }
      ++refreshEpoch.current;
      const returnedWorkspace=buildWorkspaceViewModel(reply.workspace);
      const returnedExecution=executionItems(reply.executions);
      if(returnedWorkspace && returnedExecution){
        setWorkspaceResult({kind:"success",workspace:reply.workspace});
        const matchingDay=result?.kind==="success" && isRecord(result.today) && isRecord(result.today.personalDay) && result.today.personalDay.id===reply.personalDayId;
        if(matchingDay)setResult(previous=>previous?.kind==="success"&&isRecord(previous.today)?{kind:"success",today:{...previous.today,tasks:returnedExecution.filter(e=>e.kind==="Task"),habits:returnedExecution.filter(e=>e.kind==="Habit")}}:previous);
        if(reply.materializationRequired || !matchingDay)refreshInBackground();
      }else{
        // Compatibility with old 204 servers; new servers return the committed projection.
        await refresh();
      }
      return true;
    } finally {
      commandInFlight.current=false;
      setBusy(false);
      queueMicrotask(()=>{if(alive.current){void drainFast();void drainOrder();}});
    }
  };

  const drainOrder=async()=>{
    if(orderRunning.current||commandInFlight.current||!alive.current)return;orderRunning.current=true;
    try{while(orderQueue.current.length&&alive.current){const command=orderQueue.current[0]!;let ok=false;try{ok=await runCommand(command);}catch{ok=false;}
      orderQueue.current.shift();if(!alive.current)break;
      if(!ok){orderQueue.current=orderQueue.current.filter(c=>c.scope!==command.scope);setOrderError("تعذر حفظ الترتيب. أُعيد هذا القسم لآخر ترتيب مؤكد؛ يمكنك المحاولة مجددًا.");}
      setOrderChanges([...orderQueue.current]);
    }}finally{orderRunning.current=false;}
  };
  const controlCommand=async(command:NoorPersonalCommandInput):Promise<boolean>=>{
    if(command.type!=='reorder-display')return runCommand(command);
    const active=orderRunning.current?orderQueue.current[0]:undefined;
    const unsent=orderQueue.current.find(c=>c!==active&&c.scope===command.scope);
    if(unsent){orderQueue.current=orderQueue.current.map(c=>c===unsent?{...command,expected:unsent.expected}:c);}else orderQueue.current.push(command);
    setOrderError("");flushSync(()=>setOrderChanges([...orderQueue.current]));void drainOrder();return true;
  };

  const drainFast=async()=>{
    if(fastRunning.current||commandInFlight.current||!alive.current)return;fastRunning.current=true;
    try{while(fastQueue.current.length&&alive.current){const change=fastQueue.current[0]!;let ok=false;try{ok=await runCommand(change.command);}catch{ok=false;}fastQueue.current.shift();if(!alive.current)break;if(!ok&&change.command.type==='edit-activity-note'){const failed=change.command;fastQueue.current=fastQueue.current.filter(c=>c.command.type!=='edit-activity-note'||c.command.entryId!==failed.entryId);}setFastChanges([...fastQueue.current]);
      const newerChoice=change.command.type==='set-execution-completed'&&fastQueue.current.some(c=>c.executionId===change.executionId&&c.command.type==='set-execution-completed');
      if(ok&&change.command.type==='set-execution-completed')setFailedChanges(previous=>previous.filter(c=>c.executionId!==change.executionId||c.command.type!=='set-execution-completed'));
      if(!ok&&!newerChoice)setFailedChanges(previous=>[...previous.filter(c=>c.command.type==='set-execution-completed'&&change.command.type==='set-execution-completed'?c.executionId!==change.executionId:c.command.type!=='set-execution-completed'&&change.command.type!=='set-execution-completed'?c.command.type!==change.command.type||c.command.entryId!==change.command.entryId:true),change]);
    }}
    finally{fastRunning.current=false;}
  };
  const fastCommand=async(command:NoorPersonalCommandInput):Promise<boolean>=>{
    if(command.type!=='set-execution-completed'&&command.type!=='record-activity'&&command.type!=='edit-activity-note')return runCommand(command);
    if(fastQueue.current.some(c=>c.executionId===command.executionId&&((command.type==='record-activity'&&(command.amount>0||command.endReason!==null))||(c.command.type==='record-activity'&&(c.command.amount>0||c.command.endReason!==null)))))return false;
    const execution=[...(baseView?.tasks??[]),...(baseView?.habits??[])].find(e=>e.id===command.executionId);
    const definition=command.type==='edit-activity-note'?baseWorkspace?.definitions.find(d=>d.activityLog.some(e=>e.id===command.entryId&&e.executionId===command.executionId)):baseWorkspace?.definitions.find(d=>d.id===execution?.definitionId);
    if(command.type==='edit-activity-note'){if(!definition||fastQueue.current.some(c=>c.definitionId===definition.id))return false;}else if(!execution)return false;
    const change:FastChange={command,executionId:command.executionId,definitionId:definition?.id??execution!.definitionId,title:definition?.title??execution!.title,...(command.type==='record-activity'?{entry:{id:command.entryId,executionId:execution!.id,localDate:civilLocalDate(Date.now(),baseView!.timeZone),at:new Date().toISOString(),amount:command.amount,note:command.note,endReason:command.endReason}}:{})};
    if(command.type==='set-execution-completed'&&execution){
      const active=fastRunning.current?fastQueue.current[0]:undefined;
      const activeHere=active?.executionId===execution.id&&active.command.type==='set-execution-completed'?active:undefined;
      const effective=activeHere?.command.type==='set-execution-completed'?activeHere.command.completed:execution.status==='Completed';
      // Preserve any request already sent. Collapse unsent toggles to the latest choice.
      fastQueue.current=fastQueue.current.filter(c=>c===active||c.executionId!==execution.id||c.command.type!=='set-execution-completed');
      if(command.completed!==effective)fastQueue.current.push(change);
      setFailedChanges(previous=>previous.filter(c=>c.executionId!==execution.id||c.command.type!=='set-execution-completed'));
    }else {fastQueue.current.push(change);if(command.type==='edit-activity-note')setFailedChanges(previous=>previous.filter(c=>c.command.type!=='edit-activity-note'||c.command.entryId!==command.entryId));}
    flushSync(()=>setFastChanges([...fastQueue.current]));void drainFast();return true;
  };

  let content: ReactElement;
  if (!result) {
    content = <PersonalEntryLoading />;
  } else if (result.kind === "setup-required") {
    content = <StatePage copy="يلزم استكمال إعداد الموقع وسياسة الصلاة قبل بدء يوم نور." title="الإعداد مطلوب" />;
  } else if (result.kind === "unavailable" || !view) {
    content = <StatePage copy="تعذر تحميل بيانات نور حاليًا." title="الخدمة غير متاحة" />;
  } else {
    const defaultStartDate = civilLocalDate(nowMs, view.timeZone);
    content = controlOpen
      ? <>{actionError ? <p className="np-action-error" role="alert">{actionError}</p> : null}<ControlCenter orderingPending={orderChanges.length>0} appearance={appearance} onAppearance={chooseAppearance} executions={[...view.tasks,...view.habits]} busy={busy} defaultStartDate={defaultStartDate} onClose={() => setControlOpen(false)} onCommand={controlCommand} workspace={workspace} /></>
      : <Dashboard actionError={actionError} busy={busy&&!fastChanges.length&&!orderChanges.length} pendingIds={[...view.tasks,...view.habits].filter(e=>fastChanges.some(c=>c.definitionId===e.definitionId)).map(e=>e.id)} lockedIds={[...view.tasks,...view.habits].filter(e=>fastChanges.some(c=>c.definitionId===e.definitionId&&c.command.type==='record-activity'&&(c.command.amount>0||c.command.endReason!==null))).map(e=>e.id)} nowMs={nowMs} onCommand={fastCommand} onOpenControl={() => setControlOpen(true)} view={view} workspace={workspace} />;
  }

  return <><style>{PAGE_STYLES}</style><section className={`np-page${!result ? " np-page-entry-loading" : result.kind === "success" ? " np-page-entry-ready" : ""}`} data-appearance={appearance} data-design-version="r62-visible-layout-fix" dir="rtl"><div className="np-wrap"><div className="np-save-notices" data-save-feedback="classic-achievement-r95">{orderError?<p className="np-failed-save" role="alert">{orderError}</p>:null}{failedChanges.map((change,i)=><div className="np-failed-save" role="alert" key={`${change.command.type}:${change.command.type==='set-execution-completed'?change.executionId:change.command.entryId}`}><span>لم يتأكد الحفظ: {change.title}. تم إرجاع العرض لآخر بيانات مؤكدة.</span>{change.command.type==='edit-activity-note'?<p>{change.command.note??'حذف الملاحظة'}</p>:null}{change.command.type==='record-activity'?<p>{change.command.note}{change.command.amount>0?` · الكمية: ${change.command.amount}`:''}</p>:null}<button type="button" disabled={fastChanges.some(c=>c.executionId===change.executionId)} onClick={()=>{setFailedChanges(previous=>previous.filter((_,j)=>j!==i));void fastCommand(change.command);}}>إعادة المحاولة</button><button type="button" onClick={()=>setFailedChanges(previous=>previous.filter((_,j)=>j!==i))}>تجاهل التغيير غير المحفوظ</button></div>)}</div>{content}</div></section></>;
}

