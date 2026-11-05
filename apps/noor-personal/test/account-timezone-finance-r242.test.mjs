import assert from "node:assert/strict";
import test from "node:test";
import {InMemoryFoundationStore,PersonalCommandService,SequenceIdGenerator} from "../dist/index.js";

const now="2026-11-05T21:30:00.000Z";
const operation=(id,date)=>({type:"finance",operation:{
  action:"create-account",id,name:id,kind:"cash",openingMinor:10000,date,
}});
const setup=(accountTimeZone)=>{
  const store=new InMemoryFoundationStore({});
  const service=new PersonalCommandService({
    clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),
    transaction:store,...(accountTimeZone?{accountTimeZone}:{}),
  });
  return {store,service};
};
test("R242 finance-only Cairo accounts reject a future local date instead of assuming Riyadh",async()=>{
  const {store,service}=setup("Africa/Cairo");
  // 21:30Z is 23:30 Cairo on Nov 5, but 00:30 Riyadh on Nov 6.
  await assert.rejects(()=>service.execute("owner",operation("future","2026-11-06")));
  assert.equal(store.snapshot().finance?.accounts?.length??0,0);
  await service.execute("owner",operation("today","2026-11-05"));
  assert.equal(store.snapshot().finance.accounts[0].date,"2026-11-05");
});
test("R242 legacy finance-only accounts without a saved timezone preserve existing Riyadh behavior",async()=>{
  const {store,service}=setup(undefined);
  await service.execute("owner",operation("legacy","2026-11-06"));
  assert.equal(store.snapshot().finance.accounts[0].date,"2026-11-06");
});
test("R242 finance date validation respects DST-aware IANA zones",async()=>{
  const today="2026-11-05T21:30:00.000Z";
  assert.equal(today,now);
  const {store,service}=setup("America/New_York");
  await service.execute("owner",operation("new-york-today","2026-11-05"));
  await assert.rejects(()=>service.execute("owner",operation("new-york-future","2026-11-06")));
  assert.equal(store.snapshot().finance.accounts.length,1);
});
