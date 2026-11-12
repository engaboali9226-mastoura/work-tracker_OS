/**
 * R305 — NOOR Calm visual system for the Personal dashboard.
 *
 * Presentation only. This module must not read or persist account data,
 * change activity states, or alter the achievement formula.
 * Scoped to .np-page, preserving NOOR Work, auth and administrative screens.
 */
export const NOOR_R305_VISUAL_STYLES = String.raw\`
/* NOOR_R305_VISUAL_REDESIGN_BEGIN */
.np-page{
  --r305-navy:#18364b;
  --r305-forest:#216d60;
  --r305-gold:#b48a4d;
  --r305-ivory:#f8f5ee;
  --r305-hero-edge:#d9c9ae;
}
.np-page .np-wrap{width:min(1328px,calc(100% - 38px));padding-top:24px}
.np-page .np-topbar[data-testid="platform-topbar"]{
  border-radius:30px;
  border:1px solid #e5d9c8;
  background:linear-gradient(125deg,#fffdf9 5%,#f7f4ed 55%,#eef5f3 100%);
  box-shadow:0 12px 34px rgba(29,53,64,.08);
  margin-bottom:18px;
}
.np-page .np-topbar .np-header-day{color:var(--r305-navy);font-weight:800}
.np-page .np-topbar .np-header-clock{color:var(--r305-navy);font-weight:780;letter-spacing:-.035em}
.np-page .np-icon-btn{border-radius:15px;transition:transform .18s ease,box-shadow .18s ease}
.np-page .np-icon-btn:hover{transform:translateY(-1px);box-shadow:0 7px 16px #142f4620}
.np-page .np-r305-intro{
  position:relative;isolation:isolate;overflow:hidden;
  display:grid;grid-template-columns:minmax(0,1.5fr) minmax(295px,.92fr);
  align-items:center;column-gap:26px;row-gap:18px;
  margin-bottom:18px;padding:23px 28px;
  border:1px solid #325a61;border-radius:28px;
  background:linear-gradient(122deg,#143349 0%,#194b52 55%,#25685c 100%);
  color:#f8fbf8;box-shadow:0 18px 38px rgba(16,46,58,.18);
}
.np-page .np-r305-intro::before{content:"";position:absolute;z-index:-1;inset:-80px auto auto -60px;width:300px;height:300px;border:1px solid #ffffff1a;border-radius:50%;box-shadow:0 0 0 35px #ffffff08,0 0 0 80px #ffffff05;pointer-events:none}
.np-page .np-r305-intro-copy{min-width:0;display:grid;justify-items:start;gap:8px}
.np-page .np-r305-kicker{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:750;letter-spacing:.075em;color:#f2d6a7}
.np-page .np-r305-kicker::before{content:"";width:7px;height:7px;border-radius:50%;background:#d7b278;box-shadow:0 0 0 4px #d7b27820}
.np-page .np-r305-intro h2{margin:0;font-size:clamp(22px,2.6vw,32px);font-weight:800;line-height:1.45;color:#fff}
.np-page .np-r305-intro p{margin:0;color:#dce9e5;font-size:13px;line-height:1.85;max-width:58ch}
.np-page .np-r305-intro-links{display:flex;flex-wrap:wrap;gap:9px;margin-top:7px}
.np-page .np-r305-intro-links a{min-height:44px;display:inline-flex;justify-content:center;align-items:center;gap:7px;border-radius:13px;padding:9px 16px;font-size:12px;font-weight:750;text-decoration:none;white-space:nowrap;transition:transform .16s ease,background .16s ease}
.np-page .np-r305-intro-links a:first-child{background:#f5e1b4;color:#153448;border:1px solid #f9edcf}
.np-page .np-r305-intro-links a:last-child{color:#f4f8f8;background:#ffffff12;border:1px solid #ffffff55}
.np-page .np-r305-intro-links a:hover{transform:translateY(-2px)}
.np-page .np-r305-intro-links a:focus-visible{outline:3px solid #f5df9d;outline-offset:3px}
.np-page .np-r305-intro-metrics{min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.np-page .np-r305-intro-metric{min-width:0;display:grid;align-content:center;justify-items:center;gap:5px;padding:15px 7px;min-height:96px;border-radius:18px;border:1px solid #ffffff32;background:#ffffff10;backdrop-filter:blur(8px)}
.np-page .np-r305-intro-metric strong{font-size:clamp(22px,2.5vw,30px);line-height:1.1;font-weight:790;font-variant-numeric:tabular-nums;color:#fff}
.np-page .np-r305-intro-metric span{font-size:10px;line-height:1.5;font-weight:650;color:#d6e9e6;text-align:center}
.np-page .np-r305-intro-metric:first-child{background:#f5e2b318;border-color:#f5e2b35c}
.np-page .np-r305-intro-metric:first-child strong{color:#f6d9a4}

/* Prayer strip remains prominent. The new treatment improves scanning only. */
.np-page .np-prayer-card{
  border:1px solid #e7dfd0;border-radius:25px;
  background:linear-gradient(170deg,#fffdf9,#f8f6f0);
  box-shadow:0 9px 26px #18374b09;margin-bottom:14px;
}
.np-page .np-prayer-card-title{color:var(--r305-navy);font-size:22px}
.np-page .np-prayer{border-radius:16px;transition:border-color .2s ease,background .2s ease}
.np-page .np-prayer.is-next{background:#fff1cf;border-color:#d5ab61;box-shadow:inset 0 0 0 1px #c894452b}
.np-page .np-prayer-card-head{margin-bottom:12px}
.np-page .np-prayer-symbol{color:var(--r305-gold)}

/* The actual achievement score is unchanged; its hero hierarchy is redesigned. */
.np-page .np-day-achievement{
  grid-template-columns:103px minmax(0,1fr) auto;
  align-items:center;gap:18px 21px;
  padding:24px 28px;margin:8px 0 18px;
  border:1px solid var(--r305-hero-edge);
  border-radius:28px;background:linear-gradient(126deg,#fffdf8 0%,#f8f5ee 65%,#ecf5f1 100%);
  box-shadow:0 12px 34px rgba(37,58,61,.085);
}
.np-page .np-day-ring{width:102px;height:102px}
.np-page .np-day-ring circle{stroke-width:6}
.np-page .np-day-ring-fill{stroke:#267968;opacity:1}
.np-page .np-day-ring-track{stroke:#d5e3db}
.np-page .np-day-ring strong{font-size:27px;font-weight:800;letter-spacing:-.06em;color:var(--r305-navy)}
.np-page .np-day-achievement-copy h2{font-size:clamp(21px,2vw,26px);font-weight:790;color:var(--r305-navy);margin-bottom:6px}
.np-page .np-day-achievement-copy h2 small{display:inline-block;padding:3px 8px;border-radius:999px;background:#e6efe9;color:#326a58;font-size:10px;font-weight:650;vertical-align:middle}
.np-page .np-day-achievement-copy p{font-size:13px;color:#516b71}
.np-page button.np-day-remaining{display:grid;align-content:center;justify-items:center;gap:4px;min-height:82px;padding:10px 19px;border:1px solid #e4d1b4;border-radius:18px;background:#fbf1dc;color:var(--r305-navy);cursor:pointer}
.np-page .np-day-remaining strong{font-size:30px;font-weight:800}
.np-page .np-day-remaining span{font-size:11px;color:#725b42;font-weight:650}
.np-page .np-day-context{gap:20px;padding-top:18px;border-top:1px solid #e1dccf}
.np-page .np-yesterday{border-radius:14px;border-inline-end:0;background:#fff9ed;border:1px solid #ebe0c7;padding:12px 14px}
.np-page .np-yesterday-heading,.np-page .np-week-heading h3{font-size:12px;font-weight:750}
.np-page .np-week-day{border:1px solid transparent;border-radius:13px;min-height:72px;padding:9px 3px;gap:5px;transition:background .18s ease,border-color .18s ease}
.np-page .np-week-day.is-today{background:#e5f1eb;border-color:#a9cebc}
.np-page .np-week-day.is-selected{border-color:#3f8473;background:#dcece2}
.np-page .np-week-day:not(:disabled):hover{background:#eaf3ee}
.np-page .np-week-name{font-size:11px}
.np-page .np-week-value strong{font-size:15px;font-weight:800}
.np-page .np-week-days{gap:5px}

/* Shared language for grouping, task cards, habit cards and quick actions. */
.np-page .np-activity-switch-r304{margin:24px 0 16px;border-radius:22px;padding:15px 18px;background:linear-gradient(145deg,#fffdfa,#f8f5ed);box-shadow:0 8px 24px #2139440b}
.np-page .np-activity-switch-r304>strong{font-size:15px;font-weight:800}
.np-page .np-activity-switch-options-r304{gap:7px}
.np-page .np-activity-switch-options-r304 button{border-radius:11px;font-size:12px;font-weight:700;padding:10px 14px;background:#f4f1ea;color:#385268;border-color:#e5dece}
.np-page .np-activity-switch-options-r304 button[aria-pressed=true]{background:#1b5060;color:#fff;border-color:#1b5060;box-shadow:0 5px 13px #1b506026}
.np-page .np-section-heading{padding:4px 3px 8px}
.np-page .np-section-heading h2{font-size:23px;font-weight:800;color:var(--r305-navy)}
.np-page .np-category-grid{gap:16px}
.np-page .np-habit-category,.np-page .np-tasks-card,.np-page .np-unified-group-r304{
  border-radius:24px;border:1px solid #e4dccc;
  background:#fffefb;box-shadow:0 10px 25px #233a490b;overflow:hidden;
}
.np-page .np-habit-category>.np-category-head,.np-page .np-unified-group-r304>.np-category-head{padding:17px 18px 15px;background:linear-gradient(90deg,#f9f6ee,#ffffff);border-bottom:1px solid #ede7da}
.np-page .np-habit-category .np-category-title,.np-page .np-unified-group-r304 .np-category-title{color:var(--r305-navy);font-size:17px;font-weight:800}
.np-page .np-category-symbol{border-radius:13px;background:#eff3ed;border-color:#dbe8df}
.np-page .np-habit-category .np-ring-value{stroke:#267968}
.np-page .np-habit-category .np-category-progress>span{font-weight:800}
.np-page .np-tasks-card>.np-category-head{background:#f9f6ee;padding:17px 18px;margin:0;border-bottom:1px solid #ede7da}
.np-page .np-tasks-card .np-category-title{font-weight:800;color:var(--r305-navy)}
.np-page .np-habit-category .np-list,.np-page .np-tasks-card .np-list,.np-page .np-unified-group-r304 .np-list{gap:8px;padding:10px 12px 13px}
.np-page .np-execution-stack .np-item{border-radius:14px;transition:background .17s ease,border-color .17s ease}
.np-page .np-execution-stack .np-item:hover{background:#f7f9f6;border-color:#d6e3da}
.np-page .np-execution-stack .np-item-title{font-size:14px;font-weight:720;color:var(--r305-navy);line-height:1.55}
.np-page .np-execution-stack .np-item:focus-within{outline:2px solid #65a18f;outline-offset:2px}
.np-page .np-unified-groups-r304{gap:16px}
.np-page :is(.np-r305-intro,.np-activity-switch-r304,.np-day-achievement){scroll-margin-top:14px}
.np-page #noor-r305-weekly,.np-page #noor-r305-activity-heading{scroll-margin-top:16px}

/* Dark treatment preserves ink hierarchy without bright light-theme surfaces. */
.np-page[data-appearance=dark]{--r305-navy:#e6f0ed;--r305-hero-edge:#435a56;--r305-gold:#d7b67d}
.np-page[data-appearance=dark] .np-topbar[data-testid="platform-topbar"]{background:linear-gradient(120deg,#202e38,#243c40);border-color:#486060;box-shadow:0 12px 30px #050b1033}
.np-page[data-appearance=dark] .np-r305-intro{background:linear-gradient(120deg,#112734,#16443f);border-color:#365c5a;box-shadow:0 14px 35px #080d1240}
.np-page[data-appearance=dark] .np-prayer-card{background:linear-gradient(130deg,#222f39,#23383a);border-color:#475855}
.np-page[data-appearance=dark] .np-prayer.is-next{background:#443a27;border-color:#a98753}
.np-page[data-appearance=dark] .np-day-achievement{background:linear-gradient(120deg,#24343d,#233f3c);border-color:#455e58;box-shadow:0 12px 30px #06101833}
.np-page[data-appearance=dark] .np-day-ring-track{stroke:#45635e}
.np-page[data-appearance=dark] .np-day-ring-fill{stroke:#9dd3b5}
.np-page[data-appearance=dark] .np-day-ring strong{color:#f0f9f6}
.np-page[data-appearance=dark] .np-day-achievement-copy h2 small{background:#315348;color:#c1e2cc}
.np-page[data-appearance=dark] .np-day-achievement-copy p{color:#c2d6d2}
.np-page[data-appearance=dark] button.np-day-remaining{background:#403a2d;border-color:#7a6546;color:#f4e9d1}
.np-page[data-appearance=dark] .np-day-remaining span{color:#e3cba2}
.np-page[data-appearance=dark] .np-day-context{border-color:#48635b}
.np-page[data-appearance=dark] .np-yesterday{background:#2b383a;border-color:#4b5d58}
.np-page[data-appearance=dark] .np-week-day.is-today{background:#305b4d;border-color:#6f9d86}
.np-page[data-appearance=dark] .np-week-day.is-selected{background:#396857;border-color:#9cc5ac}
.np-page[data-appearance=dark] .np-week-day:not(:disabled):hover{background:#304c45}
.np-page[data-appearance=dark] .np-activity-switch-r304{background:linear-gradient(130deg,#222e37,#26353b);border-color:#435459}
.np-page[data-appearance=dark] .np-activity-switch-options-r304 button{background:#2b3a44;color:#dce9e7;border-color:#4b5f60}
.np-page[data-appearance=dark] .np-activity-switch-options-r304 button[aria-pressed=true]{background:#427b70;color:white;border-color:#78a99a}
.np-page[data-appearance=dark] :is(.np-habit-category,.np-tasks-card,.np-unified-group-r304){background:#202d36;border-color:#40535b}
.np-page[data-appearance=dark] .np-habit-category>.np-category-head,.np-page[data-appearance=dark] .np-unified-group-r304>.np-category-head,.np-page[data-appearance=dark] .np-tasks-card>.np-category-head{background:#26353c;border-color:#3e5056}
.np-page[data-appearance=dark] .np-execution-stack .np-item:hover{background:#2c403f;border-color:#426761}
.np-page[data-appearance=dark] .np-category-symbol{background:#2a4240;border-color:#47645e}
.np-page[data-appearance=dark] .np-section-heading h2,.np-page[data-appearance=dark] .np-execution-stack .np-item-title{color:#e6f0ed}

/* Mobile-first: keep the introductory surface usable before the times strip. */
@media(max-width:900px){
 .np-page .np-r305-intro{grid-template-columns:minmax(0,1fr);padding:21px 23px}
 .np-page .np-r305-intro-metrics{max-width:100%}
 .np-page .np-day-achievement{grid-template-columns:86px minmax(0,1fr) auto;padding:19px 20px}
 .np-page .np-day-ring{width:86px;height:86px}
 .np-page .np-day-ring strong{font-size:23px}
}
@media(max-width:700px){
 .np-page .np-wrap{width:min(100% - 20px,560px);padding-top:12px;padding-bottom:38px}
 .np-page .np-topbar[data-testid="platform-topbar"]{border-radius:23px;margin-bottom:12px;box-shadow:0 8px 22px #18394c14}
 .np-page .np-r305-intro{padding:17px 17px 15px;border-radius:22px;margin-bottom:13px;gap:14px}
 .np-page .np-r305-intro h2{font-size:23px}
 .np-page .np-r305-intro p{font-size:12px;line-height:1.8}
 .np-page .np-r305-kicker{font-size:10px}
 .np-page .np-r305-intro-metric{min-height:73px;padding:10px 5px;border-radius:13px}
 .np-page .np-r305-intro-metric strong{font-size:23px}
 .np-page .np-r305-intro-metric span{font-size:10px}
 .np-page .np-r305-intro-links{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .np-page .np-r305-intro-links a{padding:8px 5px;font-size:11px;white-space:normal;text-align:center}
 .np-page .np-prayer-card{border-radius:21px;margin-bottom:12px}
 .np-page .np-day-achievement{grid-template-columns:68px minmax(0,1fr) auto;gap:10px;padding:17px 13px;border-radius:22px;margin:8px 0 15px}
 .np-page .np-day-ring{width:68px;height:68px}
 .np-page .np-day-ring strong{font-size:18px}
 .np-page .np-day-achievement-copy h2{font-size:17px}
 .np-page .np-day-achievement-copy p{font-size:11px}
 .np-page button.np-day-remaining{min-height:65px;padding:7px 9px;border-radius:13px}
 .np-page .np-day-remaining strong{font-size:22px}
 .np-page .np-day-remaining span{font-size:9px}
 .np-page .np-day-context{gap:10px;padding-top:12px}
 .np-page .np-yesterday{padding:9px 11px}
 .np-page .np-week-day{min-height:60px;border-radius:9px;padding:7px 1px}
 .np-page .np-week-days{gap:2px}
 .np-page .np-week-name{font-size:9px}
 .np-page .np-week-value strong{font-size:12px}
 .np-page .np-activity-switch-r304{margin:18px 0 14px;padding:12px;border-radius:18px}
 .np-page .np-section-heading h2{font-size:19px}
 .np-page :is(.np-habit-category,.np-tasks-card,.np-unified-group-r304){border-radius:20px}
 .np-page .np-habit-category>.np-category-head{padding:13px 14px}
}
@media(max-width:380px){
 .np-page .np-r305-intro{padding:14px}
 .np-page .np-r305-intro h2{font-size:21px}
 .np-page .np-day-achievement{grid-template-columns:62px minmax(0,1fr);gap:8px}
 .np-page .np-day-ring{width:62px;height:62px}
 .np-page button.np-day-remaining{grid-column:1/-1;min-height:0;display:flex;gap:5px;justify-content:center;align-items:center;padding:8px}
 .np-page .np-day-remaining strong{font-size:18px}
}
@media(prefers-reduced-motion:reduce){
 .np-page .np-icon-btn,.np-page .np-r305-intro-links a,.np-page .np-prayer,.np-page .np-week-day,.np-page .np-execution-stack .np-item{transition:none}
}
/* NOOR_R305_VISUAL_REDESIGN_END */
\`;
