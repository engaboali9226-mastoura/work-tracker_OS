import { createPortal } from "react-dom";
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

type UnknownRecord = Record<string, unknown>;

type ExecutionItem = Readonly<{
  id: string;
  definitionId: string;
  title: string;
  status: string;
  kind: "Task" | "Habit";
}>;

type ActivityEntry = Readonly<{ id:string; executionId:string; localDate:string; at:string; note:string; amount:number; endReason:"achieved"|"expired"|"cancelled"|null }>;
type DefinitionItem = Readonly<{
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
.np-activity-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.np-pencil{display:grid;place-items:center;min-width:40px;min-height:40px;padding:8px}.np-habit-check{width:24px;height:24px;accent-color:#287b65;cursor:pointer}.np-progress-copy{display:grid;gap:6px;font-size:13px;margin-top:9px}.np-progress-copy progress{width:100%;height:7px;accent-color:#287b65}.np-activity-note{font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0;color:#657589}.np-activity-backdrop{position:fixed;inset:0;z-index:10000;background:#12243766;display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}.np-activity-dialog{box-sizing:border-box;width:min(100%,480px);max-height:calc(100dvh - 32px);overflow:auto;background:#fff;color:#183b56;border-radius:22px;padding:24px;box-shadow:0 20px 70px #10203340}.np-activity-dialog h2{font-size:21px;margin:0 0 8px}.np-activity-dialog form{display:grid;gap:14px}.np-activity-dialog label{display:grid;gap:7px;font-size:14px;line-height:1.7}.np-activity-dialog input,.np-activity-dialog textarea,.np-activity-dialog select{box-sizing:border-box;width:100%;font:inherit;border:1px solid #ccd5dd;border-radius:10px;padding:10px;background:#f8fafb;color:#183b56}.np-activity-dialog textarea{resize:vertical}.np-activity-dialog small,.np-activity-help{font-size:12px;line-height:1.8;color:#66778a}.np-activity-footer{display:flex;gap:10px;justify-content:flex-end}.np-activity-history{margin-top:20px;border-top:1px solid #e2e7ec;padding-top:12px;font-size:13px}.np-activity-history>div{padding:10px 0;border-bottom:1px solid #eee}.np-activity-history p{white-space:pre-wrap;overflow-wrap:anywhere}.np-activity-history summary{cursor:pointer}.np-activity-dialog .np-btn{padding:10px 16px;border:0;border-radius:10px;cursor:pointer;font:inherit}.np-activity-dialog .secondary{background:#edf1f4;color:#304c61}.np-activity-dialog .complete{background:#287b65;color:white}.np-activity-dialog button:disabled{opacity:.55;cursor:wait}
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
    result.push({ id, definitionId, title, status, kind });
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
    result.push({ id, title, state, kind, category, scheduleKind, weekdays, startDate, endDate, importance, measurement, activityLog });
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
  return { definitions, finance, currentStreakDays, bestStreakDays, periods: { week, month, quarter, year } };
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

export function remainingPrayerSeconds(at: string, nowMs: number): number {
  const target = new Date(at).getTime();
  return Number.isFinite(target) ? Math.max(0, Math.floor((target - nowMs) / 1000)) : 0;
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

async function loadCurrentTemperature(location: HeaderLocation): Promise<number | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude",String(location.latitude));
    url.searchParams.set("longitude",String(location.longitude));
    url.searchParams.set("current","temperature_2m");
    url.searchParams.set("temperature_unit","celsius");
    const response = await fetch(url.toString(),{ cache:"no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as unknown;
    if (!isRecord(payload) || !isRecord(payload.current)) return null;
    const temperature = payload.current.temperature_2m;
    return typeof temperature === "number" && Number.isFinite(temperature) ? temperature : null;
  } catch {
    return null;
  }
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

function DefinitionForm({ busy, onCommand, defaultStartDate, defaultKind = "Habit" }: { busy: boolean; onCommand: (command: NoorPersonalCommandInput) => Promise<boolean>; defaultStartDate: string; defaultKind?: "Habit" | "Task" }): ReactElement {
  const [scheduleKind, setScheduleKind] = useState<"OneTime"|"Daily"|"Weekdays">("Daily");
  const [selectedKind,setSelectedKind]=useState(defaultKind);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const weekdays = data.getAll("weekday").map(value => Number(value));
    const endDateValue = String(data.get("endDate") ?? "").trim();
    const success = await onCommand({
      type: "create-definition",
      kind: String(data.get("kind")) === "Task" ? "Task" : "Habit",
      ...(String(data.get("kind"))==="Task" && String(data.get("progressTarget") ?? "").trim() ? {measurement:{target:Number(data.get("progressTarget")),unit:String(data.get("progressUnit") ?? "").trim()}} : {}),
      title: String(data.get("title") ?? "").trim(),
      category: String(data.get("category") ?? "").trim(),
      startDate: String(data.get("startDate") ?? ""),
      endDate: endDateValue.length > 0 ? endDateValue : null,
      scheduleKind,
      weekdays: scheduleKind === "Weekdays" ? weekdays : [],
      importance: (String(data.get("importance")) as "Essential"|"Important"|"Supporting"|"Optional"),
    });
    if (success) {
      form.reset();
      setScheduleKind("Daily");
    }
  };
  return <form className="np-form" onSubmit={event => { void submit(event); }}>
    <div className="np-field"><label className="np-label" htmlFor="definition-kind">النوع *</label><select className="np-select" defaultValue={defaultKind} onChange={event=>setSelectedKind(event.currentTarget.value as "Task"|"Habit")} id="definition-kind" name="kind" required><option value="Habit">عادة</option><option value="Task">مهمة</option></select></div>
    <div className="np-field"><label className="np-label" htmlFor="definition-title">الاسم *</label><input className="np-input" id="definition-title" maxLength={120} name="title" required /></div>
    <div className="np-field"><label className="np-label" htmlFor="definition-category">التصنيف *</label><input className="np-input" id="definition-category" list="np-categories" maxLength={60} name="category" required /><datalist id="np-categories">{COMMON_CATEGORIES.map(category => <option key={category} value={category} />)}</datalist></div>
    <div className="np-field"><label className="np-label" htmlFor="definition-importance">الأهمية *</label><select className="np-select" defaultValue="Supporting" id="definition-importance" name="importance" required><option value="Essential">أساسي</option><option value="Important">مهم</option><option value="Supporting">داعم</option><option value="Optional">اختياري</option></select></div>
    {selectedKind==="Task" ? <><div className="np-field"><label className="np-label" htmlFor="progress-target">الكمية المستهدفة (اختياري)</label><input className="np-input" id="progress-target" name="progressTarget" type="number" min="0.000001" max="1000000000" step="0.000001" placeholder="مثال: ٣٠٠" /></div><div className="np-field"><label className="np-label" htmlFor="progress-unit">وحدة الإنجاز</label><input className="np-input" id="progress-unit" name="progressUnit" maxLength={30} defaultValue="صفحة" /></div></> : null}
    <div className="np-field"><label className="np-label" htmlFor="definition-start">تاريخ البداية *</label><input className="np-input" defaultValue={defaultStartDate} id="definition-start" name="startDate" required type="date" /></div>
    <div className="np-field"><label className="np-label" htmlFor="definition-end">تاريخ النهاية</label><input className="np-input" id="definition-end" name="endDate" type="date" /></div>
    <div className="np-field full"><label className="np-label" htmlFor="definition-repeat">التكرار *</label><select className="np-select" id="definition-repeat" name="scheduleKind" onChange={event => setScheduleKind(event.target.value as "OneTime"|"Daily"|"Weekdays")} value={scheduleKind} required><option value="Daily">يوميًا</option><option value="Weekdays">أيام محددة من الأسبوع</option><option value="OneTime">مرة واحدة</option></select></div>
    {scheduleKind === "Weekdays" ? <div className="np-field full"><span className="np-label">أيام التكرار *</span><div className="np-weekdays">{WEEKDAYS.map(([value,label]) => <label className="np-weekday" key={value}><input name="weekday" required={false} type="checkbox" value={value} />{label}</label>)}</div></div> : null}
    <div className="np-form-actions"><button className="np-btn complete" disabled={busy} type="submit">إضافة إلى نور</button></div>
  </form>;
}

type NoorAppearance = "noor" | "light" | "dark";

const FINANCE_ACCOUNT_LABELS={cash:"نقدي",bank:"حساب بنكي",savings:"صندوق الادخار",emergency:"صندوق الطوارئ"};
const FINANCE_KIND_LABELS={income:"دخل",expense:"مصروف",transfer:"تحويل",repay:"سداد / تحصيل",lend:"إقراض",borrow:"اقتراض","opening-receivable":"دين سابق لي","opening-payable":"دين سابق عليّ"};
function moneyLabel(value:number):string {return new Intl.NumberFormat('ar-SA',{numberingSystem:'latn',minimumFractionDigits:2,maximumFractionDigits:2}).format(value/100)+' ر.س';}
function parseMoneyInput(value:string):number|null {
 const normalized=value.trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace(/[۰-۹]/g,d=>String(d.charCodeAt(0)-1776)).replace('٫','.');
 if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))return null;
 const [whole,fraction='']=normalized.split('.');const minor=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 return Number.isSafeInteger(minor)&&minor<=1e12?minor:null;
}
function FinanceCenter({ledger,busy,onCommand,today}:{ledger:FinanceLedger|null;busy:boolean;onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>;today:string}):ReactElement {
 const [tab,setTab]=useState<'overview'|'entries'|'accounts'|'debts'>('overview');
 const [month,setMonth]=useState(today.slice(0,7));const [query,setQuery]=useState('');const [accountFilter,setAccountFilter]=useState('');const [limit,setLimit]=useState(25);
 const [modal,setModal]=useState<{kind:'account'|'income'|'expense'|'transfer'|'debt'|'repay'|'void';id:string;debtId?:string;entryId?:string}|null>(null);
 const [error,setError]=useState('');const panel=useRef<HTMLDivElement>(null);
 const open=(kind:NonNullable<typeof modal>['kind'],extra:{debtId?:string;entryId?:string}={})=>{setError('');setModal({kind,id:globalThis.crypto.randomUUID(),...extra});};
 const close=()=>{if(!busy)setModal(null);};
 useEffect(()=>{if(!modal)return;const previous=document.body.style.overflow;const opener=document.activeElement as HTMLElement;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();return()=>{document.body.style.overflow=previous;if(opener?.isConnected)opener.focus();};},[modal?.id]);
 useEffect(()=>setLimit(25),[month,query,accountFilter]);
 if(!ledger)return <div className="nf-empty"><h2>المالية غير متاحة حاليًا</h2><p>أعد تحميل الصفحة للمحاولة مجددًا.</p></div>;
 const summary=financeSummary(ledger,month||undefined);
 const accountName=(id:string|null)=>ledger.accounts.find(a=>a.id===id)?.name ?? 'بدون حركة نقدية';
 const debtName=(id:string|null)=>ledger.debts.find(d=>d.id===id)?.person ?? '';
 const selectedDebt=ledger.debts.find(d=>d.id===modal?.debtId);
 const selectedEntry=ledger.entries.find(e=>e.id===modal?.entryId);
 const entries=ledger.entries.filter(e=>(!month || e.date.startsWith(month))&&(!accountFilter || e.accountId===accountFilter || e.targetAccountId===accountFilter)&&(!query || `${e.category} ${e.note} ${accountName(e.accountId)} ${debtName(e.debtId)}`.includes(query.trim()))).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
 const totalFor=(kind:'savings'|'emergency')=>ledger.accounts.filter(a=>a.kind===kind).reduce((n,a)=>n+(summary.balances[a.id]??0),0);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(busy||!modal)return;
  const form=event.currentTarget,data=new FormData(form);const text=(key:string)=>String(data.get(key)??'').trim();
  const amount=parseMoneyInput(text('amount')||'0');if(amount===null || (modal.kind!=='account' && modal.kind!=='void' && amount===0)){setError('اكتب مبلغًا صحيحًا بحد أقصى منزلتين عشريتين.');return;}
  let operation:FinanceOperation;
  if(modal.kind==='account')operation={action:'create-account',id:modal.id,name:text('name'),kind:text('accountKind') as 'cash'|'bank'|'savings'|'emergency',openingMinor:amount,date:text('date')};
  else if(modal.kind==='debt')operation={action:'create-debt',id:modal.id,person:text('person'),direction:text('direction') as 'receivable'|'payable',amountMinor:amount,date:text('date'),dueDate:text('dueDate')||null,accountId:text('accountId')||null,note:text('note')};
  else if(modal.kind==='void')operation={action:'void-entry',id:modal.id,entryId:modal.entryId!,reason:text('reason')};
  else operation={action:'record-entry',id:modal.id,kind:modal.kind,amountMinor:amount,date:text('date'),accountId:text('accountId'),targetAccountId:modal.kind==='transfer'?text('targetAccountId'):null,debtId:modal.kind==='repay'?modal.debtId!:null,category:modal.kind==='repay'?'سداد دين':modal.kind==='transfer'?'تحويل بين الحسابات':text('category'),note:text('note')};
  if(operation.action==='record-entry'){
   if(operation.kind==='transfer' && operation.accountId===operation.targetAccountId){setError('اختر حسابين مختلفين للتحويل.');return;}
   if((operation.kind==='expense'||operation.kind==='transfer'||operation.kind==='repay'&&selectedDebt?.direction==='payable')&&amount>(summary.balances[operation.accountId]??0)){setError('رصيد الحساب لا يكفي لهذه الحركة.');return;}
   if(operation.kind==='repay'&&amount>(summary.outstanding[operation.debtId!]??0)){setError('المبلغ أكبر من المتبقي من الدين.');return;}
  }
  setError('');if(await onCommand({type:'finance',operation}))setModal(null);else setError('تعذر تأكيد الحفظ. راجع الرصيد والتاريخ، أو أعد المحاولة. مدخلاتك ما زالت محفوظة هنا.');
 };
 const accountOptions=ledger.accounts.map(a=><option key={a.id} value={a.id}>{a.name} — {moneyLabel(summary.balances[a.id]??0)}</option>);
 const summaryCards=[['الرصيد في كل الحسابات',summary.totalMinor],['دخل الفترة',summary.incomeMinor],['مصروفات الفترة',summary.expenseMinor],['صافي دخل الفترة',summary.incomeMinor-summary.expenseMinor],['مبالغ لي',summary.receivableMinor],['مبالغ عليّ',summary.payableMinor],['الادخار',totalFor('savings')],['الطوارئ',totalFor('emergency')]] as const;
 return <section className="nf" data-testid="finance-center-r68"><header className="nf-heading"><div><p className="nf-eyebrow">أموالك بوضوح</p><h2>المالية</h2><p>الحسابات والديون والصناديق بالريال السعودي</p></div><button className="nf-button" disabled={busy} onClick={()=>open('account')} type="button">+ حساب أو صندوق</button></header>
  <nav className="nf-tabs" aria-label="أقسام المالية">{([['overview','نظرة عامة'],['entries','الحركات'],['accounts','الحسابات والصناديق'],['debts','لي وعليّ']] as const).map(([id,label])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'is-active':''} onClick={()=>setTab(id)} type="button">{label}</button>)}</nav>
  <div className="nf-toolbar"><div className="nf-actions"><button className="nf-button primary" disabled={busy||!ledger.accounts.length} onClick={()=>open('income')} type="button">+ دخل</button><button className="nf-button" disabled={busy||!ledger.accounts.length} onClick={()=>open('expense')} type="button">− مصروف</button><button className="nf-button" disabled={busy||ledger.accounts.length<2} onClick={()=>open('transfer')} type="button">تحويل</button><button className="nf-button" disabled={busy} onClick={()=>open('debt')} type="button">+ دين</button></div><label className="nf-period">الفترة <input aria-label="شهر التقرير المالي" type="month" value={month} onChange={e=>setMonth(e.currentTarget.value)}/></label></div>
  {!ledger.accounts.length ? <div className="nf-empty"><h3>ابدأ بحسابك الأول</h3><p>أضف النقدي أو البنك، ثم أنشئ صندوق الادخار والطوارئ عند الحاجة. الرصيد الافتتاحي لا يُحتسب دخلًا.</p><button className="nf-button primary" onClick={()=>open('account')} type="button">إضافة حساب</button></div>:null}
  {tab==='overview'?<><div className="nf-metrics">{summaryCards.map(([label,value],i)=><article key={label} className={i===0?'nf-metric featured':'nf-metric'}><span>{label}</span><strong>{moneyLabel(value)}</strong></article>)}</div><p className="nf-help">الأرصدة والديون والصناديق تُعرض حتى آخر حركة مسجلة. الدخل والمصروفات والصافي تخص الفترة المحددة. الصناديق جزء من إجمالي الرصيد؛ والتحويل والسداد لا يُحسبان دخلًا أو مصروفًا.</p></>:null}
  {tab==='accounts'?<div className="nf-account-grid">{ledger.accounts.map(a=><article className="nf-account" key={a.id}><span className="nf-badge">{FINANCE_ACCOUNT_LABELS[a.kind]}</span><h3>{a.name}</h3><strong>{moneyLabel(summary.balances[a.id]??0)}</strong><p>افتتاحي: {moneyLabel(a.openingMinor)} · {a.date}</p><button className="nf-button" onClick={()=>{setAccountFilter(a.id);setTab('entries');}} type="button">عرض الحركات</button></article>)}</div>:null}
  {tab==='debts'?<div className="nf-debt-list">{ledger.debts.length===0?<div className="nf-empty">لا توجد ديون مسجلة.</div>:ledger.debts.map(d=>{const remaining=summary.outstanding[d.id]??0;return <article className="nf-debt" key={d.id}><div><span className="nf-badge">{d.direction==='receivable'?'لي':'عليّ'}</span><h3>{d.person}</h3><strong>{moneyLabel(remaining)}</strong><p>{remaining===0?'مغلق':d.dueDate?`الاستحقاق: ${d.dueDate}${d.dueDate<today?' · متأخر':''}`:'بدون موعد استحقاق'}</p>{d.note?<p>{d.note}</p>:null}</div><button className="nf-button" disabled={busy||remaining===0||!ledger.accounts.length} onClick={()=>open('repay',{debtId:d.id})} type="button">{d.direction==='receivable'?'تسجيل تحصيل':'تسجيل سداد'}</button></article>;})}</div>:null}
  {tab==='overview'||tab==='entries'?<section className="nf-transactions"><div className="nf-list-heading"><h3>{tab==='overview'?'آخر الحركات في الفترة':'سجل الحركات'}</h3><div><input aria-label="بحث في الحركات المالية" placeholder="بحث بالوصف أو الشخص" value={query} onChange={e=>setQuery(e.currentTarget.value)}/><select aria-label="تصفية الحساب المالي" value={accountFilter} onChange={e=>setAccountFilter(e.currentTarget.value)}><option value="">كل الحسابات</option>{ledger.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div></div>
  {entries.length===0?<p className="nf-empty">لا توجد حركات تطابق الفترة والبحث.</p>:entries.slice(0,tab==='overview'?5:limit).map(e=><article className={`nf-entry${e.voidedAt?' is-void':''}`} key={e.id}><div><span className="nf-badge">{FINANCE_KIND_LABELS[e.kind]}</span><strong>{e.category}{e.debtId?` · ${debtName(e.debtId)}`:''}</strong><p>{e.date} · {accountName(e.accountId)}{e.targetAccountId?` ← ${accountName(e.targetAccountId)}`:''}</p>{e.note?<p>{e.note}</p>:null}{e.voidedAt?<p>ملغاة للتصحيح: {e.voidReason}</p>:null}</div><div className="nf-entry-amount"><strong>{moneyLabel(e.amountMinor)}</strong>{!e.voidedAt?<button className="nf-link" disabled={busy} onClick={()=>open('void',{entryId:e.id})} type="button">إلغاء للتصحيح</button>:<span>ملغاة</span>}</div></article>)}
  {tab==='entries'&&entries.length>limit?<button className="nf-button" onClick={()=>setLimit(limit+25)} type="button">عرض المزيد</button>:null}</section>:null}
  {modal?createPortal(<div className="nf-backdrop" onClick={e=>{if(e.target===e.currentTarget)close();}}><div role="dialog" aria-modal="true" aria-label="تسجيل حركة مالية" className="nf-dialog" ref={panel} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const nodes=Array.from(panel.current?.querySelectorAll<HTMLElement>('input:not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled)')??[]);if(!nodes.length){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}}}><h2>{({account:'إضافة حساب أو صندوق',income:'تسجيل دخل',expense:'تسجيل مصروف',transfer:'تحويل بين الحسابات',debt:'تسجيل دين',repay:selectedDebt?.direction==='receivable'?'تحصيل مبلغ لي':'سداد مبلغ عليّ',void:'إلغاء حركة للتصحيح'})[modal.kind]}</h2>
  <form onSubmit={e=>{void submit(e);}}><fieldset disabled={busy}>
  {modal.kind==='void'?<><p>{selectedEntry?`${FINANCE_KIND_LABELS[selectedEntry.kind]} · ${moneyLabel(selectedEntry.amountMinor)}`:''}</p><p className="nf-help">سيُعكس أثر الحركة على الأرصدة، ويبقى أصلها وسبب الإلغاء في السجل. لا يمكن إلغاء أصل دين قبل إلغاء دفعاته، أو إلغاء حركة إذا تسبب ذلك في رصيد سالب.</p><label>سبب التصحيح<textarea name="reason" required maxLength={500} rows={3}/></label></>:<>
   {modal.kind==='account'?<><label>اسم الحساب<input name="name" required maxLength={60} placeholder="مثال: الحساب البنكي"/></label><label>النوع<select name="accountKind" defaultValue="cash">{Object.entries(FINANCE_ACCOUNT_LABELS).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label></>:null}
   {modal.kind==='debt'?<><label>الاسم / الجهة<input name="person" required maxLength={100}/></label><label>اتجاه الدين<select name="direction" defaultValue="receivable"><option value="receivable">لي عند شخص</option><option value="payable">عليّ لشخص</option></select></label></>:null}
   {modal.kind==='repay'?<p>{selectedDebt?.person} · المتبقي {moneyLabel(summary.outstanding[modal.debtId!]??0)}</p>:null}
   <label>{modal.kind==='account'?'الرصيد الافتتاحي':'المبلغ'} (ر.س)<input name="amount" inputMode="decimal" required defaultValue={modal.kind==='account'?'0':''} placeholder="0.00" autoComplete="off"/></label>
   <label>{modal.kind==='account'?'تاريخ الرصيد الافتتاحي':'تاريخ الحركة'}<input name="date" type="date" required defaultValue={today} max={today}/></label>
   {modal.kind!=='account'?<label>{modal.kind==='debt'?'أثر الدين على الحساب':modal.kind==='transfer'?'من حساب':'الحساب'}<select name="accountId" required={modal.kind!=='debt'} defaultValue={modal.kind==='debt'?'':ledger.accounts[0]?.id??''}>{modal.kind==='debt'?<option value="">دين سابق — بدون تغيير الرصيد</option>:null}{accountOptions}</select>{modal.kind==='debt'?<small>اختيار حساب يعني أن المبلغ صُرف منه إذا كان الدين «لي»، أو أُضيف إليه إذا كان «عليّ».</small>:null}</label>:null}
   {modal.kind==='transfer'?<><label>إلى حساب / صندوق<select name="targetAccountId" required defaultValue={ledger.accounts[1]?.id??''}>{accountOptions}</select></label><p className="nf-help">هذا تحويل داخلي، ولن يُحتسب مصروفًا أو دخلًا.</p></>:null}
   {modal.kind==='income'||modal.kind==='expense'?<label>الفئة<input name="category" list="nf-categories" required maxLength={60} defaultValue={modal.kind==='income'?'راتب':''}/><datalist id="nf-categories">{(modal.kind==='income'?['راتب','عمل حر','دخل آخر']:['طعام','سكن','مواصلات','صحة','تعليم','التزامات','مصروف آخر']).map(x=><option value={x} key={x}/>)}</datalist></label>:null}
   {modal.kind==='debt'?<label>تاريخ الاستحقاق (اختياري)<input name="dueDate" type="date"/></label>:null}
   {modal.kind!=='account'?<label>ملاحظة (اختياري)<textarea name="note" maxLength={1000} rows={2}/></label>:<p className="nf-help">الرصيد الافتتاحي يُستخدم لبدء المتابعة ولا يدخل ضمن الدخل.</p>}
  </>}
  <div className="nf-modal-actions"><button className="nf-button" onClick={close} type="button">إلغاء</button><button className="nf-button primary" type="submit">{busy?'جارٍ الحفظ…':modal.kind==='void'?'تأكيد الإلغاء':'حفظ'}</button></div></fieldset>{error?<p role="alert" className="nf-error">{error}</p>:null}</form></div></div>,document.body):null}
 </section>;
}

function ControlCenter({ busy, workspace, executions, onCommand, onClose, defaultStartDate, appearance, onAppearance }: { busy: boolean; workspace: WorkspaceViewModel | null; executions: readonly ExecutionItem[]; onCommand: (command: NoorPersonalCommandInput) => Promise<boolean>; onClose: () => void; defaultStartDate: string; appearance: NoorAppearance; onAppearance: (value: NoorAppearance) => void }): ReactElement {
  const [section,setSection] = useState<"Habit" | "Task" | "appearance" | "finance">("Habit");
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
  const [deletePhrase,setDeletePhrase]=useState("");
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
  const apply = async (command: NoorPersonalCommandInput): Promise<boolean> => { const ok=await onCommand(command);if(command.type==="create-definition")setFormError(ok?null:"تعذر الحفظ. راجع البيانات وحاول مرة أخرى.");if(ok){if(command.type==="delete-definition"){setSelectedId(null);setDeleteId(null);setDeletePhrase("");}setConfirmArchive(null);if(command.type==="create-definition")setCreating(false);}return ok; };
  const icon=(value:string)=><svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{value==="finance"?<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 9h18M15 14h3"/></>:value==="Habit"?<><rect x="4" y="4" width="16" height="16" rx="5"/><path d="m8 12 3 3 5-6"/></>:value==="Task"?<><path d="M10 6h10M10 12h10M10 18h10M4 6h1M4 12h1M4 18h1"/></>:<><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor"/></>}</svg>;
  return <div className="np-cc-shell" data-testid="control-center-r65">
    <header className="np-cc-header"><div className="np-cc-heading"><div className="np-logo-frame np-cc-header-logo"><img alt="شعار نور" className="np-platform-logo" src="/noor-platform-logo.jpeg" /></div><div className="np-cc-heading-copy"><h1 className="np-control-title">مركز التحكم</h1></div></div><button aria-label="العودة إلى اليوم" className="np-cc-button" onClick={onClose} type="button">العودة لليوم ←</button></header>
    <section className="np-card np-control np-cc"><div className="np-cc-layout">
      <nav aria-label="أقسام مركز التحكم" className="np-cc-nav">{([["Habit","العادات"],["Task","المهام"],["finance","المالية"],["appearance","المظهر"]] as const).map(([id,label])=><button aria-current={section===id?"page":undefined} className={`np-cc-nav-item${section===id?" is-selected":""}`} key={id} onClick={()=>changeSection(id)} type="button">{icon(id)}<span>{label}</span>{(id==="Habit"||id==="Task")?<small>{definitions.filter(d=>d.kind===id&&d.state==="Active").length}</small>:null}</button>)}<p className="np-cc-nav-note">إدارة هادئة لعاداتك ومهامك.<br/>إنجاز اليوم في شاشة اليوم.</p></nav>
      <main className="np-cc-main">
        {section==="finance"?<FinanceCenter ledger={workspace?.finance ?? null} busy={busy} onCommand={onCommand} today={defaultStartDate}/>:section==="appearance"?<><div className="np-cc-title"><div><h2>مظهر نور</h2><p>اختيارك يُحفظ على هذا المتصفح.</p></div></div><div aria-label="اختيار المظهر" className="np-cc-themes">{([["noor","نور","دفء كريمي ولمسات ذهبية"],["light","فاتح","أبيض ورمادي بألوان هادئة"],["dark","داكن","سطوح فحمية ونصوص واضحة"]] as const).map(([id,title,copy])=><button aria-pressed={appearance===id} className={`np-cc-theme ${id}`} key={id} onClick={()=>onAppearance(id)} type="button"><span aria-hidden="true" className="np-cc-theme-preview"><i/><i/><i/></span><strong>{title}</strong><span>{copy}</span><small>{appearance===id?"المظهر الحالي":"اختيار المظهر"}</small></button>)}</div></>:<>
          <div className="np-cc-title"><div><h2>{kind==="Habit"?"العادات":"المهام"}</h2><p>{kind==="Habit"?"ابنِ روتينك، خطوة بخطوة.":"رتّب ما تريد إنجازه."}</p></div><button className="np-cc-button primary" onClick={()=>{setFormError(null);setFormSession(value=>value+1);setCreating(true);}} type="button" aria-expanded={creating}>{kind==="Habit"?"+ إضافة عادة":"+ إضافة مهمة"}</button></div>
          <div className="np-cc-tools"><input aria-label="البحث في العناصر" className="np-input" onChange={event=>setQuery(event.target.value)} onInput={event=>setQuery(event.currentTarget.value)} placeholder="ابحث بالاسم أو القسم…" type="search" value={query}/><select aria-label="تصفية الحالة" className="np-select" onChange={event=>{setFilter(event.target.value);setConfirmArchive(null);}} value={filter}><option value="active">النشطة</option><option value="paused">المتوقفة</option><option value="all">الكل</option>{kind==="Task"?<option value="completed">المكتملة اليوم</option>:null}<option value="archived">المؤرشفة</option></select></div>
          <div className="np-cc-results" aria-live="polite">{matches.length} {kind==="Habit"?"عادة":"مهمة"}</div>
          {!workspace?<p role="status" className="np-empty">تعذر تحميل العناصر حاليًا. أعد فتح مركز التحكم بعد تحديث الصفحة.</p>:matches.length===0?<div className="np-empty"><strong>لا توجد عناصر مطابقة</strong><span>غيّر البحث أو الفلتر، أو أضف عنصرًا جديدًا.</span></div>:<div aria-label={kind==="Habit"?"قائمة العادات":"قائمة المهام"} className="np-cc-list">{matches.map(item=><div className="np-cc-expandable" key={item.id}><button aria-expanded={selected?.id===item.id} aria-controls={`np-detail-${item.id}`} className={`np-cc-row${selected?.id===item.id?" is-selected":""}`} onClick={()=>{setSelectedId(selectedId===item.id?null:item.id);setConfirmArchive(null);}} type="button"><span className="np-cc-row-icon">{icon(item.kind)}</span><span className="np-cc-row-copy"><strong>{item.title}</strong><span>{item.category} · {scheduleLabel(item)}</span></span><span className={`np-cc-status ${item.state.toLowerCase()}`}>{item.state==="Paused"?"متوقفة":item.state==="Archived"?"مؤرشفة":currentExecution(item.id)?.status==="Completed"?"مكتملة اليوم":"نشطة"}</span></button>{selected?.id===item.id?<div aria-label="تفاصيل العنصر" className="np-cc-inline-detail" id={`np-detail-${item.id}`}><p className="np-cc-kicker">{selected.kind==="Habit"?"تفاصيل العادة":"تفاصيل المهمة"}</p><h2>{selected.title}</h2><dl><dt>القسم</dt><dd>{selected.category}</dd><dt>الحالة</dt><dd>{selected.state==="Active"?"نشطة":selected.state==="Paused"?"متوقفة مؤقتًا":selected.state==="Stopped"?"متوقفة نهائيًا":"مؤرشفة"}</dd><dt>تاريخ البداية</dt><dd>{selected.startDate}</dd><dt>تاريخ النهاية</dt><dd>{selected.endDate??"غير محدد"}</dd><dt>الجدول</dt><dd>{scheduleLabel(selected)}</dd><dt>الأهمية</dt><dd>{({Essential:"أساسي",Important:"مهم",Supporting:"داعم",Optional:"اختياري"} as Record<string,string>)[selected.importance]??selected.importance}</dd></dl><div className="np-cc-actions">
        {selected.state!=="Archived"?<button className="np-cc-button" disabled={busy} onClick={()=>{void apply({type:"set-definition-state",definitionId:selected.id,state:selected.state==="Paused"?"Active":"Paused"});}} type="button">{selected.state==="Paused"?"إعادة التشغيل":"إيقاف مؤقت"}</button>:null}
        {selected.kind==="Task"&&selected.state!=="Archived"&&currentExecution(selected.id)?<button className="np-cc-button primary" disabled={busy||currentExecution(selected.id)?.status==="Suppressed"} onClick={()=>{const item=currentExecution(selected.id);if(item)void apply({type:"set-execution-completed",executionId:item.id,completed:item.status!=="Completed"});}} type="button">{currentExecution(selected.id)?.status==="Completed"?"إعادة فتح المهمة":"إنهاء مهمة اليوم"}</button>:selected.kind==="Task"&&selected.state!=="Archived"?<p className="np-cc-help">يظهر زر الإنجاز عندما يكون للمهمة تنفيذ مجدول اليوم.</p>:null}
        {selected.state!=="Archived"?<button className="np-cc-button danger" disabled={busy} onClick={()=>setConfirmArchive(selected.id)} type="button">أرشفة {selected.kind==="Habit"?"العادة":"المهمة"}</button>:<p className="np-cc-help">العنصر مؤرشف، وسجله محفوظ.</p>}
        <button className="np-cc-button danger" disabled={busy} onClick={()=>{setDeleteId(selected.id);setDeletePhrase("");}} type="button">حذف نهائي من قاعدة البيانات</button>
        {deleteId===selected.id?<div className="np-cc-confirm" role="alert"><p>سيُحذف هذا العنصر وكل تنفيذاته وسجلاته المرتبطة نهائيًا، وسيتغير سجل الإنجاز والإحصاءات. لا يمكن التراجع من المنصة.</p><label className="np-label" htmlFor="np-delete-phrase">اكتب «حذف» للتأكيد</label><input autoComplete="off" className="np-input" id="np-delete-phrase" onChange={event=>setDeletePhrase(event.target.value)} onInput={event=>setDeletePhrase(event.currentTarget.value)} value={deletePhrase}/><button className="np-cc-button danger" disabled={busy||deletePhrase.trim()!=="حذف"} onClick={()=>{void apply({type:"delete-definition",definitionId:selected.id,confirm:true});}} type="button">تأكيد الحذف النهائي</button><button className="np-cc-button" disabled={busy} onClick={()=>{setDeleteId(null);setDeletePhrase("");}} type="button">إلغاء الحذف</button></div>:null}
        {confirmArchive===selected.id?<div className="np-cc-confirm" role="alert"><p>أرشفة هذا العنصر؟ سيُحفظ تاريخه.</p><button className="np-cc-button danger" disabled={busy} onClick={()=>{void apply({type:"archive-definition",definitionId:selected.id});}} type="button">تأكيد الأرشفة</button><button className="np-cc-button" disabled={busy} onClick={()=>setConfirmArchive(null)} type="button">إلغاء</button></div>:null}
      </div></div>:null}</div>)}</div>}
        </>}

      </main>
    </div></section>
    <div className="np-cc-modal-backdrop" hidden={!creating} onClick={event=>{if(event.target===event.currentTarget)closeCreate();}}>
      <div aria-labelledby="np-create-dialog-title" aria-modal="true" className="np-cc-modal" onKeyDown={trapDialogKeys} ref={dialogRef} role="dialog" tabIndex={-1}>
        <div className="np-cc-modal-head"><div><p className="np-cc-kicker">إضافة إلى نور</p><h2 id="np-create-dialog-title">{kind==="Habit"?"عادة جديدة":"مهمة جديدة"}</h2></div><button aria-label="إغلاق نافذة الإضافة" className="np-cc-button" disabled={busy} onClick={closeCreate} type="button">إغلاق ×</button></div>
        <div className="np-cc-modal-body">{formError?<p className="np-action-error" role="alert">{formError}</p>:null}<DefinitionForm key={`${kind}-${formSession}`} busy={busy} defaultStartDate={defaultStartDate} defaultKind={kind} onCommand={apply}/></div>
        <div className="np-cc-modal-footer"><span>الحقول المعلّمة بنجمة مطلوبة.</span><button className="np-cc-button" disabled={busy} onClick={closeCreate} type="button">إلغاء</button></div>
      </div>
    </div>
  </div>;
}

const END_REASON_LABELS = {achieved:"تم الإنجاز",expired:"انتهى الوقت دون اكتمال",cancelled:"إلغاء المهمة"};
function ActivityCard({item,definition,busy,onCommand}:{item:ExecutionItem;definition?:DefinitionItem;busy:boolean;onCommand:(command:NoorPersonalCommandInput)=>Promise<boolean>}):ReactElement {
 const [mode,setMode]=useState<"note"|"finish"|null>(null);
 const [error,setError]=useState("");
 const [entryId,setEntryId]=useState("");
 const panel=useRef<HTMLDivElement>(null);
 const opener=useRef<HTMLElement|null>(null);
 const log=definition?.activityLog ?? [];
 const total=Math.round(log.reduce((sum,e)=>sum+e.amount,0)*1e6)/1e6;
 const completed=item.status==="Completed";
 const task=item.kind==="Task";
 const ended=definition?.state==="Stopped";
 const canRecord=item.status!=="Suppressed" && definition?.state==="Active";
 const disabled=busy || !canRecord;
 const relevant=task ? log : log.filter(e=>e.executionId===item.id);
 const latest=relevant.at(-1);
 const open=(value:"note"|"finish")=>{opener.current=document.activeElement as HTMLElement;setError("");setEntryId(globalThis.crypto.randomUUID());setMode(value);};
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
 return <div className="np-item np-activity-item" data-testid={`activity-card-${item.id}`}>
  <div className="np-item-main"><p className="np-item-title">{item.title}</p><div className="np-item-meta"><span className="np-kind-badge">{task?"مهمة":"عادة"}</span><span>{ended && latest?.endReason ? END_REASON_LABELS[latest.endReason] : STATUS_LABELS[item.status] ?? item.status}</span></div>
  {definition?.measurement ? <div className="np-progress-copy"><span>{arabicNumber(total)} / {arabicNumber(definition.measurement.target)} {definition.measurement.unit}</span><progress aria-label={`تقدم ${item.title}`} max={definition.measurement.target} value={total}/></div> : null}
  {latest?.note ? <p className="np-activity-note">{latest.note}</p> : null}</div>
  <div className="np-activity-actions"><button aria-label={`تسجيل ملاحظة${task?" أو تقدم":""}: ${item.title}`} title="تسجيل ملاحظة" className="np-btn secondary np-pencil" disabled={busy} onClick={()=>open("note")} type="button"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
  {task ? <button className="np-btn complete" disabled={disabled} onClick={()=>open("finish")} type="button">{ended?"منتهية":"إنهاء"}</button> : <label className="np-habit-check-target"><input aria-label={`إتمام عادة ${item.title} اليوم`} className="np-habit-check" type="checkbox" checked={completed} disabled={disabled} onChange={event=>{void onCommand({type:"set-execution-completed",executionId:item.id,completed:event.currentTarget.checked});}}/></label>}</div>
  {mode ? createPortal(<div className="np-activity-backdrop" onClick={event=>{if(event.target===event.currentTarget)close();}}><div aria-modal="true" aria-label={`${mode==="finish"?"إنهاء":"تسجيل"} ${item.title}`} className="np-activity-dialog" ref={panel} role="dialog" onKeyDown={event=>{
   if(event.key==="Escape"){event.preventDefault();close();}
   if(event.key==="Tab"){
    const controls=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)') ?? []);
    const first=controls[0],last=controls.at(-1);
    if(!first){event.preventDefault();return;}
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
   }
  }}><h2>{mode==="finish"?"إنهاء المهمة":"تسجيل ملاحظة أو إنجاز"}</h2><p>{item.title}</p>
  {canRecord ? <form onSubmit={event=>{void save(event);}}>
  {task && definition?.measurement ? <label>الكمية المنجزة الجديدة ({definition.measurement.unit})<input name="amount" type="number" min="0" max={Math.max(0,definition.measurement.target-total)} step="0.000001" defaultValue="0" disabled={busy}/><small>المسجل سابقًا: {arabicNumber(total)} — أضف إنجاز هذه المرة فقط.</small></label> : null}
  {mode==="finish" ? <label>سبب الإنهاء<select name="endReason" required disabled={busy} defaultValue=""><option disabled value="">اختر السبب</option><option value="achieved">تم الإنجاز</option><option value="expired">انتهى الوقت دون اكتمال</option><option value="cancelled">إلغاء المهمة</option></select></label> : null}
  <label>{task?"تفاصيل الإنجاز / الملاحظة":"ملاحظة اليوم"}<textarea name="note" rows={3} maxLength={2000} disabled={busy}/></label>
  {mode==="finish" ? <p className="np-activity-help">سيُحفظ السبب وتتوقف المهمة عن الظهور في الأيام التالية. الإنهاء دون إنجاز لا يُحسب إنجازًا.</p> : null}
  {error ? <p role="alert" className="np-action-error">{error}</p> : null}
  <div className="np-activity-footer"><button className="np-btn secondary" disabled={busy} onClick={close} type="button">إلغاء</button><button className="np-btn complete" disabled={busy} type="submit">{busy?"جارٍ الحفظ…":"حفظ"}</button></div></form> : <button className="np-btn secondary" onClick={close} type="button">إغلاق</button>}
  <details className="np-activity-history" open={!canRecord || undefined}><summary>السجل ({arabicNumber(relevant.length)})</summary>{relevant.length===0?<p>لا توجد تسجيلات بعد.</p>:relevant.slice().reverse().map(e=><div key={e.id}><time dateTime={e.at}>{e.localDate}</time>{e.amount>0?<span> +{arabicNumber(e.amount)} {definition?.measurement?.unit}</span>:null}{e.endReason?<strong> · {END_REASON_LABELS[e.endReason]}</strong>:null}<p>{e.note}</p></div>)}</details>
  </div></div>,document.body) : null}
 </div>;
}

function Dashboard({ view, workspace, busy, actionError, onCommand, onOpenControl, nowMs }: { view: TodayViewModel; workspace: WorkspaceViewModel | null; busy: boolean; actionError: string | null; onCommand: (command: NoorPersonalCommandInput) => Promise<boolean>; onOpenControl: () => void; nowMs: number }): ReactElement {
  const dates = civilDateLabels(nowMs, view.timeZone);
  const location = headerLocationForTimeZone(view.timeZone);
  const [temperature,setTemperature] = useState<number | null>(null);
  const taskCompleted = completedCount(view.tasks);
  const habitCompleted = completedCount(view.habits);
  const totalToday = view.tasks.length + view.habits.length;
  const completedToday = taskCompleted + habitCompleted;
  const completionRate = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);
  const definitionsById = new Map((workspace?.definitions ?? []).map(definition => [definition.id, definition] as const));
  const grouped = useMemo(() => {
    const map = new Map<string, ExecutionItem[]>();
    for (const item of view.habits) {
      const category = definitionsById.get(item.definitionId)?.category ?? "عام";
      const values = map.get(category) ?? [];
      values.push(item);
      map.set(category, values);
    }
    return [...map.entries()].sort(([left],[right]) => left.localeCompare(right,"ar"));
  }, [view.habits, workspace]);
  const countdown = view.nextPrayer ? remainingPrayerSeconds(view.nextPrayer.at, nowMs) : 0;
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

  const nextKey = view.nextPrayer?.name === "Fajr" ? "fajr"
    : view.nextPrayer?.name === "Dhuhr" ? "dhuhr"
    : view.nextPrayer?.name === "Asr" ? "asr"
    : view.nextPrayer?.name === "Maghrib" ? "maghrib"
    : view.nextPrayer?.name === "Isha" ? "isha"
    : null;

  const night = nightCountdownState(view.prayerTimes,nowMs);
  const eventTimes = [
    ...view.prayerTimes,
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
            <span aria-label={gregorianDate} className="np-header-date-main"><span aria-hidden="true" className="np-date-full">{gregorianDate}</span><span aria-hidden="true" className="np-date-compact">{compactCalendarDate("gregory")}</span></span>
            <span className="np-header-date-caption">التاريخ الميلادي</span>
          </div>
          <span className="np-header-date-divider" />
          <div className="np-header-date-block">
            <span aria-label={dates.hijri} className="np-header-date-main hijri"><span aria-hidden="true" className="np-date-full">{dates.hijri}</span><span aria-hidden="true" className="np-date-compact">{compactCalendarDate("islamic-umalqura")}</span></span>
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
      <div aria-label="مواقيت الصلاة وأوقات الليل" className="np-prayer-times" data-testid="prayer-times-strip" role="region" tabIndex={0}>
        {eventTimes.map(prayer => {
          const isNext = prayer.key === nextKey;
          const isNightEvent = prayer.key === "midnight" || prayer.key === "last-third";
          const nightRemaining = isNightEvent ? remainingPrayerSeconds(prayer.at,nowMs) : 0;
          const showNightCountdown = isNightEvent && night?.enabled && nightRemaining > 0;

          return <div className={`np-prayer ${isNext ? "is-next" : ""} ${isNightEvent ? "np-night-event" : ""}`} data-prayer-key={prayer.key} data-event-at={prayer.at} data-night-countdown-active={isNightEvent ? String(Boolean(night?.enabled)) : undefined} key={prayer.key}>
            <span className="np-prayer-symbol">{prayerSymbol(prayer.key)}</span>
            <span className="np-prayer-label">{prayer.label}</span>
            <span className="np-prayer-time">{formatTime(prayer.at,view.timeZone)}</span>
            {isNext && view.nextPrayer ? <span className="np-countdown" data-testid="prayer-countdown">
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

    <div className="np-main-grid">
      <div className="np-execution-stack">
        <section aria-label="عادات اليوم" className="np-habits-section">
          <div className="np-section-heading"><h2>عادات اليوم</h2><span>كل قسم، خطوة للأمام</span></div>
          <div className="np-category-grid" data-testid="habit-category-grid">
            {grouped.length === 0
              ? <section className="np-card np-category np-habits-empty"><div className="np-empty"><strong>مساحة لعاداتك</strong><span>لا توجد عادات مجدولة اليوم. ستظهر أقسامها هنا حسب تصنيفاتك الحالية.</span></div></section>
              : grouped.map(([category,items]) => {
                const done = completedCount(items);
                const rate = items.length === 0 ? 0 : Math.round(done / items.length * 100);
                const circumference = 2 * Math.PI * 24;
                return <section className="np-card np-category np-habit-category" data-testid="habit-category-card" key={category}>
                  <div className="np-category-head">
                    <div className="np-category-heading"><h3 className="np-category-title">{category}</h3><span className="np-category-count">{arabicNumber(done)} من {arabicNumber(items.length)} مكتمل</span></div>
                    <div aria-label={`إنجاز قسم ${category}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rate} aria-valuetext={`${arabicNumber(done)} من ${arabicNumber(items.length)} عادات، ${arabicNumber(rate)}%`} className={`np-category-progress${rate === 100 ? " is-complete" : ""}`} role="progressbar">
                      <svg aria-hidden="true" viewBox="0 0 60 60"><circle className="np-ring-track" cx="30" cy="30" r="24"/><circle className="np-ring-value" cx="30" cy="30" r="24" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - rate / 100)}/></svg>
                      <span aria-hidden="true">{arabicNumber(rate)}<small>%</small></span>
                    </div>
                  </div>
                  <div className="np-list">{items.map(item => { return <ActivityCard key={item.id} item={item} definition={definitionsById.get(item.definitionId)} busy={busy} onCommand={onCommand}/>; })}</div>
                </section>;
              })}
          </div>
        </section>
        {view.tasks.length > 0 ? <section aria-label="مهام اليوم" className="np-card np-category np-tasks-card"><div className="np-category-head"><h2 className="np-category-title">مهام اليوم</h2><span className="np-category-count">{arabicNumber(view.tasks.length)} مهام</span></div><div className="np-list">{view.tasks.map(item => { return <ActivityCard key={item.id} item={item} definition={definitionsById.get(item.definitionId)} busy={busy} onCommand={onCommand}/>; })}</div></section> : null}
      </div>

      <aside className="np-side-stack" data-testid="today-summary">
        <h2 className="np-summary-heading">ملخص اليوم</h2>
        <section className="np-card np-metric-card">
          <span className="np-metric-label">إنجاز اليوم</span>
          <strong className="np-metric-value" data-testid="today-completion-rate">{arabicNumber(completionRate)}%</strong>
          <span className="np-metric-copy">{arabicNumber(completedToday)} من {arabicNumber(totalToday)} عناصر</span>
        </section>
        <section className="np-card np-metric-card">
          <span className="np-metric-label">المهام</span>
          <strong className="np-metric-value">{arabicNumber(taskCompleted)} / {arabicNumber(view.tasks.length)}</strong>
          <span className="np-metric-copy">المكتمل من مهام اليوم</span>
        </section>
        <section className="np-card np-metric-card">
          <span className="np-metric-label">العادات</span>
          <strong className="np-metric-value">{arabicNumber(habitCompleted)} / {arabicNumber(view.habits.length)}</strong>
          <span className="np-metric-copy">المكتمل من عادات اليوم</span>
        </section>
        <section className="np-card np-metric-card">
          <span className="np-metric-label">السلسلة الحالية</span>
          <strong className="np-metric-value">{arabicNumber(workspace?.currentStreakDays ?? 0)} يوم</strong>
          <span className="np-metric-copy">الأفضل: {arabicNumber(workspace?.bestStreakDays ?? 0)} يوم</span>
        </section>
      </aside>
    </div>

    <section className="np-card np-insights">
      <div className="np-insights-head">
        <div><p className="np-eyebrow">الإحصاءات</p><h2 className="np-category-title">اتجاه الإنجاز</h2></div>
        {workspace ? <div className="np-streaks">قراءة مختصرة لأدائك عبر الفترات</div> : null}
      </div>
      {workspace ? <div className="np-insights-grid"><InsightCard insight={workspace.periods.week} label="آخر 7 أيام"/><InsightCard insight={workspace.periods.month} label="آخر 30 يومًا"/><InsightCard insight={workspace.periods.quarter} label="آخر 90 يومًا"/><InsightCard insight={workspace.periods.year} label="آخر 365 يومًا"/></div> : <div className="np-empty"><strong>الإحصاءات غير متاحة مؤقتًا</strong><span>سيُعاد تحميلها تلقائيًا.</span></div>}
    </section>
  </>;
}

function StatePage({ title, copy }: { title: string; copy: string }): ReactElement {
  return <section className="np-card np-date-card"><img alt="شعار نور" className="np-state-logo" src="/noor-platform-logo.jpeg" /><h1 className="np-control-title">{title}</h1><p className="np-control-subtitle">{copy}</p></section>;
}

export function NoorPersonalApplicationView({ initialResult, initialWorkspace }: NoorPersonalApplicationViewProps): ReactElement {
  const [result,setResult] = useState<NoorPersonalTodayResult | null>(initialResult ?? null);
  const [workspaceResult,setWorkspaceResult] = useState<NoorPersonalWorkspaceResult | null>(initialWorkspace ?? null);
  const [busy,setBusy] = useState(false);
  const [actionError,setActionError] = useState<string | null>(null);
  const [controlOpen,setControlOpen] = useState(false);
  const [appearance,setAppearance] = useState<NoorAppearance>(() => {
    try { const saved = typeof window !== "undefined" ? window.localStorage.getItem("noor:appearance:v1") : null;return saved === "light" || saved === "dark" ? saved : "noor"; } catch { return "noor"; }
  });
  const chooseAppearance = (value: NoorAppearance) => { setAppearance(value);try { window.localStorage.setItem("noor:appearance:v1",value); } catch { /* The selected theme still works for this session. */ } };

  const [nowMs,setNowMs] = useState(() => Date.now());
  const prayerRefreshRef = useRef<string | null>(null);

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
    const timer = window.setInterval(() => setNowMs(Date.now()),1000);
    return () => window.clearInterval(timer);
  }, []);

  const view = useMemo(()=>result?.kind === "success" ? buildViewModel(result.today) : null,[result]);
  const workspace = useMemo(()=>workspaceResult?.kind === "success" ? buildWorkspaceViewModel(workspaceResult.workspace) : null,[workspaceResult]);

  useEffect(() => {
    const at = view?.nextPrayer?.at;
    if (!at) return;
    const target = new Date(at).getTime();
    if (!Number.isFinite(target)) return;
    const delay = Math.max(0,target - Date.now() + 1200);
    const timer = window.setTimeout(() => {
      if (prayerRefreshRef.current === at) return;
      prayerRefreshRef.current = at;
      void refresh().finally(() => {
        prayerRefreshRef.current = null;
      });
    },delay);
    return () => window.clearTimeout(timer);
  }, [view?.nextPrayer?.at]);

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
    }
  };

  let content: ReactElement;
  if (!result) {
    content = <StatePage copy="جارٍ تحميل يومك..." title="جاري التحميل" />;
  } else if (result.kind === "setup-required") {
    content = <StatePage copy="يلزم استكمال إعداد الموقع وسياسة الصلاة قبل بدء يوم نور." title="الإعداد مطلوب" />;
  } else if (result.kind === "unavailable" || !view) {
    content = <StatePage copy="تعذر تحميل بيانات نور حاليًا." title="الخدمة غير متاحة" />;
  } else {
    const defaultStartDate = civilLocalDate(nowMs, view.timeZone);
    content = controlOpen
      ? <>{actionError ? <p className="np-action-error" role="alert">{actionError}</p> : null}<ControlCenter appearance={appearance} onAppearance={chooseAppearance} executions={[...view.tasks,...view.habits]} busy={busy} defaultStartDate={defaultStartDate} onClose={() => setControlOpen(false)} onCommand={runCommand} workspace={workspace} /></>
      : <Dashboard actionError={actionError} busy={busy} nowMs={nowMs} onCommand={runCommand} onOpenControl={() => setControlOpen(true)} view={view} workspace={workspace} />;
  }

  return <><style>{PAGE_STYLES}</style><section className="np-page" data-appearance={appearance} data-design-version="r62-visible-layout-fix" dir="rtl"><div className="np-wrap">{syncing?<p className="np-sync-status" role="status">تم الحفظ، جارٍ تحديث جدول اليوم…</p>:null}{content}</div></section></>;
}
