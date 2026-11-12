/**
 * R306: action-first design recovery.
 *
 * Only CSS. It must not change the canonical source of status, persistence or
 * credit. Scoped to NOOR Personal; NOOR Work and auth are not restyled.
 */
export const NOOR_R306_ACTION_STYLES = String.raw`
/* NOOR_R306_ACTION_FIRST_BEGIN */
.np-page{
  --r306-action-ink:#183947;
  --r306-action-accent:#236d60;
  --r306-action-line:#dedfd6;
}
.np-page .np-topbar[data-testid="platform-topbar"]{
  min-height:112px;padding-block:6px;
  margin-bottom:12px;border-radius:23px;
  box-shadow:0 4px 18px #213c4610;
}
.np-page .np-logo-frame{width:76px;height:76px}
.np-page .np-topbar .np-header-day{font-size:clamp(23px,2.3vw,30px)}
.np-page .np-prayer-card{box-shadow:none;border-color:#e4e2d9}
.np-page .np-prayer-card-title{font-size:19px}
.np-page .np-prayer-card-head{margin-bottom:7px}
.np-page .np-activity-switch-r304{
  position:relative;
  display:grid;gap:12px;
  padding:0 0 12px;
  margin:18px 0 11px;
  background:transparent;border:0;border-bottom:1px solid var(--r306-action-line);
  border-radius:0;box-shadow:none;
}
.np-page .np-r306-toolbar-heading{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:10px}
.np-page .np-r306-workspace-title{display:grid;gap:2px}
.np-page .np-r306-activity-label{font-size:11px;letter-spacing:.035em;color:#55776c;font-weight:740}
.np-page .np-r306-workspace-title>strong{font-size:clamp(21px,2.1vw,27px);color:var(--r306-action-ink);line-height:1.45;font-weight:800}
.np-page .np-r306-add-button{
  display:inline-flex;align-items:center;justify-content:center;
  gap:6px;min-height:43px;border-radius:13px;border:1px solid #215f53;
  background:#1e665a;color:#fff;padding:9px 15px;
  font:inherit;font-size:12px;font-weight:750;cursor:pointer;
  box-shadow:0 4px 12px #1e665a1d;
}
.np-page .np-r306-add-button:disabled{opacity:.5;cursor:default}
.np-page .np-r306-add-button:focus-visible,.np-page .np-r306-focus-controls button:focus-visible{
  outline:3px solid #d1a961;outline-offset:3px
}
.np-page .np-r306-tool-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0}
.np-page .np-r306-focus-controls{
  display:inline-flex;align-items:center;gap:3px;max-width:100%;
  padding:4px;border-radius:13px;border:1px solid #dce6df;background:#eef4ef
}
.np-page .np-r306-focus-controls button{
  border:1px solid transparent;border-radius:10px;
  background:transparent;color:#44645d;min-height:40px;
  min-width:65px;padding:8px 10px;cursor:pointer;
  font:inherit;font-size:12px;font-weight:740;
}
.np-page .np-r306-focus-controls button[aria-pressed=true]{
  color:#fff;background:#216d60;border-color:#216d60;
  box-shadow:0 2px 8px #1d63532a
}
.np-page .np-activity-switch-options-r304{
  display:flex;gap:5px;align-items:center;min-width:0;flex:1 1 370px;
  overflow-x:auto;padding-bottom:2px;
  scrollbar-width:thin
}
.np-page .np-activity-switch-options-r304 button{
  border:1px solid #e2dfd5;background:transparent;color:#536b72;
  border-radius:11px;min-height:40px;padding:8px 11px;font-size:12px;
}
.np-page .np-activity-switch-options-r304 button[aria-pressed=true]{
  color:#143d48;border-color:#d6e4db;background:#dfede5;box-shadow:none
}
.np-page .np-main-grid.np-daily-only{
  margin-top:0;margin-bottom:20px;
  grid-template-columns:minmax(0,1fr);direction:rtl;min-width:0
}
.np-page .np-execution-stack{display:flex;flex-direction:column;gap:16px;min-width:0}
.np-page .np-tasks-card{order:-2}
.np-page .np-habits-section{order:0}
.np-page .np-unified-groups-r304{order:-2}
.np-page .np-tasks-card,
.np-page .np-habit-category,
.np-page .np-unified-group-r304{
  border:1px solid #e2e4de;background:#fffefa;
  border-radius:19px;box-shadow:0 2px 10px #173b4008
}
.np-page .np-tasks-card>.np-category-head,
.np-page .np-habit-category>.np-category-head,
.np-page .np-unified-group-r304>.np-category-head{
  background:#f6f8f3;border-bottom:1px solid #e6e9e2;
  padding:14px 16px
}
.np-page .np-habit-category .np-category-title,
.np-page .np-tasks-card .np-category-title,
.np-page .np-unified-group-r304 .np-category-title{
  font-size:16px;line-height:1.4;color:var(--r306-action-ink)
}
.np-page .np-category-count{font-size:11px;line-height:1.5}
.np-page .np-category-grid{gap:12px}
.np-page .np-category-head{margin-bottom:0}
.np-page .np-execution-stack .np-item{
  border-color:#e8ebe6;background:#fff;
  border-radius:12px;min-height:52px
}
.np-page .np-execution-stack .np-item:hover{
  border-color:#b9d7c9;background:#f3f9f4
}
.np-page .np-execution-stack .np-item-title{
  color:var(--r306-action-ink);font-size:13px;font-weight:735
}
.np-page .np-habit-category .np-list,
.np-page .np-tasks-card .np-list,
.np-page .np-unified-group-r304 .np-list{
  gap:6px;padding:10px
}
.np-page .np-day-achievement{
  margin-top:16px;padding:15px 18px;
  background:linear-gradient(115deg,#fdfbf7,#f6f9f4);
  border:1px solid #e3e2d9;border-radius:19px;box-shadow:none;
  grid-template-columns:68px minmax(0,1fr) auto;
}
.np-page .np-day-ring{width:68px;height:68px}
.np-page .np-day-ring strong{font-size:19px}
.np-page .np-day-achievement-copy h2{font-size:18px}
.np-page .np-day-achievement-copy p{font-size:11px}
.np-page .np-day-context{gap:12px;padding-top:13px}
.np-page .np-week-day{min-height:65px;box-shadow:none}
.np-page .np-yesterday{background:#f7f7f2;border-color:#e6e6df}
.np-page .np-r306-focus-controls button,
.np-page .np-r306-add-button,
.np-page .np-activity-switch-options-r304 button{transition:background .14s ease,border-color .14s ease}

/* Controlled neutral dark theme, without introducing new bright blocks. */
.np-page[data-appearance=dark]{
  --r306-action-ink:#e7f2ed;
  --r306-action-line:#435657;
}
.np-page[data-appearance=dark] .np-activity-switch-r304{background:transparent;border-color:#435657}
.np-page[data-appearance=dark] .np-r306-activity-label{color:#b3d2c6}
.np-page[data-appearance=dark] .np-r306-add-button{background:#3c796d;border-color:#71a99d;color:#fff}
.np-page[data-appearance=dark] .np-r306-focus-controls{background:#263b38;border-color:#47615b}
.np-page[data-appearance=dark] .np-r306-focus-controls button{color:#c2ddd0}
.np-page[data-appearance=dark] .np-r306-focus-controls button[aria-pressed=true]{background:#4a8d7a;color:#fff;border-color:#4a8d7a}
.np-page[data-appearance=dark] .np-activity-switch-options-r304 button{background:transparent;color:#c4d5d1;border-color:#445857}
.np-page[data-appearance=dark] .np-activity-switch-options-r304 button[aria-pressed=true]{background:#315447;color:#e6f6ee;border-color:#4d806b}
.np-page[data-appearance=dark] :is(.np-tasks-card,.np-habit-category,.np-unified-group-r304){background:#202d36;border-color:#465a5a}
.np-page[data-appearance=dark] :is(.np-tasks-card,.np-habit-category,.np-unified-group-r304)>.np-category-head{background:#263a39;border-color:#425657}
.np-page[data-appearance=dark] .np-execution-stack .np-item{background:#23343c;border-color:#435857}
.np-page[data-appearance=dark] .np-execution-stack .np-item:hover{background:#2a4540;border-color:#679a87}
.np-page[data-appearance=dark] .np-day-achievement{background:#22353a;border-color:#3b5d59}
.np-page[data-appearance=dark] .np-yesterday{background:#27393a;border-color:#425958}

@media(max-width:700px){
  .np-page .np-topbar[data-testid="platform-topbar"]{min-height:116px;margin-bottom:9px;border-radius:18px;box-shadow:none}
  .np-page .np-logo-frame{width:64px;height:64px}
  .np-page .np-activity-switch-r304{margin:16px 0 10px;gap:9px;padding-bottom:11px}
  .np-page .np-r306-workspace-title>strong{font-size:22px}
  .np-page .np-r306-add-button{min-height:44px;padding:8px 12px}
  .np-page .np-r306-tool-row{gap:8px}
  .np-page .np-r306-focus-controls{width:100%;justify-content:space-between}
  .np-page .np-r306-focus-controls button{flex:1 1 0;min-height:44px}
  .np-page .np-activity-switch-options-r304{width:100%;flex-basis:100%;padding-bottom:5px}
  .np-page .np-activity-switch-options-r304 button{min-height:44px;min-width:max-content}
  .np-page .np-category-grid{grid-template-columns:minmax(0,1fr)}
  .np-page .np-day-achievement{grid-template-columns:55px minmax(0,1fr) auto;padding:11px;gap:10px;border-radius:17px}
  .np-page .np-day-ring{width:55px;height:55px}
  .np-page .np-day-ring strong{font-size:15px}
  .np-page .np-day-achievement-copy h2{font-size:16px}
  .np-page .np-day-achievement-copy p{font-size:10px}
  .np-page .np-execution-stack{gap:12px}
  .np-page .np-tasks-card>.np-category-head,
  .np-page .np-habit-category>.np-category-head{padding:12px}
}
@media(max-width:390px){
  .np-page .np-day-achievement{grid-template-columns:55px minmax(0,1fr)}
  .np-page button.np-day-remaining{grid-column:1/-1;display:flex;flex-direction:row;justify-content:center;align-items:center;padding:8px;min-height:0;gap:5px}
}
@media(prefers-reduced-motion:reduce){
 .np-page .np-r306-focus-controls button,
 .np-page .np-r306-add-button,
 .np-page .np-activity-switch-options-r304 button{transition:none}
}
/* NOOR_R306_ACTION_FIRST_END */
`;
