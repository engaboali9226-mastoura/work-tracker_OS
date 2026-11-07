import type {IncomingMessage,ServerResponse} from "./route-access-http-server.js";
import {serializeNoorSessionClearingCookie} from "./session-cookie.js";

export const NOOR_LOGOUT_PATH_R269="/api/noor/session/logout";
export interface NoorLogoutOptionsR269 {
 readonly expectedOrigin:string;
 readonly secureCookie:boolean;
 readonly revokeSession:Readonly<{execute(input:Readonly<{sessionId:string}>):Promise<void>}>;
}
function originIsExact(req:IncomingMessage,expected:string):boolean{
 let count=0;
 for(let i=0;i<req.rawHeaders.length;i+=2){
  if(req.rawHeaders[i]?.toLowerCase()==="origin"){
   count+=1;
   if(req.rawHeaders[i+1]!==expected)return false;
  }
 }
 return count===1&&req.headers.origin===expected;
}
function finish(response:ServerResponse,status:number,headers:Readonly<Record<string,string>>={}):void{
 response.writeHead(status,{"Cache-Control":"no-store","Content-Length":"0",...headers});
 response.end();
}
export async function handleNoorLogoutR269(
 request:IncomingMessage,response:ServerResponse,
 sessionId:string|null,options:NoorLogoutOptionsR269,
):Promise<void>{
 if(request.method!=="POST"){finish(response,405,{Allow:"POST"});return;}
 if(!originIsExact(request,options.expectedOrigin)){finish(response,403);return;}
 if(request.headers["transfer-encoding"]!==undefined||
   (request.headers["content-length"]!==undefined&&request.headers["content-length"]!=="0")){
  finish(response,400);return;
 }
 if(sessionId){
  try{
   await options.revokeSession.execute({sessionId});
  }catch{
   // Never indicate success or remove the browser cookie when revocation fails.
   finish(response,503);return;
  }
 }
 finish(response,204,{"Set-Cookie":serializeNoorSessionClearingCookie({secure:options.secureCookie})});
}
