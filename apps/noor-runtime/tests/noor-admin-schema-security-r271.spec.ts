import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const sql=readFileSync(new URL("../../../docs/noor/sql/R271_ADMIN_SCHEMA_CANDIDATE.sql",import.meta.url),"utf8");
test("R271 Auth session oracle exists only in restricted private schema",()=>{
  assert.match(sql,/create schema if not exists noor_admin_internal/i);
  assert.match(sql,/create or replace function noor_admin_internal\.noor_admin_auth_session_active_r271\(/i);
  assert.match(sql,/security definer\s+set search_path\s*=\s*''/i);
  assert.match(sql,/from auth\.sessions/i);
  assert.match(sql,/revoke all on function noor_admin_internal\.noor_admin_auth_session_active_r271\(uuid,uuid\)\s+from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function noor_admin_internal\.noor_admin_auth_session_active_r271\(uuid,uuid\)\s+to service_role/i);
  assert.doesNotMatch(sql,/grant (?:usage|execute)[\s\S]{0,100}noor_admin_internal[\s\S]{0,100}to (?:anon|authenticated)/i);
});
test("R271 admin tables are not seeded or exposed to anonymous users",()=>{
  assert.match(sql,/alter table public\.noor_admin_accounts_r271 enable row level security/i);
  assert.match(sql,/alter table public\.noor_admin_audit_r271 enable row level security/i);
  assert.match(sql,/revoke all on public\.noor_admin_accounts_r271 from anon, authenticated/i);
  assert.doesNotMatch(sql,/insert into public\.noor_admin_accounts_r271/i);
});

test("R271 exposed RPC bridge is invoker-only and callable solely by service_role",()=>{
  assert.match(sql,/create or replace function public\.noor_admin_auth_session_active_r271\(/i);
  assert.match(sql,/language sql\s+stable\s+security invoker\s+set search_path\s*=\s*''/i);
  assert.match(sql,/select noor_admin_internal\.noor_admin_auth_session_active_r271\(/i);
  assert.match(sql,/revoke all on function public\.noor_admin_auth_session_active_r271\(uuid,uuid\)\s+from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.noor_admin_auth_session_active_r271\(uuid,uuid\)\s+to service_role/i);
  assert.doesNotMatch(sql,/create or replace function public\.noor_admin_auth_session_active_r271\([\s\S]*?security definer/i);
});
