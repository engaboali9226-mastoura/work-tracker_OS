// NOOR read-only public deployment smoke: no authentication, private APIs or user data.
// Works with Render, a local loopback host, or an independently hosted NOOR installation.
import {pathToFileURL} from 'node:url';
import path from 'node:path';

export function validateSmokeOrigin(value) {
  if(typeof value!=='string' || !value.trim()) throw Error('NOOR_SMOKE_ORIGIN_REQUIRED');
  let url;
  try { url=new URL(value); } catch { throw Error('NOOR_SMOKE_ORIGIN_INVALID'); }
  if(url.username || url.password || url.pathname!=='/' || url.search || url.hash)
    throw Error('NOOR_SMOKE_ORIGIN_INVALID');
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  if(url.protocol!=='https:' && !(local && url.protocol==='http:'))
    throw Error('NOOR_SMOKE_HTTPS_REQUIRED');
  return url.origin;
}

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function requestPublic(fetchImpl, origin, pathname, requestTimeoutMs) {
  const response=await fetchImpl(origin+pathname,{
    method:'GET',
    headers:{'Accept':pathname.endsWith('.js')?'text/javascript':'text/html','Cache-Control':'no-store'},
    credentials:'omit',
    redirect:'manual',
    signal:AbortSignal.timeout(requestTimeoutMs),
  });
  return {status:response.status,contentType:response.headers.get('content-type')??'',body:await response.text()};
}

export async function smokePublicNoor(originInput,options={}) {
  const origin=validateSmokeOrigin(originInput);
  const fetchImpl=options.fetchImpl??fetch;
  const requestTimeoutMs=options.requestTimeoutMs??12000;
  const maxAttempts=options.maxAttempts??12;
  const retryDelayMs=options.retryDelayMs??7000;
  const sleep=options.sleep??pause;
  const marker=options.workerMarker??'NOOR R222 installability worker';
  if(!Number.isSafeInteger(maxAttempts)||maxAttempts<1||maxAttempts>50)throw Error('NOOR_SMOKE_ATTEMPTS_INVALID');
  let lastError='unknown';
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      const health=await requestPublic(fetchImpl,origin,'/healthz',requestTimeoutMs);
      // Render's transient HTML waking page is not a valid response from NOOR.
      if(health.status===200 && health.body.trim()==='ok'){
        const checks=[['/','text/html'],['/personal','text/html'],['/work','text/html'],['/noor-service-worker.js','javascript']];
        const results=[{path:'/healthz',status:200}];
        for(const [pathname,contentType] of checks){
          const response=await requestPublic(fetchImpl,origin,pathname,requestTimeoutMs);
          if(response.status!==200)throw Error('NOOR_SMOKE_HTTP_'+pathname+':'+response.status);
          if(!response.contentType.toLowerCase().includes(contentType))throw Error('NOOR_SMOKE_TYPE_'+pathname);
          if(contentType==='text/html' && !/<!doctype html|<html/i.test(response.body))
            throw Error('NOOR_SMOKE_HTML_'+pathname);
          if(pathname==='/noor-service-worker.js' && !response.body.includes(marker))
            throw Error('NOOR_SMOKE_WORKER_VERSION_MISMATCH');
          results.push({path:pathname,status:response.status});
        }
        return {origin,attempts:attempt,checks:results};
      }
      lastError='NOOR_SMOKE_NOT_READY_HTTP_'+health.status;
    } catch(error) {
      lastError=error instanceof Error?error.message:String(error);
    }
    if(attempt<maxAttempts)await sleep(retryDelayMs);
  }
  throw Error('NOOR_SMOKE_FAILED: '+lastError);
}

const invoked=process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href;
if(invoked){
  const origin=process.argv[2]??process.env.NOOR_SMOKE_BASE_URL;
  try{
    const result=await smokePublicNoor(origin,{workerMarker:process.env.NOOR_SMOKE_WORKER_MARKER||undefined});
    console.log('NOOR_PUBLIC_SMOKE_PASS '+JSON.stringify(result));
  }catch(error){
    console.error('NOOR_PUBLIC_SMOKE_FAIL '+(error instanceof Error?error.message:String(error)));
    process.exitCode=1;
  }
}
