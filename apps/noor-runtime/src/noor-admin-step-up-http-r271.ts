import type {IncomingMessage,ServerResponse} from "./route-access-http-server.js";
import type {NoorAdminServerStepUpR271} from "./noor-admin-server-step-up-r271.js";

export const NOOR_ADMIN_STEP_UP_PATH_R271="/api/noor/admin/step-up";
export interface NoorAdminStepUpHttpDependenciesR271 {
  readonly expectedOrigin:string;
  readonly operation:Pick<NoorAdminServerStepUpR271,"verify">;
}
function respond(response:ServerResponse,status:number):void{
  response.writeHead(status,{
    "Cache-Control":"no-store","Content-Length":"0",
    "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  });
  response.end();
}
function exactOrigin(request:IncomingMessage,origin:string):boolean{
  let count=0;
  for(let i=0;i<request.rawHeaders.length;i+=2){
    if(request.rawHeaders[i]?.toLowerCase()==="origin"){
      count++;
      if(request.rawHeaders[i+1]!==origin)return false;
    }
  }
  return count===1 && request.headers.origin===origin;
}
/**
 * Accept only a factor ID and six-digit TOTP from the browser.
 * NEVER accept an Auth JWT, Auth user ID, administrator role, session ID,
 * recent-authentication timestamp or challenge result in the JSON body.
 * The Noor session is resolved from the trusted HttpOnly session cookie.
 */
export async function handleNoorAdminStepUpR271(
  request:IncomingMessage,response:ServerResponse,platformSessionId:string|null,
  dependencies:NoorAdminStepUpHttpDependenciesR271,
):Promise<void>{
  if(request.url!==NOOR_ADMIN_STEP_UP_PATH_R271){respond(response,404);return;}
  if(request.method!=="POST"){respond(response,405);return;}
  if(!exactOrigin(request,dependencies.expectedOrigin)){respond(response,403);return;}
  if(!platformSessionId){respond(response,401);return;}
  if(request.headers["transfer-encoding"]!==undefined ||
     request.headers["content-type"]!=="application/json" ||
     !/^[1-9][0-9]{0,2}$/.test(request.headers["content-length"]??"") ||
     Number(request.headers["content-length"])>512){respond(response,400);return;}
  try{
    let size=0;const chunks:Buffer[]=[];
    for await(const part of request){
      const buffer=Buffer.isBuffer(part)?part:Buffer.from(part);
      size+=buffer.length;
      if(size>512){respond(response,413);return;}
      chunks.push(buffer);
    }
    if(size!==Number(request.headers["content-length"])){respond(response,400);return;}
    let value:unknown;
    try{value=JSON.parse(Buffer.concat(chunks).toString("utf8"));}
    catch{respond(response,400);return;}
    if(!value || typeof value!=="object" || Array.isArray(value) ||
       Object.keys(value).length!==2 || !("factorId" in value) ||
       !("code" in value) || typeof value.factorId!=="string" ||
       typeof value.code!=="string" ||
       !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value.factorId) ||
       !/^\d{6}$/.test(value.code)){respond(response,400);return;}
    const ok=await dependencies.operation.verify({
      platformSessionId,factorId:value.factorId,code:value.code,
    });
    respond(response,ok?204:403);
  }catch{respond(response,503);}
}
