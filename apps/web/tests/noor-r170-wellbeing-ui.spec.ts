import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { NoorWellbeingLabR165 } from '../src/noor-wellbeing-lab-r165.js';

test('R170 wellbeing modal opens, exposes three tabs and closes on Escape', async () => {
 const dom = new JSDOM('<!doctype html><html lang="ar"><body><div id="root"></div></body></html>', {url:'http://127.0.0.1:5188/'});
 const previous = new Map<string, PropertyDescriptor | undefined>();
 for (const [name, value] of Object.entries({
  window: dom.window, document: dom.window.document,
  navigator: dom.window.navigator, Node: dom.window.Node,
  Element: dom.window.Element, HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
 })) {
  previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { configurable:true, writable:true, value });
 }
 const root = createRoot(dom.window.document.getElementById('root')!);
 try {
  await act(async()=>root.render(createElement(NoorWellbeingLabR165)));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
  await act(async()=> (dom.window.document.querySelector('[data-testid="noor-wellbeing-launch-r165"]') as HTMLButtonElement).click());
  assert.ok(dom.window.document.querySelector('[role="dialog"][aria-modal="true"]'));
  assert.equal(dom.window.document.querySelectorAll('.nw165-tabs [role="tab"]').length, 3);
  assert.match(dom.window.document.body.textContent??'', /تجربة محلية بذاكرة مؤقتة/);
  await act(async()=> (dom.window.document.querySelector('.nw165-tabs [role="tab"]:nth-child(2)') as HTMLButtonElement).click());
  assert.match(dom.window.document.body.textContent??'', /إدخال يدوي للاختبار/);
  await act(async()=> (dom.window.document.querySelector('[role="dialog"]') as HTMLElement)
    .dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
 } finally {
  await act(async()=>root.unmount());
  for (const [name, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis,name);
  }
  dom.window.close();
 }
});
