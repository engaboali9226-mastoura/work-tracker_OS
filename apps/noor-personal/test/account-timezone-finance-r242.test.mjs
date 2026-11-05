import assert from "node:assert/strict";
import test from "node:test";
import {PersonalCommandService,SequenceIdGenerator} from "../dist/index.js";

const now="2026-11-05T21:30:00.000Z";
const operation=(id,date)=>({type:"finance",operation:{
  action:"create-account",id,name:id,kind:"cash",openingMinor:10000,date,
}});
function setup(accountTimeZone){
  let state={userId:"owner",currency:"SAR",accounts:[],debts:[],entries:[],requests:[]};
  const transaction={
    async runInTransaction(work){
      let staged=structuredClone(state);
      const result=await work({
        findOpenPersonalDayContaining:()=>null,
        getFinance:(userId)=>{assert.equal(userId,"owner");return structuredClone(staged);},
        saveFinance:(userId,next)=>{assert.equal(userId,"owner");staged=structuredClone(next);},
      });
      state=staged;
      return result;
    },
  };
  const service=new PersonalCommandService({
    clock:{now:()=>now},idGenerator:new SequenceIdGenerator(),
    transaction,...(accountTimeZone?{accountTimeZone}:{}),
  });
  return {ledger:()=>structuredClone(state),service};
}
test("R242 finance-only Cairo accounts reject a future local date instead of assuming Riyadh",async()=>{
  const {ledger,service}=setup("Africa/Cairo");
  // At 21:30Z it is Nov 5 in Cairo, but Nov 6 in Riyadh.
  await assert.rejects(()=>service.execute("owner",operation("future","2026-11-06")),/FINANCE_FUTURE_TRANSACTION/);
  assert.equal(ledger().accounts.length,0);
  await service.execute("owner",operation("today","2026-11-05"));
  assert.equal(ledger().accounts[0].date,"2026-11-05");
});
test("R242 legacy finance-only account without timezone retains historical Riyadh fallback",async()=>{
  const {ledger,service}=setup(undefined);
  await service.execute("owner",operation("legacy","2026-11-06"));
  assert.equal(ledger().accounts[0].date,"2026-11-06");
});
test("R242 IANA US timezone honors its actual local financial date",async()=>{
  const {ledger,service}=setup("America/New_York");
  await service.execute("owner",operation("new-york-today","2026-11-05"));
  await assert.rejects(()=>service.execute("owner",operation("new-york-future","2026-11-06")),/FINANCE_FUTURE_TRANSACTION/);
  assert.equal(ledger().accounts.length,1);
});
