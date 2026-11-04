import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { SupabasePostgresPrivateJournalStoreR221 } from "../src/journal/supabase-postgres-private-journal-store-r221.js";

const UUID_A="11111111-1111-4111-8111-111111112221";
const UUID_B="22222222-2222-4222-8222-222222222221";
const sample=(ownerUserId:string,id=UUID_A)=>({
 ownerUserId,id,createdAt:new Date().toISOString(),keyVersion:1,
 nonce:randomBytes(12).toString("base64"),tag:randomBytes(16).toString("base64"),
 ciphertext:Buffer.from("R221_SYNTHETIC_CIPHER_ONLY").toString("base64")
});
function fake(){
 const rows:any[]=[],queries:any[]=[];
 const client={
   from(table:string){
     assert.equal(table,"noor_private_journal_entries_r221");
     return {
       insert(item:any){ queries.push(["insert",item]);return{
         async select(){
           if(rows.some(r=>r.owner_user_id===item.owner_user_id&&r.id===item.id))
              return {data:null,error:{code:"23505"}};
           rows.push(item);return {data:[{id:item.id}],error:null};
         }
       }},
       select(columns:string){
         queries.push(["select",columns]);
         let owner:string|undefined;
         const chain={
           eq(column:string,value:string){assert.equal(column,"owner_user_id");owner=value;queries.push(["eq",column,value]);return chain;},
           order(column:string,opts:any){queries.push(["order",column,opts]);return chain;},
           async limit(n:number){queries.push(["limit",n]);return {data:rows.filter(r=>r.owner_user_id===owner).slice(0,n),error:null};}
         };return chain;
       },
       delete(){
         queries.push(["delete"]);
         let owner:string|undefined,id:string|undefined;
         const chain={
           eq(column:string,value:string){ if(column==="owner_user_id")owner=value;else if(column==="id")id=value;else throw Error("FOREIGN_EQ");queries.push(["eq",column,value]);return chain; },
           async select(columns:string){assert.equal(columns,"id");assert.ok(owner&&id);
             const idx=rows.findIndex(r=>r.owner_user_id===owner&&r.id===id);
             return {data:idx<0?[]:[{id:rows.splice(idx,1)[0].id}],error:null};
           }
         };return chain;
       }
     };
   }
 };
 return {client,rows,queries,store:new SupabasePostgresPrivateJournalStoreR221(client as never)};
}

test("R221 inserts only encrypted fields and checks duplicate owner/id",async()=>{
 const t=fake(),row=sample("r221_fake_user_a");
 assert.equal(await t.store.insert(row),true);
 assert.equal(await t.store.insert(row),false);
 assert.equal(t.rows.length,1);
 assert.equal(t.rows[0].owner_user_id,row.ownerUserId);
 assert.equal(t.rows[0].ciphertext,row.ciphertext);
 assert.deepEqual(Object.keys(t.rows[0]).sort(),["ciphertext","created_at","id","key_version","nonce","owner_user_id","tag"]);
});

test("R221 enforces owner equality on every list and returns only encrypted rows",async()=>{
 const t=fake();
 await t.store.insert(sample("r221_fake_user_a",UUID_A));
 await t.store.insert(sample("r221_fake_user_b",UUID_B));
 assert.equal((await t.store.list("r221_fake_user_b")).length,1);
 assert.equal((await t.store.list("r221_fake_user_a")).length,1);
 assert.equal((await t.store.list("r221_fake_user_c")).length,0);
 const ownerQueries=t.queries.filter(q=>q[0]==="eq"&&q[1]==="owner_user_id");
 assert.deepEqual(ownerQueries.map(x=>x[2]),["r221_fake_user_b","r221_fake_user_a","r221_fake_user_c"]);
});

test("R221 requires BOTH owner and id for delete; cross-user delete fails",async()=>{
 const t=fake();
 await t.store.insert(sample("r221_fake_user_a",UUID_A));
 assert.equal(await t.store.remove("r221_fake_user_b",UUID_A),false);
 assert.equal(t.rows.length,1);
 assert.equal(await t.store.remove("r221_fake_user_a",UUID_A),true);
 assert.equal(t.rows.length,0);
 const deletes=t.queries.filter(x=>x[0]==="delete");
 assert.equal(deletes.length,2);
});

test("R221 refuses malformed owners and ciphertext before database calls",async()=>{
 const t=fake(),s=sample("r221_fake_user_a");
 await assert.rejects(t.store.insert({...s,ownerUserId:"attacker';DELETE FROM x"}),/R221_PRIVATE_JOURNAL_PERSISTENCE_REJECTED/);
 await assert.rejects(t.store.insert({...s,nonce:"not-base64"}),/R221_PRIVATE_JOURNAL_PERSISTENCE_REJECTED/);
 await assert.rejects(t.store.remove("wrong owner",UUID_A),/R221_PRIVATE_JOURNAL_PERSISTENCE_REJECTED/);
 await assert.rejects(t.store.list(""),/R221_PRIVATE_JOURNAL_PERSISTENCE_REJECTED/);
 assert.deepEqual(t.queries,[]);
});

test("R221 fails closed if privileged provider returns a foreign row",async()=>{
 const t=fake();await t.store.insert(sample("r221_fake_user_a"));
 // Force a provider integrity violation despite the adapter's .eq() filter.
 const chain={
   eq(){return chain;},
   order(){return chain;},
   async limit(){return {data:[{...t.rows[0],owner_user_id:"r221_fake_user_b"}],error:null};},
 };
 const bad={from(){return {select(){return chain;}};}};
 const store=new SupabasePostgresPrivateJournalStoreR221(bad as never);
 await assert.rejects(store.list("r221_fake_user_a"),/R221_PRIVATE_JOURNAL_PERSISTENCE_REJECTED/);
});

test("R221 readiness probe selects zero rows and never reads user notes",async()=>{
 const t=fake();
 await t.store.assertAccessible();
 assert.equal(t.rows.length,0);
 assert.ok(t.queries.some(q=>q[0]==="limit"&&q[1]===0));
});
