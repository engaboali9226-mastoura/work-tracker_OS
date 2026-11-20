import {test} from 'node:test';
import assert from 'node:assert/strict';
import {smokePublicNoor,validateSmokeOrigin} from './noor-public-release-smoke.mjs';

function mockResponse(path, options={}){
  const status=options.status??200;
  if(path==='/healthz')return new Response(options.body??'ok',{status,headers:{'Content-Type':'text/plain'}});
  if(path==='/noor-service-worker.js')return new Response(options.body??'/* NOOR R222 installability worker */',{status,headers:{'Content-Type':'text/javascript'}});
  return new Response(options.body??'<!doctype html><html lang="ar"></html>',{status,headers:{'Content-Type':'text/html; charset=utf-8'}});
}
test('public health and all app routes are served without credentials',async()=>{
  const seen=[];
  const fetchImpl=async(url,init)=>{
    const pathname=new URL(url).pathname;
    seen.push({pathname,init});
    return mockResponse(pathname);
  };
  const result=await smokePublicNoor('https://example.org',{fetchImpl,maxAttempts:1});
  assert.equal(result.attempts,1);
  assert.deepEqual(result.checks.map(x=>x.path),['/healthz','/','/personal','/work','/noor-service-worker.js']);
  assert.equal(seen.length,5);
  assert.ok(seen.every(x=>x.init.credentials==='omit'&&x.init.redirect==='manual'&&!('Authorization' in x.init.headers)));
  assert.ok(seen.every(x=>!x.pathname.startsWith('/api/')));
});
test('transient 429 / waking screen must not be accepted as ready',async()=>{
  let calls=0;
  const fetchImpl=async(url)=>{
    const pathname=new URL(url).pathname;
    if(pathname==='/healthz'&&calls++===0)
      return mockResponse('/healthz',{status:429,body:'Too Many Requests'});
    if(pathname==='/healthz'&&calls++===2)
      return mockResponse('/healthz',{body:'<html>Render waking up</html>'});
    return mockResponse(pathname);
  };
  const result=await smokePublicNoor('https://example.org',{fetchImpl,maxAttempts:4,retryDelayMs:0,sleep:async()=>{}});
  assert.equal(result.attempts,3);
});
test('invalid origins and unsafe plain HTTP targets are rejected',()=>{
  for(const value of ['http://example.org','https://person:secret@example.org','https://example.org/path','https://example.org/?q=1','ftp://example.org']){
    assert.throws(()=>validateSmokeOrigin(value));
  }
  assert.equal(validateSmokeOrigin('http://127.0.0.1:8788'),'http://127.0.0.1:8788');
});
test('non-200 app route fails closed',async()=>{
  const fetchImpl=async(url)=>{
    const path=new URL(url).pathname;
    return path==='/work'?mockResponse(path,{status:503,body:'unavailable'}):mockResponse(path);
  };
  await assert.rejects(smokePublicNoor('https://example.org',{fetchImpl,maxAttempts:1}),/NOOR_SMOKE_HTTP_\/work:503/);
});
test('unexpected service worker version fails closed',async()=>{
  const fetchImpl=async(url)=>{
    const path=new URL(url).pathname;
    return path==='/noor-service-worker.js'?mockResponse(path,{body:'/* other app */'}):mockResponse(path);
  };
  await assert.rejects(smokePublicNoor('https://example.org',{fetchImpl,maxAttempts:1}),/NOOR_SMOKE_WORKER_VERSION_MISMATCH/);
});
