import type {IncomingMessage,ServerResponse} from "./route-access-http-server.js";
import type {NoorAdminSessionAuthenticationR271} from "./noor-admin-session-authentication-r271.js";

export const NOOR_ADMIN_SESSION_AUTHENTICATION_PATH_R271="/api/noor/admin/authenticate";
export interface NoorAdminSessionAuthenticationHttpDependenciesR271 {
  readonly expectedOrigin:string;
  readonly operation:NoorAdminSessionAuthenticationR271;
}
function respond(response:ServerResponse,status:number):void{
  response.writeHead(status,{"Cache-Control":"no-store","Content-Length":"0",
    "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"});
  response.end();
}
function exactOrigin(request:IncomingMessage,origin:string):boolean{
  let count=0;
  for(let i=0;i<request.rawHeaders.length;i+=2){
    if(request.rawHeaders[i]?.toLowerCase()==="origin"){
      count++;if(request.rawHeaders[i+1]!==origin)return false;
    }
  }
  return count===1 && request.headers.origin===origin;
}
export async function handleNoorAdminSessionAuthenticationR271(
  request:IncomingMessage,response:ServerResponse,platformSessionId:string|null,
  dependencies:NoorAdminSessionAuthenticationHttpDependenciesR271,
):Promise<void>{
  if(request.method!=="POST"){respond(response,405);return;}
  if(!exactOrigin(request,dependencies.expectedOrigin)){respond(response,403);return;}
  if(!platformSessionId){respond(response,401);return;}
  if(request.headers["content-type"]!=="application/json" ||
     request.headers["transfer-encoding"]!==undefined ||
     !/^[1-9][0-9]{0,4}$/.test(request.headers["content-length"]??"") ||
     Number(request.headers["content-length"])>9000){respond(response,400);return;}
  try{
    let size=0;const chunks:Buffer[]=[];
    for await(const part of request){
      const chunk=Buffer.isBuffer(part)?part:Buffer.from(part);
      size+=chunk.length;
      if(size>9000){respond(response,413);return;}
      chunks.push(chunk);
    }
    if(size!==Number(request.headers["content-length"])){respond(response,400);return;}
    let value:unknown;
    try{value=JSON.parse(Buffer.concat(chunks).toString("utf8"));}
    catch{respond(response,400);return;}
    if(!value || typeof value!=="object" || Array.isArray(value) ||
       Object.keys(value).length!==1 || !("accessToken" in value) ||
       typeof value.accessToken!=="string" || !value.accessToken ||
       value.accessToken.length>8192){respond(response,400);return;}
    const result=await dependencies.operation.authenticate({
      platformSessionId,accessToken:value.accessToken,
    });
    respond(response,result==="authenticated"?204:result==="denied"?403:503);
  }catch{respond(response,503);}
}
