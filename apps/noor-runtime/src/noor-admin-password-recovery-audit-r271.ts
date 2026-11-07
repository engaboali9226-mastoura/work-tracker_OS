import {randomUUID} from "node:crypto";
import type {NoorAdminPasswordRecoveryAuditR271} from "./noor-admin-password-recovery-r271.js";

interface ActorDirectoryR271 {
  findActiveByAccountId(accountId:string):Promise<Readonly<{
    authUserId:string;enabled:boolean;role:"super_admin"|"admin";
  }> | null>;
}
interface AuditWriterR271 {
  record(input:Readonly<{
    actorAuthUserId:string;targetAuthUserId:string;
    action:string;outcome:"initiated"|"success"|"failure";
    requestId:string;
  }>):Promise<void>;
}
/** Resolves the actor's trusted Auth ID; platform account IDs are not UUIDs. */
export class NoorPasswordRecoveryAuditAdapterR271
implements NoorAdminPasswordRecoveryAuditR271 {
  public constructor(
    private readonly actors:ActorDirectoryR271,
    private readonly audit:AuditWriterR271,
    private readonly requestId:string=randomUUID(),
  ){}
  public async record(event:Readonly<{
    actorAccountId:string;targetAuthUserId:string;
    action:"accounts:reset-password";outcome:"initiated"|"requested"|"failed";
  }>):Promise<void>{
    const actor=await this.actors.findActiveByAccountId(event.actorAccountId);
    if(!actor?.enabled || actor.role!=="super_admin" || !actor.authUserId) {
      throw Error("NOOR_ADMIN_AUDIT_ACTOR_UNVERIFIED");
    }
    await this.audit.record({
      actorAuthUserId:actor.authUserId,
      targetAuthUserId:event.targetAuthUserId,
      action:event.action,
      outcome:event.outcome==="requested"?"success":
        event.outcome==="failed"?"failure":"initiated",
      requestId:this.requestId,
    });
  }
}
