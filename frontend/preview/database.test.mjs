import { test } from 'node:test';
import assert from 'node:assert/strict';
import {createDatabase,KEY} from './database.mjs';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};};
const call=(db,path,method='GET',body)=>db.fetch('https://env-preview.invalid/rest/v1/'+path,{method,body:body&&JSON.stringify(body)});
test('create, edit, reload, delete and reset share a durable local store',async()=>{
 const s=storage(),db=createDatabase(s);
 const response=await call(db,'reading','POST',{id:'new',reading_date:'2026-09-09',do_aeration:null,do_sedimentation:null,do_before_discharge:null,ph:7});
 assert.equal(response.status,200);
 await call(db,'reading?id=eq.new','PATCH',{ph:8});
 const reopened=createDatabase(s);
 let rows=await (await call(reopened,'v_reading_with_computed?id=eq.new')).json();
 assert.equal(rows[0].ph,8);assert.equal(rows[0].do_average,null);
 await call(reopened,'reading?id=eq.new','DELETE');
 assert.deepEqual(await (await call(reopened,'reading?id=eq.new')).json(),[]);
 reopened.reset();assert.equal(JSON.parse(s.getItem(KEY)).reading.length,14);
});
test('fail closed for real hosts, AI/storage, unknown filters and unbounded writes',async()=>{
 const db=createDatabase(storage());
 for(const url of ['https://example.supabase.co/rest/v1/reading','https://env-preview.invalid/functions/v1/ai']) assert.equal((await db.fetch(url)).status,400);
 assert.equal((await call(db,'reading','DELETE')).status,400);
 assert.equal((await call(db,'reading?ph=unknown.7')).status,400);
 assert.equal((await call(db,'v_unified_co2e')).status,400);
});
test('filter, aliases, counts, single response and storage failures',async()=>{
 const s=storage(),db=createDatabase(s);
 const res=await call(db,'reading?id=eq.demo-reading-1&select=identity:id&limit=1');
 assert.equal(res.headers.get('content-range'),'0-0/1');assert.equal((await res.json())[0].identity,'demo-reading-1');
 const single=await db.fetch('https://env-preview.invalid/rest/v1/reading?id=eq.demo-reading-1',{headers:{accept:'application/vnd.pgrst.object+json'}});
 assert.equal((await single.json()).id,'demo-reading-1');
 s.setItem=()=>{throw new Error('quota exceeded');};
 assert.equal((await call(db,'reading?id=eq.demo-reading-1','PATCH',{ph:99})).status,400);
 assert.notEqual((await (await call(db,'reading?id=eq.demo-reading-1')).json())[0].ph,99);
});
