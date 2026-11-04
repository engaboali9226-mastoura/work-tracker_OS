import assert from 'node:assert/strict';
import {createServer, type Server} from 'node:http';
import test from 'node:test';
import {makePrivateJournalHttpHandlerR186} from '../src/noor-private-journal-http-r186.js';
import type {NoorPrivateJournalOperationR185} from '../src/noor-private-journal-r185.js';

test('R192 strict Origin and Fetch Metadata: reject before trusted operation',async () => {
  const calls:{action:string,session:string|null}[]=[];
  const mock={
    create:async (session:string|null)=>{calls.push({action:'create',session});return {status:201,body:{id:'synthetic-id'}};},
    list:async (session:string|null)=>{calls.push({action:'list',session});return {status:200,body:{entries:[]}};},
    remove:async (session:string|null)=>{calls.push({action:'remove',session});return {status:204};},
    exportApproved:async (session:string|null)=>{calls.push({action:'developer-export',session});return {status:200,body:{entries:[]}};},
  } as unknown as NoorPrivateJournalOperationR185;
  let handler:ReturnType<typeof makePrivateJournalHttpHandlerR186>|null=null;
  const server:Server=createServer((req,res)=>{if(!handler){res.writeHead(503);res.end();return;}void handler(req,res);});
  await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  try{
    const address=server.address();assert.ok(address&&typeof address!=='string');
    const origin=`http://127.0.0.1:${address.port}`;
    handler=makePrivateJournalHttpHandlerR186(mock,origin);
    const query=async(action:string,body:object,headers:Record<string,string>={})=>{
      const response=await fetch(`${origin}/api/noor/personal/journal/${action}`,{
        method:'POST',headers:{'Content-Type':'application/json',Cookie:'noor_session=synthetic-session-A',...headers},body:JSON.stringify(body)
      });
      assert.equal(response.headers.get('cache-control'),'no-store');
      return response.status;
    };
    const actions:[string,object][]= [['list',{}],['create',{note:{}}],['remove',{id:'synthetic-id'}],['developer-export',{}]];
    for(const [action,payload] of actions){
      assert.equal(await query(action,payload),403,`missing origin for ${action}`);
      assert.equal(await query(action,payload,{Referer:origin+'/personal'}),403,`Referer is not Origin for ${action}`);
      assert.equal(await query(action,payload,{Origin:'null'}),403);
      assert.equal(await query(action,payload,{Origin:'https://evil.example'}),403);
      assert.equal(await query(action,payload,{Origin:origin,'Sec-Fetch-Site':'cross-site'}),403);
      assert.equal(await query(action,payload,{Origin:origin,'Sec-Fetch-Site':'same-site'}),403);
    }
    assert.equal(calls.length,0,'forbidden cross-site/no-Origin request reached trusted operation');
    assert.equal(await query('list',{}, {Origin:origin}),200);
    assert.equal(await query('list',{}, {Origin:origin,'Sec-Fetch-Site':'same-origin'}),200);
    assert.equal(calls.length,2);
    assert.equal(calls[0]?.session,'synthetic-session-A');
  }finally{
    await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
});
