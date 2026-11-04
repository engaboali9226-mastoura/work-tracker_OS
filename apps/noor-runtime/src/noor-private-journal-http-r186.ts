/** R186 lab-only HTTP surface. Not registered on Noor's production router.
 * Host must be a real loopback ephemeral server in tests.
 */
import { sessionIdFromCookieHeader } from "./route-access-http-server.js";
import type { IncomingMessage, ServerResponse } from "./route-access-http-server.js";
import type { NoorPrivateJournalOperationR185, JournalResultR185 } from "./noor-private-journal-r185.js";

export const JOURNAL_R186_PATH_PREFIX = "/api/noor/personal/journal/";
const PATHS = new Set(["create", "list", "remove", "developer-export"]);
function empty(res: ServerResponse, status: number): void {
  res.writeHead(status, {"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
  res.end();
}
export function makePrivateJournalHttpHandlerR186(operation: NoorPrivateJournalOperationR185,
  expectedOrigin: string): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  if (!/^http:\/\/127\.0\.0\.1:\d+$/u.test(expectedOrigin)) throw Error("R186_LOOPBACK_ONLY");
  return async (req,res) => {
    try {
      if (typeof req.url !== "string" || !req.url.startsWith(JOURNAL_R186_PATH_PREFIX)) return empty(res,404);
      const name=req.url.slice(JOURNAL_R186_PATH_PREFIX.length);
      if (!PATHS.has(name)) return empty(res,404);
      if (req.method !== "POST") return empty(res,405);
      // R192: all private journal POSTs require proof of this exact same origin.
      // Missing/null/duplicated/foreign Origin must never reach the trusted session resolver.
      if (req.headers.origin !== expectedOrigin) return empty(res,403);
      // Fetch Metadata adds a fail-closed check when browsers provide it.
      // Header is optional for older Safari versions; Origin above is mandatory.
      const fetchSite = req.headers["sec-fetch-site"];
      if (fetchSite !== undefined && fetchSite !== "same-origin") return empty(res,403);
      if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?$/iu.test(String(req.headers["content-type"]??""))) return empty(res,415);
      const declaredLength = Number(req.headers["content-length"]??"0");
      if (!Number.isSafeInteger(declaredLength) || declaredLength>16384 || declaredLength<0) return empty(res,413);
      const chunks:Buffer[]=[]; let size=0;
      for await (const part of req){const chunk=Buffer.isBuffer(part)?part:Buffer.from(part);size+=chunk.byteLength;if(size>16384)return empty(res,413);chunks.push(chunk);}
      let payload:unknown;
      try {payload=JSON.parse(Buffer.concat(chunks).toString("utf8"));} catch {return empty(res,400);}
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) return empty(res,400);
      const obj=payload as Record<string,unknown>;
      const keys=Object.keys(obj).sort().join("|");
      const session=sessionIdFromCookieHeader(req.headers.cookie);
      let result:JournalResultR185;
      if(name==="create"&&keys==="note") result=await operation.create(session,obj.note);
      else if(name==="remove"&&keys==="id") result=await operation.remove(session,obj.id);
      else if(name==="list"&&keys==="") result=await operation.list(session);
      else if(name==="developer-export"&&keys==="") result=await operation.exportApproved(session);
      else return empty(res,400);
      if (!result.body) return empty(res,result.status);
      const data=Buffer.from(JSON.stringify(result.body),"utf8");
      res.writeHead(result.status,{"Cache-Control":"no-store","Content-Type":"application/json; charset=utf-8","X-Content-Type-Options":"nosniff","Content-Length":String(data.length)});
      res.end(data);
    } catch {empty(res,503);}
  };
}
