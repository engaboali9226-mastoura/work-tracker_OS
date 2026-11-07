import {NoorAdminAuthSessionRegistrySqlR271} from "./noor-admin-auth-session-registry-r271.js";

/**
 * Adapter for a trusted, privileged PostgreSQL query client (e.g. pg Pool).
 * No database credentials are loaded here. The injected client must connect
 * over TLS with a restricted DB role allowed to EXECUTE the private R271
 * session-status routine, not to read Auth tables directly.
 */
export interface NoorAdminPgSessionQueryClientR271 {
  query(sql:string,params:string[]):Promise<Readonly<{
    rows:ReadonlyArray<Readonly<{active:boolean}>>;
  }>>;
}
export function createNoorAdminPgSessionRegistryR271(client:NoorAdminPgSessionQueryClientR271):NoorAdminAuthSessionRegistrySqlR271 {
  return new NoorAdminAuthSessionRegistrySqlR271({
    execute:async(sql,params)=>{
      // Parameterize both UUIDs; never concatenate browser data into SQL.
      const result=await client.query(sql,[...params]);
      if(!result || !Array.isArray(result.rows))throw new Error("NOOR_SESSION_QUERY_UNAVAILABLE");
      return result.rows;
    },
  });
}
