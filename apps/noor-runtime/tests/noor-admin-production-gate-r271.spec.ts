import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

test("R271 production entrypoint does not accidentally enable admin routes",()=>{
  const main=readFileSync(new URL("../src/main.ts",import.meta.url),"utf8");
  assert.match(main,/createPrivilegedPlatformRuntimeHost\(/);
  assert.match(main,/createPrivilegedTransportRuntime\(/);
  assert.doesNotMatch(main,/createNoorAdminSecureCompositionR271|adminR271\s*:|adminRecoveryR271\s*:|adminAuthenticationR271\s*:/);
});
test("R271 privileged composition denies authority without trusted session registry",()=>{
  const source=readFileSync(new URL("../src/noor-admin-supabase-assurance-r271.ts",import.meta.url),"utf8");
  assert.match(source,/if\(!this\.sessionRegistry \|\| !\(await this\.sessionRegistry\.isActive/);
  assert.match(source,/reauthenticated:false/);
});
