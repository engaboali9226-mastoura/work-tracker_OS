import type {IncomingMessage,ServerResponse} from "./route-access-http-server.js";
import {authorizeAdminActionR271,type AdminAuthorityR271} from "./noor-admin-policy-r271.js";
import {requestNoorAdminPasswordRecoveryR271,type NoorAdminPasswordRecoveryProviderR271,type NoorAdminPasswordRecoveryAuditR271} from "./noor-admin-password-recovery-r271.js";

export const NOOR_ADMIN_PASSWORD_RECOVERY_PATH_R271="/api/noor/admin/password-recovery";
export interface NoorAdminRecoveryHttpDependenciesR271 {
  readonly expectedOrigin:string;
  readonly resolveAuthority:(sessionId:string)=>Promise<AdminAuthorityR271|null>;
  readonly resolveActorAccountId:(sessionId:string)=>Promise<string|null>;
  readonly provider:NoorAdminPasswordRecoveryProviderR271;
  /** Create a new audit correlation scope per HTTP request. */
  readonly createAudit:()=>NoorAdminPasswordRecoveryAuditR271;
}
function respond(response:ServerResponse,status:number):void {
  response.writeHead(status,{"Cache-Control":"no-store","Content-Length":"0",
    "X-Content-Type-Options":"nosniff"});
  response.end();
}
function exactOrigin(request:IncomingMessage,origin:string):boolean {
  let count=0;
  for(let i=0;i<request.rawHeaders.length;i+=2){
    if(request.rawHeaders[i]?.toLowerCase()==="origin"){
      count++;if(request.rawHeaders[i+1]!==origin)return false;
    }
  }
  return count===1 && request.headers.origin===origin;
}
async function readLimitedJson(request:IncomingMessage):Promise<unknown> {
  let size=0;const chunks:Buffer[]=[];
  for await(const part of request){
    const chunk=Buffer.isBuffer(part)?part:Buffer.from(part);
    size+=chunk.length;
    if(size>1024)throw Error("TOO_LARGE");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}
/**
 * Explicit opt-in HTTP handler. Browser supplies only a target Auth user ID,
 * never email, password, role, MFA, actor ID or a recovery token.
 */
export async function handleNoorAdminPasswordRecoveryR271(
  request:IncomingMessage,response:ServerResponse,sessionId:string|null,
  dependencies:NoorAdminRecoveryHttpDependenciesR271,
):Promise<void>{
  if(request.method!=="POST"){respond(response,405);return;}
  if(!exactOrigin(request,dependencies.expectedOrigin)){respond(response,403);return;}
  if(!sessionId){respond(response,401);return;}
  if(request.headers["transfer-encoding"]!==undefined ||
     request.headers["content-type"]!=="application/json" ||
     !/^[1-9][0-9]{0,3}$/.test(request.headers["content-length"]??"") ||
     Number(request.headers["content-length"])>1024){respond(response,400);return;}
  try{
    const authority=await dependencies.resolveAuthority(sessionId);
    if(!authorizeAdminActionR271(authority,"accounts:reset-password")){
      respond(response,403);return;
    }
    const payload=await readLimitedJson(request);
    if(!payload || typeof payload!=="object" || Array.isArray(payload) ||
       Object.keys(payload).length!==1 || !("targetAuthUserId" in payload) ||
       typeof payload.targetAuthUserId!=="string" ||
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(payload.targetAuthUserId)){
      respond(response,400);return;
    }
    const actorAccountId=await dependencies.resolveActorAccountId(sessionId);
    if(!actorAccountId){respond(response,403);return;}
    const result=await requestNoorAdminPasswordRecoveryR271({
      authority,actorAccountId,targetAuthUserId:payload.targetAuthUserId,
    },{provider:dependencies.provider,audit:dependencies.createAudit()});
    respond(response,result==="requested"?202:result==="denied"?403:503);
  }catch{respond(response,503);}
}
