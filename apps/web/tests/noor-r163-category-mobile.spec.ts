import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { DefinitionForm } from "../src/noor-personal-application-view.js";
import { noorCategoryOptions, noorExistingCategory, noorProposeCategory } from "../src/category-selection-r163.js";

const source=readFileSync(new URL("../src/noor-personal-application-view.tsx",import.meta.url),"utf8");
const styles=source.split("/* NOOR_R163_MOBILE_DIALOGS_AND_TABS:")[1]?.split("/* NOOR_R163_MOBILE_DIALOGS_AND_TABS_END */")[0]??"";

test("R163 choices: existing categories are the only accepted selections",()=>{
  const categories=noorCategoryOptions(["العبادات","التعلم","العبادات"]);
  assert.deepEqual(categories,["العبادات","التعلم"]);
  assert.equal(noorExistingCategory("العبادات",categories),true);
  assert.equal(noorExistingCategory("تصنيف من خارج القائمة",categories),false);
  assert.equal(noorExistingCategory("",categories),false);
  assert.deepEqual(noorCategoryOptions([],"تصنيف قديم محفوظ"),["تصنيف قديم محفوظ"]);
});
test("R163 category proposal: trim, duplicate, case, invalid, and Unicode handling",()=>{
  const categories=["العبادات","Learning"];
  assert.deepEqual(noorProposeCategory("  تطوير   الذات  ",categories),{kind:"new",value:"تطوير الذات"});
  assert.deepEqual(noorProposeCategory(" Learning ",categories),{kind:"existing",value:"Learning"});
  assert.deepEqual(noorProposeCategory("learning",categories),{kind:"existing",value:"Learning"});
  assert.deepEqual(noorProposeCategory("العبادات",categories),{kind:"existing",value:"العبادات"});
  assert.equal(noorProposeCategory("",categories).kind,"invalid");
  assert.equal(noorProposeCategory(" ",categories).kind,"invalid");
  assert.equal(noorProposeCategory("A".repeat(61),categories).kind,"invalid");
  assert.equal(noorProposeCategory("bad\nname",categories).kind,"invalid");
});
test("R163 safety: no free-text datalist; select and command guards exist",()=>{
  assert.match(source,/<select className="np-select" id="definition-category" name="category" required disabled=\{busy\} value=\{selectedCategory\}/);
  assert.doesNotMatch(source,/id="definition-category"[^>]*<input/);
  assert.doesNotMatch(source,/list="np-categories"/);
  assert.match(source,/noorExistingCategory\(selectedCategory,categoryChoices\)/);
  assert.match(source,/type:"manage-category",action:"add",name:proposal.value,previousName:null/);
  assert.match(source,/categoryAddLock\.current/);
  assert.match(source,/if\(ok\)\{setRegisteredCategory\(proposal.value\);setSelectedCategory\(proposal.value\)/);
  assert.match(source,/setCategoryError\("تعذر إضافة التصنيف/);
  assert.match(source,/disabled=\{busy\|\|definitionSaving\}/);
});
test("R163 responsive: modal families, safe-area, short heights, scrollable navigation",()=>{
  assert.ok(styles.length>1000);
  for (const name of [".np-cc-modal-backdrop", ".nf-backdrop", ".np-activity-backdrop", ".np-delete-backdrop", ".np-history-overlay"]){
    assert.ok(styles.includes(name),`missing responsive scope for ${name}`);
  }
  for (const target of ["@media (max-width:700px)","@media (max-width:390px)","@media (max-height:480px)","env(safe-area-inset-bottom", "overflow-x:auto","-webkit-overflow-scrolling:touch",".np-cc-nav-item{flex:0 0 auto",".np-cc-modal-footer",".np-cc-modal-body"]){
    assert.ok(styles.includes(target),`missing responsive rule: ${target}`);
  }
  assert.match(source,/event\.currentTarget\.scrollIntoView\?\./);
  assert.match(source,/window\.visualViewport\?\.addEventListener\("resize",update\)/);
  assert.match(source,/window\.visualViewport\?\.addEventListener\("scroll",update\)/);
});

function mount(initial?:Record<string,unknown>,categories=["العبادات","التعلم"]){
  const dom=new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body><div id="root"></div></body></html>',{url:"http://noor-lab.test"});
  Object.defineProperties(dom.window.HTMLElement.prototype,{
    attachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.addEventListener(event.replace(/^on/,""),listener);}},
    detachEvent:{value:function(this:HTMLElement,event:string,listener:EventListener){this.removeEventListener(event.replace(/^on/,""),listener);}},
  });
  const vars={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,Node:dom.window.Node,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,MutationObserver:dom.window.MutationObserver,FormData:dom.window.FormData,IS_REACT_ACT_ENVIRONMENT:true};
  const old=new Map<string,PropertyDescriptor|undefined>();
  for(const [k,v] of Object.entries(vars)){old.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});}
  const target=dom.window.document.getElementById("root")!;
  const root=createRoot(target);
  const commands:unknown[]=[];
  const props={busy:false,onCommand:async (command:unknown)=>{commands.push(command);return true;},defaultStartDate:"2026-11-03",categories,initial};
  return {dom,root,commands,target,props,async teardown(){await act(async()=>root.unmount());for(const [k,d] of old){if(d)Object.defineProperty(globalThis,k,d);else Reflect.deleteProperty(globalThis,k);}dom.window.close();}};
}
const changeSelect=async(t:ReturnType<typeof mount>,selector:string,value:string)=>{
  const el=t.dom.window.document.querySelector(selector) as HTMLSelectElement;
  assert.ok(el,`missing ${selector}`);
  await act(async()=>{el.value=value;el.dispatchEvent(new t.dom.window.Event("change",{bubbles:true}));});
};
const changeInput=async(t:ReturnType<typeof mount>,selector:string,value:string)=>{
  const el=t.dom.window.document.querySelector(selector) as HTMLInputElement;
  assert.ok(el,`missing ${selector}`);
  await act(async()=>{
    Object.getOwnPropertyDescriptor(t.dom.window.HTMLInputElement.prototype,"value")!.set!.call(el,value);
    el.dispatchEvent(new t.dom.window.Event("input",{bubbles:true}));
    el.dispatchEvent(new t.dom.window.Event("change",{bubbles:true}));
  });
};
const clickText=async(t:ReturnType<typeof mount>,text:string)=>{
  const button=[...t.dom.window.document.querySelectorAll("button")].find(el=>el.textContent?.includes(text));
  assert.ok(button,`button not found: ${text}`);
  await act(async()=>{button.click();});
};

test("R163 mounted form: only registered categories appear; default is an option",async()=>{
  const t=mount();try{
    await act(async()=>t.root.render(createElement(DefinitionForm,t.props as any)));
    const select=t.target.querySelector<HTMLSelectElement>("#definition-category");assert.ok(select);
    assert.equal(select.tagName,"SELECT");assert.equal(select.value,"العبادات");
    assert.deepEqual([...select.options].filter(x=>!x.disabled).map(x=>x.value),["العبادات","التعلم"]);
    assert.equal(t.target.querySelector("#np-categories"),null);
    await changeSelect(t,"#definition-category","التعلم");assert.equal(select.value,"التعلم");
  }finally{await t.teardown();}
});
test("R163 editing a saved habit keeps its current registered category",async()=>{
  const initial={id:"h1",revisionId:"rev1",kind:"Habit",title:"قراءة",category:"التعلم",weight:3,importance:"Supporting",state:"Active",scheduleKind:"Daily",weekdays:[],startDate:"2026-11-01",endDate:null};
  const t=mount(initial);try{
    await act(async()=>t.root.render(createElement(DefinitionForm,t.props as any)));
    assert.equal(t.target.querySelector<HTMLSelectElement>("#definition-category")?.value,"التعلم");
    assert.equal(t.target.querySelector<HTMLInputElement>("#definition-title")?.value,"قراءة");
    await act(async()=>{t.target.querySelector<HTMLFormElement>("#np-definition-edit-form")!.dispatchEvent(new t.dom.window.Event("submit",{bubbles:true,cancelable:true}));});
    assert.equal(t.commands.length,1);
    assert.equal((t.commands[0] as any).type,"update-definition");
    assert.equal((t.commands[0] as any).category,"التعلم");
  }finally{await t.teardown();}
});
test("R163 add-category UI creates a category before allowing it as a definition selection",async()=>{
  const t=mount();try{
    await act(async()=>t.root.render(createElement(DefinitionForm,t.props as any)));
    await clickText(t,"التصنيف غير موجود؟");
    assert.ok(t.target.querySelector<HTMLInputElement>("#definition-new-category"));
    await changeInput(t,"#definition-new-category","النمو المهني");
    await clickText(t,"إضافة وتحديد التصنيف");
    assert.equal(t.commands.length,1);
    assert.deepEqual(t.commands[0],{type:"manage-category",action:"add",name:"النمو المهني",previousName:null});
    assert.equal(t.target.querySelector<HTMLSelectElement>("#definition-category")?.value,"النمو المهني");
    assert.equal(t.target.querySelector("#definition-new-category"),null);
  }finally{await t.teardown();}
});
test("R163 duplicate/invalid category suggestions do not create extra categories",async()=>{
  const t=mount();try{
    await act(async()=>t.root.render(createElement(DefinitionForm,t.props as any)));
    await clickText(t,"التصنيف غير موجود؟");
    await clickText(t,"إضافة وتحديد التصنيف");
    assert.equal(t.commands.length,0);
    assert.ok(t.target.querySelector('[role="alert"]'));
    await changeInput(t,"#definition-new-category","  العبادات  ");
    await clickText(t,"إضافة وتحديد التصنيف");
    assert.equal(t.commands.length,0);
    assert.equal(t.target.querySelector<HTMLSelectElement>("#definition-category")?.value,"العبادات");
  }finally{await t.teardown();}
});
test("R163 failed category registration preserves text and visibly reports failure",async()=>{
  const t=mount();t.props.onCommand=async (command:unknown)=>{t.commands.push(command);return false;};try{
    await act(async()=>t.root.render(createElement(DefinitionForm,t.props as any)));
    await clickText(t,"التصنيف غير موجود؟");
    await changeInput(t,"#definition-new-category","عناية منزلية");
    await clickText(t,"إضافة وتحديد التصنيف");
    assert.equal(t.commands.length,1);
    assert.equal(t.target.querySelector<HTMLInputElement>("#definition-new-category")?.value,"عناية منزلية");
    assert.match(t.target.textContent??"",/تعذر إضافة التصنيف/);
  }finally{await t.teardown();}
});
