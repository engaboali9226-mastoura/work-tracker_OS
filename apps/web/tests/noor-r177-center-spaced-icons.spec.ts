import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../src/noor-personal-application-view.tsx',import.meta.url),'utf8');
const component=readFileSync(new URL('../src/noor-three-spaces-r171.tsx',import.meta.url),'utf8');
const m=component.match(/\/\* NOOR_R177_CENTER_SPACED_ICONS_BEGIN \*\/([\s\S]*?)\/\* NOOR_R177_CENTER_SPACED_ICONS_END \*\//u);
test('R177 keeps all three icon-only shortcuts inside the existing achievement header',()=>{
 assert.ok(m,'new layout rules exist exactly once');
 assert.equal(component.split('NOOR_R177_CENTER_SPACED_ICONS_BEGIN').length-1,1);
 assert.equal(app.split('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />').length-1,1);
 const start=app.indexOf('className="np-day-achievement-copy"');
 const end=app.indexOf('className="np-day-remaining"',start);
 assert.ok(start>=0&&end>start&&app.slice(start,end).includes('<NoorThreeSpacesR171 personalDate={view.localDate??undefined} />'));
 assert.doesNotMatch(component,/className="nr171-label"/u);
});
test('R177 spreads desktop icons, centers in flexible available space and centers on phones',()=>{
 const css=m?.[1]??'';
 assert.match(css,/@media\(min-width:701px\)/u);
 assert.match(css,/\.np-day-achievement-text\{flex:0 1 auto/u);
 assert.match(css,/\.np-day-achievement-copy>\.nr171-shortcuts\{flex:1 1 0;min-width:0;justify-content:center;gap:clamp\(16px,2\.2vw,28px\)/u);
 assert.match(css,/@media\(max-width:700px\)/u);
 assert.match(css,/\.np-day-achievement-copy>\.nr171-shortcuts\{width:100%;justify-content:center;gap:clamp\(7px,2\.3vw,15px\)/u);
 assert.match(css,/@media\(max-width:390px\)/u);
 assert.doesNotMatch(css,/grid-column:1\/-1|border-top|position:fixed/u);
 assert.doesNotMatch(component,/\b(?:localStorage|sessionStorage|document\.cookie|sessionId|SUPABASE_SERVICE_ROLE_KEY)\b/u);
});
test('R177 preserves prior R176 inline styles and minimum 44px icon hit targets',()=>{
 const r176=component.match(/\/\* NOOR_R176_INLINE_ACHIEVEMENT_BEGIN \*\/([\s\S]*?)\/\* NOOR_R176_INLINE_ACHIEVEMENT_END \*\//u)?.[1]??'';
 assert.match(r176,/\.np-day-achievement-copy\{display:flex/u);
 assert.match(r176,/min-width:44px;min-height:44px/u);
 assert.match(r176,/@media\(max-width:700px\)/u);
 assert.match(component,/export function NoorThreeSpacesR171/u);
});
