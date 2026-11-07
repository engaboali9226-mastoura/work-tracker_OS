import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {once} from "node:events";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {NoorAdminDatabaseR271} from "../src/noor-admin-store-r271.js";
import {createNoorAdminSecureCompositionR271} from "../src/noor-admin-secure-composition-r271.js";
import {handleNoorAdminPasswordRecoveryR271,NOOR_ADMIN_PASSWORD_RECOVERY_PATH_R271} from "../src/noor-admin-password-recovery-http-r271.js";
import {handleNoorAdminStepUpR271,NOOR_ADMIN_STEP_UP_PATH_R271} from "../src/noor-admin-step-up-http-r271.js";

const user="11111111-1111-4111-8111-111111111111";
const authSession="22222222-2222-4222-8222-222222222222";
const factor="33333333-3333-4333-8333-333333333333";
const target="44444444-4444-4444-8444-444444444444";
const now=1794060000000;

test("R271 private Auth RPC + fresh MFA proof enables exactly one audited recovery",async()=>{
  const events:string[]=[];
  const client={
    from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:async()=>({
      data:{auth_user_id:user,role:"super_admin",enabled:true},error:null,
    })})})})}),
    rpc:async()=>({data:true,error:null}),
    auth:{
      getUser:async()=>({data:{user:{id:user}},error:null}),
      getClaims:async()=>({data:{claims:{
        sub:user,aal:"aal2",session_id:authSession,
        iat:Math.floor(now/1000)-20,exp:Math.floor(now/1000)+120,
      }},error:null}),
    },
  } as unknown as SupabaseClient<NoorAdminDatabaseR271>;
  const composition=createNoorAdminSecureCompositionR271({
    client,session:{execute:async()=>({accountId:{toString:()=>"actor-one"}})},
    now:()=>now,useServiceRoleSessionRpc:true,
    totpProvider:{verify:async()=>{events.push("verified-fresh-totp");return "server-verified-jwt";}},
  });
  assert.equal(await composition.authentication.authenticate({
    platformSessionId:"session-cookie",accessToken:"signed-jwt",
  }),"authenticated");
  assert.ok(composition.stepUp);
  let origin="";
  const server=createServer((request,response)=>{
    const sessionId=request.headers.cookie==="noor_session=valid"?"session-cookie":null;
    if(request.url===NOOR_ADMIN_STEP_UP_PATH_R271){
      void handleNoorAdminStepUpR271(request,response,sessionId,{
        expectedOrigin:origin,operation:composition.stepUp!,
      });return;
    }
    if(request.url===NOOR_ADMIN_PASSWORD_RECOVERY_PATH_R271){
      void handleNoorAdminPasswordRecoveryR271(request,response,sessionId,{
        expectedOrigin:origin,resolveActor:composition.resolveActor,
        authorizeSensitiveAction:composition.authorizeSensitiveAction,
        provider:{sendRecoveryEmailForUserId:async id=>{
          events.push("delivered:"+id);return true;
        }},
        createAudit:()=>({record:async event=>{events.push("audit:"+event.outcome);}}),
      });return;
    }
    response.writeHead(404);response.end();
  });
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const address=server.address();
  if(!address || typeof address==="string")throw Error("NO_SERVER");
  origin="http://127.0.0.1:"+address.port;
  const post=(path:string,body:unknown)=>fetch(origin+path,{
    method:"POST",
    headers:{Origin:origin,"Content-Type":"application/json",Cookie:"noor_session=valid"},
    body:JSON.stringify(body),
  });
  try{
    assert.equal((await post(NOOR_ADMIN_PASSWORD_RECOVERY_PATH_R271,{
      targetAuthUserId:target,
    })).status,403);
    assert.equal((await post(NOOR_ADMIN_STEP_UP_PATH_R271,{
      factorId:factor,code:"123456",
    })).status,204);
    assert.equal((await post(NOOR_ADMIN_PASSWORD_RECOVERY_PATH_R271,{
      targetAuthUserId:target,
    })).status,202);
    assert.equal((await post(NOOR_ADMIN_PASSWORD_RECOVERY_PATH_R271,{
      targetAuthUserId:target,
    })).status,403);
    assert.deepEqual(events,[
      "verified-fresh-totp","audit:initiated","delivered:"+target,"audit:requested",
    ]);
    composition.revokeSession("session-cookie");
    assert.equal((await post(NOOR_ADMIN_STEP_UP_PATH_R271,{
      factorId:factor,code:"123456",
    })).status,403);
  }finally{
    server.close();await once(server,"close");composition.shutdown();
  }
});
