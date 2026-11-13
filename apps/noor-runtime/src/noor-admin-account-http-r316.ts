/** R316 trusted account-management API: bearer-only, exact origin, no cookies. */
import type {IncomingMessage,ServerResponse} from "./route-access-http-server.js";
import type {NoorAdminAccountManagementR316,NoorAdminResultR316} from "./noor-admin-account-management-r316.js";
export const NOOR_ADMIN_ACCOUNTS_PREFIX_R316="/api/noor/admin/accounts/";
export interface NoorAdminHttpR316 {
 operation:NoorAdminAccountManagementR316;
 expectedOrigin:string;
}
const methods=new Set(["list","create","delete","rename","access"]);
function empty(res:ServerResponse,status:number):void{
 res.writeHead(status,{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Content-Length":"0"});res.end();
}
function json(res:ServerResponse,result:NoorAdminResultR316):void{
 if(result.body===undefined){empty(res,result.status);return;}
 const body=Buffer.from(JSON.stringify(result.body),"utf8");
 res.writeHead(result.status,{"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8",
   "Content-Length":String(body.byteLength),"X-Content-Type-Options":"nosniff"});res.end(body);
}
export function makeNoorAdminAccountsHttpHandlerR316(opt:NoorAdminHttpR316){
 if(!/^https:\/\//.test(opt.expectedOrigin)||new URL(opt.expectedOrigin).origin!==opt.expectedOrigin)throw Error("R316_ORIGIN_INVALID");
 return async(req:IncomingMessage,res:ServerResponse):Promise<void>=>{
  try{
   if(typeof req.url!=="string"||!req.url.startsWith(NOOR_ADMIN_ACCOUNTS_PREFIX_R316)){empty(res,404);return;}
   const action=req.url.slice(NOOR_ADMIN_ACCOUNTS_PREFIX_R316.length);
   if(!methods.has(action)){empty(res,404);return;}
   if(req.method!=="POST"){empty(res,405);return;}
   // Reject duplicated Origin/Authorization even if Node joins headers.
   const occurrences=(key:string)=>req.rawHeaders.filter((v,i)=>i%2===0&&v.toLowerCase()===key).length;
   if(occurrences("origin")!==1||req.headers.origin!==opt.expectedOrigin||
      (req.headers["sec-fetch-site"]!==undefined&&req.headers["sec-fetch-site"]!=="same-origin")||
      req.headers.cookie!==undefined){empty(res,403);return;}
   if(occurrences("authorization")!==1){empty(res,401);return;}
   const rawAuth=req.headers.authorization;
   const token=typeof rawAuth==="string"&&rawAuth.startsWith("Bearer ")?rawAuth.slice(7):null;
   if(!token||token.length>8192){empty(res,401);return;}
   if(!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?$/i.test(String(req.headers["content-type"]??""))){
    empty(res,415);return;
   }
   if(req.headers["transfer-encoding"]!==undefined){empty(res,400);return;}
   const len=Number(req.headers["content-length"]??"0");
   if(!Number.isSafeInteger(len)||len<0||len>8192){empty(res,413);return;}
   const parts:Buffer[]=[];let bytes=0;
   for await(const part of req){const b=Buffer.isBuffer(part)?part:Buffer.from(part);bytes+=b.byteLength;
    if(bytes>8192){empty(res,413);return;}parts.push(b);}
   if(bytes!==len){empty(res,400);return;}
   let data:unknown;try{data=JSON.parse(Buffer.concat(parts).toString("utf8"));}
   catch{empty(res,400);return;}
   json(res,await opt.operation.execute(action as "list"|"create"|"delete"|"rename"|"access",token,data));
  }catch{empty(res,503);}
 };
}
