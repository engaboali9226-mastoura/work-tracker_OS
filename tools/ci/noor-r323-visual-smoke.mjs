// Browser evidence for R323, using the actual React components and a disposable fixture.
import {readFile,writeFile,mkdir,rm,mkdtemp} from "node:fs/promises";
import {spawn} from "node:child_process";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import assert from "node:assert/strict";
const web=resolve("apps/web"),htmlFile=resolve(web,"__r323_visual_fixture.html"),scriptFile=resolve(web,"__r323_visual_fixture.tsx");
const output=resolve("r323-visual-evidence"),profile=await mkdtemp(resolve(tmpdir(),"noor-visual-"));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let vite,chrome,socket;
const wait=async(fn,ms=45000)=>{const end=Date.now()+ms;let last;while(Date.now()<end){try{const r=await fn();if(r)return r;}catch(e){last=e;}await sleep(200);}throw Error("Timed out: "+String(last??"condition not met"));};
try{
 await mkdir(output,{recursive:true});
 const original=await readFile(resolve(web,"index.html"),"utf8");
 const main=await readFile(resolve(web,"src/main.tsx"),"utf8");
 const styles=main.split("\n").filter(l=>/^import "\.\/[^"]+\.css";/.test(l.trim())).map(l=>l.replace('"./','"./src/')).join("\n");
 assert.match(styles,/noor-approved-r323\.css/);
 const tests=await readFile(resolve(web,"tests/noor-personal-application-view.spec.ts"),"utf8");
 const start=tests.indexOf("const futurePrayerAt=");
 const end=tests.indexOf('test("R287 regression',start);
 assert.ok(start>=0&&end>start);
 const fixture=tests.slice(start,end).replaceAll("2026-10-24","2026-11-06").replaceAll("2026-10-25","2026-11-06").replaceAll("2026-10-26","2026-11-07");
 assert.match(fixture,/const workspace=/);
 const html=original.replace(/<script\b[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/g,"").replace("</body>",'<script type="module" src="/__r323_visual_fixture.tsx"></script></body>');
 await writeFile(htmlFile,html);
 const setup=[
 'import React from "react";',
 'import {createRoot} from "react-dom/client";',
 'import {PlatformShell} from "./src/platform-shell";',
 'import {NoorPersonalApplicationView} from "./src/noor-personal-application-view";',
 'Date.now=()=>Date.parse("2026-11-06T18:02:00Z");',
 'window.fetch=async()=>new Response(JSON.stringify({current:{temperature_2m:22}}),{status:200,headers:{"Content-Type":"application/json"}});'
 ].join("\n");
 const render=[
 'const root=createRoot(document.getElementById("root")!);',
 'const isLogin=new URLSearchParams(location.search).get("screen")==="login";',
 'const accountService={requestPasswordReset:async()=>"sent" as const,registerPendingAccount:async()=>"sent" as const,completePasswordRecovery:async()=>"updated" as const,requestEmailChange:async()=>"sent" as const};',
 'const appointments=[{id:"visual-appointment-1",kind:"Task",title:"اجتماع فريق العمل",state:"Active",category:"العمل",schedule:{kind:"Daily"},effectiveFromDate:"2026-11-06",importance:"Important",countdownPlan:{kind:"appointment",date:"2026-11-07",time:"15:00"}},{id:"visual-appointment-2",kind:"Task",title:"موعد طبي",state:"Active",category:"الصحة",schedule:{kind:"Daily"},effectiveFromDate:"2026-11-06",importance:"Important",countdownPlan:{kind:"appointment",date:"2026-11-08",time:"10:00"}}];',
 'root.render(isLogin?<PlatformShell state={{kind:"no-application-selected"}} navigate={()=>{}} signIn={async()=>{}} authenticationState="idle" accountService={accountService}/>:<NoorPersonalApplicationView initialResult={today as any} initialWorkspace={{...workspace,workspace:{...workspace.workspace,definitions:[...workspace.workspace.definitions,...appointments]}} as any}/>);'
 ].join("\n");
 await writeFile(scriptFile,[styles,setup,fixture,render].join("\n"));
 vite=spawn("npm",["--workspace","apps/web","run","dev","--","--host","127.0.0.1","--port","5179","--strictPort"],{stdio:"inherit"});
 const url="http://127.0.0.1:5179/__r323_visual_fixture.html";
 await wait(async()=> (await fetch(url)).ok);
 chrome=spawn(process.env.CHROME_BIN||"google-chrome",["--headless","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run","--remote-debugging-port=9222","--user-data-dir="+profile,"about:blank"],{stdio:["ignore","ignore","ignore"]});
 const tab=await wait(async()=>{const r=await fetch("http://127.0.0.1:9222/json/list");const t=await r.json();return t.find(x=>x.type==="page");});
 socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.addEventListener("open",r,{once:true});socket.addEventListener("error",j,{once:true});});
 let id=0;const pending=new Map();
 socket.addEventListener("message",event=>{const m=JSON.parse(event.data);if(m.id&&pending.has(m.id)){const [r,j]=pending.get(m.id);pending.delete(m.id);m.error?j(Error(JSON.stringify(m.error))):r(m.result);}});
 const cdp=(method,params={})=>new Promise((r,j)=>{const n=++id;pending.set(n,[r,j]);socket.send(JSON.stringify({id:n,method,params}));});
 await cdp("Page.enable");
 const run=async(expression)=>{const r=await cdp("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const find=sel=>wait(()=>run("!!document.querySelector("+JSON.stringify(sel)+")"));
 const snap=async(name)=>{await sleep(250);const r=await cdp("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});await writeFile(resolve(output,name+".png"),Buffer.from(r.data,"base64"));};
 const expect=async(expression,message)=>{await wait(()=>run(expression),5000).catch(()=>{throw Error(message);});};
 const visible=sel=>"(!!document.querySelector("+JSON.stringify(sel)+")&&document.querySelector("+JSON.stringify(sel)+").getBoundingClientRect().height>0)";
 const report=[];
 for(const screen of [{name:"iphone-viewport",width:390,height:844,mobile:true},{name:"desktop-viewport",width:1440,height:900,mobile:false}]){
  await cdp("Emulation.setDeviceMetricsOverride",{width:screen.width,height:screen.height,deviceScaleFactor:1,mobile:screen.mobile});
  await cdp("Page.navigate",{url:url+"?screen=login"});
  await find(".noor-r323-auth-card");
  await expect("document.documentElement.scrollWidth<=innerWidth+1","Login horizontal overflow");
  await expect("!document.querySelector('.noor-auth-switch-r312')","Account tabs are absent");
  await expect("document.querySelector('.noor-welcome-eyebrow').textContent==='NOOR Platform'","Platform branding");
  await expect("document.querySelector('.noor-r322-admin-entry').getBoundingClientRect().bottom<=innerHeight","Login controls fit without scrolling");
  await snap(screen.name+"-login");
  await run("document.querySelector('.noor-r322-secondary-actions button').click()");
  await find("input[name=name]");
  await run("document.querySelector('.noor-auth-return-r312').click()");
  await run("document.querySelector('.noor-auth-forgot').click()");
  await wait(()=>run("!document.querySelector('input[name=password]')"));
  await snap(screen.name+"-recovery");
  if(screen.mobile){
   await cdp("Emulation.setDeviceMetricsOverride",{width:390,height:480,deviceScaleFactor:1,mobile:true});
   await run("document.querySelector('.noor-auth-return-r312').click()");
   await run("document.querySelector('input[name=email]').focus()");
   await expect("document.activeElement.getBoundingClientRect().bottom<=visualViewport.height&&visualViewport.scale===1","Focused field fits the reduced mobile viewport");
   await snap(screen.name+"-focused");
   await cdp("Emulation.setDeviceMetricsOverride",{width:screen.width,height:screen.height,deviceScaleFactor:1,mobile:true});
  }
  await cdp("Page.navigate",{url:url+"?screen=personal"});
  await find("[data-testid=r323-approved-dashboard]");
  await expect(visible(".np-r323-rhythm"),"Active timer visible");
  await expect(visible("[data-testid=prayer-card]"),"Existing prayer card retained");
  await expect(visible("[data-testid=today-summary]"),"Existing progress retained");
  await expect("document.documentElement.scrollWidth<=innerWidth+2","Dashboard horizontal overflow");
  await expect("document.querySelector('.np-r323-home-grid').querySelectorAll('.np-r323-rhythm').length===1","No duplicate timer");
  await expect("(()=>{const a=document.querySelector('.np-r323-friday'),b=document.querySelector('.np-upcoming-r303');return a&&b&&Math.abs(a.getBoundingClientRect().top-b.getBoundingClientRect().top)<3&&a.getBoundingClientRect().left>b.getBoundingClientRect().left})()","Friday and appointments must share the same row in reference order");
  await expect(visible(".np-r323-bottom-nav"),"Real bottom navigation exists");
  await expect("!document.querySelector(\'.np-r323-header [aria-label=\\\"فتح مركز التحكم\\\"]\')","No top control shortcut");
  await snap(screen.name+"-personal");
  await run("document.querySelector('[data-testid=r322-open-time-windows]').click()");
  await expect("(()=>{const r=document.querySelector('.np-r322-sheet')?.getBoundingClientRect();return r&&r.height>100&&r.top<innerHeight-100&&r.bottom<=innerHeight+3})()","Timer sheet must actually be inside the viewport");
  await snap(screen.name+"-timer-details");
  await run("document.querySelector('[aria-label=\"إغلاق مؤقتات اليوم\"]').click()");
  await expect("document.querySelector('.np-r322-modal').dataset.open==='false'","Timer sheet closes");
  const more=await run("!!document.querySelector('[data-testid=r322-open-appointments]')");
  if(more){await run("document.querySelector('[data-testid=r322-open-appointments]').click()");await expect("(()=>{const r=document.querySelector('.np-r322-appointments-sheet')?.getBoundingClientRect();return r&&r.height>50&&r.top<innerHeight-50&&r.bottom<=innerHeight+3})()","Appointment sheet must actually be visible in the viewport");await snap(screen.name+"-appointments");await run("document.querySelector('[aria-label=\"إغلاق المواعيد\"]').click()");}
  await run("document.querySelector('[data-testid=r324-nav-grid]').click()");
  await find(".np-cc-shell");
  await expect(visible("[data-testid=r324-persistent-navigation]"),"Navigation stays in control center");
  await snap(screen.name+"-tools");
  await run("document.querySelector('[data-testid=r324-nav-bell]').click()");
  await expect("document.querySelector('[data-testid=r324-nav-bell]').getAttribute('aria-current')==='page'","Reminders navigation active");
  await run("document.querySelector('[data-testid=r324-nav-home]').click()");
  await find("[data-testid=r323-approved-dashboard]");
  await expect("document.querySelector('[data-testid=r324-nav-home]').getAttribute('aria-current')==='page'","Home navigation active");
  await run("document.querySelector('[data-testid=r324-nav-plus]').click()");
  await find(".np-r324-quick-sheet");
  await expect("document.querySelectorAll('.np-r324-quick-sheet > button').length===3","Quick add exposes task habit and appointment");
  await snap(screen.name+"-quick-add");
  await run("document.querySelector('.np-r324-quick-sheet > button').click()");
  await find("#definition-title");
  await expect("document.querySelector('[data-testid=r324-nav-plus]').getAttribute('aria-current')==='page'","Quick task navigation active");
  await snap(screen.name+"-quick-task");
  report.push({viewport:screen.name,width:screen.width,height:screen.height,appointmentFixtureVisible:more,layout:await run("Array.from(document.querySelectorAll('.np-r323-home-grid>.np-card')).filter(x=>x.getBoundingClientRect().height>0).map(x=>({className:x.className,width:Math.round(x.getBoundingClientRect().width),height:Math.round(x.getBoundingClientRect().height),top:Math.round(x.getBoundingClientRect().top)}))")});
 }
 await writeFile(resolve(output,"report.json"),JSON.stringify(report,null,2));
 console.log("R323_BROWSER_SMOKE_PASS "+JSON.stringify(report));
}finally{
 socket?.close();chrome?.kill();vite?.kill();await rm(htmlFile,{force:true});await rm(scriptFile,{force:true});await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
