// G0 local managed Auth smoke; no production credentials or data.
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes, createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import https from 'node:https';
import { createClient } from '@supabase/supabase-js';

const project = 'noor-r386-synthetic-runtime';
const origin = 'http://127.0.0.1:54321';
let stage = 'LOCAL_STACK_GUARD';
const guard = (value) => { if (!value) throw new Error('R386_REJECTED'); };
const pass = (name) => console.log(name + ': PASS');
const localFetch = (input, init) => {
  const target = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  guard(target.origin === origin && !target.username && !target.password);
  return fetch(input, {...init, redirect:'error', signal:AbortSignal.timeout(15000)});
};
const options = { auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{fetch:localFetch} };
const proveHttpsIssuer = process.argv.includes('--https-issuer');
const httpsIssuer = 'https://127.0.0.1:54443/auth/v1';
const jwksPath = '/auth/v1/.well-known/jwks.json';
let jwks, tlsServer;
let admin;
const ids = [], clients = [];
try {
  guard(process.platform === 'darwin' && !process.env.DOCKER_HOST && !process.env.DOCKER_CONTEXT);
  guard(execFileSync('docker',['context','inspect','--format','{{.Endpoints.docker.Host}}'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().startsWith('unix://'));
  const ports=execFileSync('docker',['port','supabase_kong_'+project,'8000/tcp'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n');
  guard(ports.includes('127.0.0.1:54321') && ports.every(p=>['127.0.0.1:54321','[::1]:54321'].includes(p)));
  const listeners=execFileSync('lsof',['-nP','-iTCP:54321','-sTCP:LISTEN','-Fn'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\n').filter(x=>x.startsWith('n'));
  guard(listeners.length && listeners.every(x=>['n127.0.0.1:54321','n[::1]:54321'].includes(x)));
  if (proveHttpsIssuer) {
    stage='HTTPS_JWKS_SETUP';
    const response=await localFetch(origin+jwksPath);
    guard(response.status===200);
    const source=await response.json();
    guard(Array.isArray(source.keys) && source.keys.some(k=>k.kty==='EC' && k.alg==='ES256'));
    const certDir=join(homedir(),project,'tls-r386');
    const ca=readFileSync(join(certDir,'ca.crt'));
    tlsServer=https.createServer({
      cert:readFileSync(join(certDir,'server.crt')),
      key:readFileSync(join(certDir,'server.key')),
      minVersion:'TLSv1.2'
    },(req,res)=>{
      if(req.method!=='GET'||req.url!==jwksPath){res.writeHead(404);res.end();return;}
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify(source));
    });
    await new Promise((resolve,reject)=>{
      tlsServer.once('error',reject);
      tlsServer.listen(54443,'127.0.0.1',resolve);
    });
    guard(tlsServer.address().address==='127.0.0.1');
    jwks=await new Promise((resolve,reject)=>{
      const req=https.get(httpsIssuer+'/.well-known/jwks.json',{
        ca,rejectUnauthorized:true,minVersion:'TLSv1.2'
      },res=>{
        if(res.statusCode!==200){res.destroy();reject(new Error('R386_JWKS_HTTP'));return;}
        let body='';
        res.setEncoding('utf8');
        res.on('data',chunk=>{body+=chunk;if(body.length>65536)res.destroy(new Error('R386_JWKS_SIZE'));});
        res.on('error',reject);
        res.on('end',()=>{try{resolve(JSON.parse(body));}catch(e){reject(e);}});
      });
      req.setTimeout(5000,()=>req.destroy(new Error('R386_JWKS_TIMEOUT')));
      req.on('error',reject);
    });
    guard(JSON.stringify(jwks)===JSON.stringify(source));
    pass(stage);
  }
  const status=JSON.parse(execFileSync('supabase',['status','-o','json'],{
    cwd:join(homedir(),project),env:{HOME:homedir(),PATH:process.env.PATH},encoding:'utf8',
    stdio:['ignore','pipe','ignore'],timeout:20000}));
  guard(status.API_URL===origin || status.API_URL===origin+'/');
  const anon=status.ANON_KEY || status.PUBLISHABLE_KEY, service=status.SERVICE_ROLE_KEY || status.SECRET_KEY;
  guard(typeof anon==='string' && typeof service==='string' && anon!==service);
  admin=createClient(origin,service,options);
  stage='EMPTY_SYNTHETIC_AUTH';
  const baseline=await admin.auth.admin.listUsers({page:1,perPage:1});
  guard(!baseline.error && baseline.data.users.length===0);
  pass(stage);
  const suffix=randomBytes(8).toString('hex');
  for (let i=0;i<2;i++) {
    stage='CREATE_SYNTHETIC_USER_'+(i+1);
    const email='r386-'+suffix+'-'+i+'@example.invalid';
    const password=randomBytes(24).toString('hex')+'Aa1!';
    const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
    if (created.data?.user?.id) ids.push(created.data.user.id);
    guard(!created.error && created.data.user?.id);
    const client=createClient(origin,anon,options);
    clients.push(client);
    stage='WRONG_PASSWORD_REJECTED_'+(i+1);
    const bad=await client.auth.signInWithPassword({email,password:password+'wrong'});
    guard(bad.error && !bad.data.session && [400,401,403].includes(bad.error.status));
    pass(stage);
    stage='LOGIN_'+(i+1);
    const login=await client.auth.signInWithPassword({email,password});
    guard(!login.error && login.data.session?.access_token && login.data.user?.id===ids[i]);
    pass(stage);
    if(proveHttpsIssuer){
      stage='SIGNED_HTTPS_ISSUER_'+(i+1);
      const parts=login.data.session.access_token.split('.');
      guard(parts.length===3 && parts.every(p=>/^[A-Za-z0-9_-]+$/.test(p)));
      const header=JSON.parse(Buffer.from(parts[0],'base64url'));
      const claims=JSON.parse(Buffer.from(parts[1],'base64url'));
      guard(header.alg==='ES256' && typeof header.kid==='string');
      const matches=jwks.keys.filter(k=>k.kid===header.kid && k.alg==='ES256' && k.kty==='EC' && k.crv==='P-256');
      guard(matches.length===1);
      const signature=Buffer.from(parts[2],'base64url');
      guard(signature.length===64);
      const publicKey=createPublicKey({key:matches[0],format:'jwk'});
      guard(verify('sha256',Buffer.from(parts[0]+'.'+parts[1]),{key:publicKey,dsaEncoding:'ieee-p1363'},signature));
      guard(claims.iss===httpsIssuer && claims.sub===ids[i] &&
        claims.aud==='authenticated' && claims.role==='authenticated' &&
        claims.is_anonymous===false && typeof claims.session_id==='string' &&
        claims.session_id.length>0 && Number.isInteger(claims.exp) &&
        claims.exp>Math.floor(Date.now()/1000));
      pass(stage);
    }
    stage='VERIFIED_USER_'+(i+1);
    const verified=await client.auth.getUser();
    guard(!verified.error && verified.data.user?.id===ids[i]);
    const token=login.data.session.access_token;
    const segments=token.split('.');
    guard(segments.length===3 && segments[2].length>0);
    segments[2]=(segments[2][0]==='A'?'B':'A')+segments[2].slice(1);
    const forged=await client.auth.getUser(segments.join('.'));
    guard(forged.error && !forged.data.user && [400,401,403].includes(forged.error.status));
    pass(stage);
    stage='REFRESH_SESSION_'+(i+1);
    const refreshed=await client.auth.refreshSession();
    guard(!refreshed.error && refreshed.data.session?.access_token && refreshed.data.user?.id===ids[i]);
    pass(stage);
  }
  stage='DISTINCT_AUTH_IDENTITIES';
  guard(ids.length===2 && ids[0]!==ids[1]);
  const verified=await Promise.all(clients.map(c=>c.auth.getUser()));
  guard(verified.every((v,i)=>!v.error && v.data.user?.id===ids[i]));
  pass(stage);
  for (const [i,client] of clients.entries()) {
    stage='SIGNOUT_'+(i+1);
    const session=await client.auth.getSession();
    const refreshToken=session.data.session?.refresh_token;
    guard(refreshToken);
    const out=await client.auth.signOut({scope:'global'});
    guard(!out.error);
    const attempt=await client.auth.refreshSession({refresh_token:refreshToken});
    guard(attempt.error && !attempt.data.session && [400,401,403].includes(attempt.error.status));
    pass(stage);
  }
} catch {
  console.error('R386_MANAGED_AUTH_BLOCKED: '+stage);
  process.exitCode=1;
} finally {
  if (admin && ids.length) {
    try {
      for (const id of ids) guard(!(await admin.auth.admin.deleteUser(id)).error);
      const remaining=await admin.auth.admin.listUsers({page:1,perPage:1});
      guard(!remaining.error && remaining.data.users.length===0);
      pass('SYNTHETIC_USER_CLEANUP');
    } catch {
      console.error('R386_MANAGED_AUTH_CLEANUP_BLOCKED');
      process.exitCode=1;
    }
  }
  if(tlsServer?.listening) await new Promise(resolve=>tlsServer.close(resolve));
}
if (!process.exitCode) {
  console.log('R386_MANAGED_AUTH_SMOKE_PASS');
  if(proveHttpsIssuer) console.log('R386_SIGNED_HTTPS_ISSUER_PASS');
}
