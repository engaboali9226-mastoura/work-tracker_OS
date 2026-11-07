import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const sql=readFileSync(new URL("../../../docs/noor/sql/R271_ADMIN_SCHEMA_CANDIDATE.sql",import.meta.url),"utf8");
test("R271 schema candidate stays private and has no bootstrap administrator",()=>{
  for(const table of ["noor_admin_accounts_r271","noor_admin_audit_r271"]){
    assert.match(sql,new RegExp("alter table public\\."+table+" enable row level security","i"));
    assert.match(sql,new RegExp("revoke all on public\\."+table+" from anon, authenticated","i"));
  }
  assert.match(sql,/revoke all on schema noor_admin_internal from public, anon, authenticated/i);
  assert.match(sql,/security definer\s+set search_path = ''/i);
  assert.match(sql,/pg_advisory_xact_lock\(271, 1\)/i);
  assert.match(sql,/v_super_admin_count <= 1/i);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.noor_admin_accounts_r271\b/i);
  assert.match(sql,/revoke all on function noor_admin_internal\.noor_admin_disable_account_r271/i);
});
