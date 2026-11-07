import type {SupabaseClient} from "@supabase/supabase-js";

export interface NoorAdminAuditDatabaseR271 {
  readonly public:{
    readonly Tables:{
      readonly noor_admin_audit_r271:{
        readonly Row:{
          readonly id:string;readonly actor_auth_user_id:string;
          readonly target_auth_user_id:string|null;readonly action:string;
          readonly outcome:"success"|"denied"|"failure";
          readonly request_id:string;readonly occurred_at:string;
          readonly details:Record<string,string|number|boolean|null>;
        };
        readonly Insert:{
          readonly actor_auth_user_id:string;
          readonly target_auth_user_id?:string|null;
          readonly action:string;
          readonly outcome:"success"|"denied"|"failure";
          readonly request_id:string;
          readonly details?:Record<string,string|number|boolean|null>;
        };
        readonly Update:Record<string,never>;
        readonly Relationships:[];
      };
    };
    readonly Views:Record<string,never>;
    readonly Functions:Record<string,never>;
  };
}

export class NoorAdminAuditStoreR271 {
  public constructor(private readonly client:SupabaseClient<NoorAdminAuditDatabaseR271>){}
  public async record(input:Readonly<{
    actorAuthUserId:string;targetAuthUserId?:string|null;
    action:string;outcome:"success"|"denied"|"failure";
    requestId:string;details?:Record<string,string|number|boolean|null>;
  }>):Promise<void>{
    if(!input.actorAuthUserId || !input.requestId ||
       !input.action || input.action.length>100) {
      throw Error("NOOR_ADMIN_AUDIT_INVALID");
    }
    const {error}=await this.client.from("noor_admin_audit_r271").insert({
      actor_auth_user_id:input.actorAuthUserId,
      target_auth_user_id:input.targetAuthUserId??null,
      action:input.action,outcome:input.outcome,
      request_id:input.requestId,details:input.details??{},
    });
    if(error) throw Error("NOOR_ADMIN_AUDIT_UNAVAILABLE");
  }
}
