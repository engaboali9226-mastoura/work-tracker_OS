import assert from "node:assert/strict";
import test from "node:test";
import {shouldRefreshNoorOnResume,NOOR_RESUME_SYNC_COOLDOWN_MS} from "../src/noor-resume-sync-r259.js";

const baseline=1_800_000_000_000;
const ready={nowMs:baseline+NOOR_RESUME_SYNC_COOLDOWN_MS,lastAttemptAt:baseline,
  visible:true,writesPending:false,refreshPending:false};
test("R259: foreground resume sync is bounded and triggered only by an idle visible page",()=>{
 assert.equal(shouldRefreshNoorOnResume(ready),true);
 assert.equal(shouldRefreshNoorOnResume({...ready,nowMs:ready.nowMs-1}),false);
 assert.equal(shouldRefreshNoorOnResume({...ready,nowMs:baseline+NOOR_RESUME_SYNC_COOLDOWN_MS+1}),true);
 assert.equal(shouldRefreshNoorOnResume({...ready,visible:false}),false);
 assert.equal(shouldRefreshNoorOnResume({...ready,writesPending:true}),false);
 assert.equal(shouldRefreshNoorOnResume({...ready,refreshPending:true}),false);
 assert.equal(shouldRefreshNoorOnResume({...ready,nowMs:baseline-100}),false);
 assert.equal(shouldRefreshNoorOnResume({...ready,nowMs:Number.NaN}),false);
 assert.equal(shouldRefreshNoorOnResume({...ready,lastAttemptAt:Number.POSITIVE_INFINITY}),false);
});
