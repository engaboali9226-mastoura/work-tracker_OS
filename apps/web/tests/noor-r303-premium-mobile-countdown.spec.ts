import test from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {UpcomingCountdownR301} from "../src/noor-upcoming-countdown-r301.js";

const at=(local:string)=>Date.parse(local);
const appointment=(id:string,date:string,time:string,kind:"task"|"event"|"appointment"="appointment")=>
 ({id,title:id==="first"?"اختبار نهاية الفصل":id==="second"?"تسليم مشروع البحث":id==="third"?"موعد الطبيب":id,state:"Active",countdownPlan:{kind,date,time}});
const markup=(definitions:ReturnType<typeof appointment>[],nowMs:number)=>
 renderToStaticMarkup(createElement(UpcomingCountdownR301,{definitions,nowMs,timeZone:"Asia/Riyadh",onAdd:()=>{}}));
test("R303: empty state stays mobile compact and clear, without giant illustration, with one primary add action",()=>{
 const html=markup([],at("2026-11-12T08:00:00Z"));
 assert.match(html,/data-layout="compact-mobile-r303"/);
 assert.match(html,/data-countdown-empty="true"/);
 assert.match(html,/np-upcoming-empty-r303/);
 assert.match(html,/لا توجد مواعيد مرتقبة بعد/);
 assert.match(html,/إضافة موعد مرتقب/);
 assert.match(html,/data-testid="r302-add-first-countdown"/);
 assert.doesNotMatch(html,/np-upcoming-feature-r303/);
});
test("R303: main upcoming event is featured with a compact single DAYS counter, two subsequent slim rows",()=>{
 const html=markup([
  appointment("third","2026-11-23","09:00"),
  appointment("second","2026-11-19","09:00","task"),
  appointment("first","2026-11-16","10:00","event")
 ],at("2026-11-12T09:00:00Z"));
 assert.match(html,/np-upcoming-feature-days-r303/);
 assert.match(html,/np-upcoming-counter-days-r303/);
 assert.match(html,/4<\/strong><small>أيام/);
 assert.match(html,/اختبار نهاية الفصل/);
 assert.match(html,/تسليم مشروع البحث/);
 assert.match(html,/موعد الطبيب/);
 assert.equal((html.match(/np-upcoming-following-item-r303/g)??[]).length,2);
 assert.doesNotMatch(html,/np-upcoming-clock-r303/,"hours only appear on the civil target day");
});
test("R303: on the exact appointment day the timer uses three compact hour/minute/second counters",()=>{
 const html=markup([appointment("third","2026-11-12","15:20")],at("2026-11-12T10:00:00Z"));
 assert.match(html,/np-upcoming-feature-today-r303/);
 assert.match(html,/data-countdown-phase="today"/);
 assert.match(html,/aria-label="تنبيه: الموعد اليوم"/);
 assert.match(html,/np-upcoming-clock-r303/);
 assert.match(html,/<strong>02<\/strong><small>ساعة/);
 assert.match(html,/<strong>20<\/strong><small>دقيقة/);
 assert.match(html,/<strong>00<\/strong><small>ثانية/);
});
test("R303: long appointment lists avoid oversized cards, with overflow behind optional details",()=>{
 const html=markup(Array.from({length:5},(_,i)=>appointment("item"+i,"2026-11-"+String(16+i).padStart(2,"0"),"09:00")),
  at("2026-11-12T08:00:00Z"));
 assert.equal((html.match(/np-upcoming-following-item-r303/g)??[]).length,2);
 assert.match(html,/np-upcoming-more-r303/);
 assert.match(html,/عرض 2 مواعيد أخرى/);
 assert.equal((html.match(/data-testid="r301-countdown-/g)??[]).length,5);
});
test("R303: mobile style has explicit compact dimensions and never forces giant card heights",()=>{
 const css=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
 const at=css.indexOf("/* R303 compact premium upcoming card");
 const end=css.indexOf("/* R299: approved compact",at);
 assert.ok(at>=0&&end>at);
 const part=css.slice(at,end);
 for(const token of [
  ".np-upcoming-r301.np-upcoming-r303","padding:11px 12px","border-radius:17px",
  ".np-upcoming-empty-r302.np-upcoming-empty-r303",
  ".np-upcoming-feature-r303",".np-upcoming-following-item-r303",
  "@media(max-width:600px)","@media(max-width:355px)"
 ])assert.ok(part.includes(token),token);
 assert.doesNotMatch(part,/min-height:\s*(?:1[5-9]\d|[2-9]\d\d)px/,"oversized min-heights defeat compact mode");
 assert.doesNotMatch(part,/height:\s*(?:1[5-9]\d|[2-9]\d\d)px/,"giant fixed illustration heights defeat mobile");
});
