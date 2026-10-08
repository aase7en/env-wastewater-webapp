// Synthetic browser-only store. No network fallback, credentials, or real exports.
export const KEY = 'env-preview-data-v1';
export const UID = '00000000-0000-4000-8000-000000000001';
const tables = ['reading','carbon_reading','equipment','location','location_category','personnel','app_user','threshold_alert','repair_request','role_module_visibility','sensor','sensor_reading','collection_log','dispense_log','work_round','daily_check','monthly_check','lab_test','inspection_round','master','movement','meter','regulation','attachment','pdf_template','saved_query','audit_log','ai_scope','ai_query_log','ai_provider'];
export function seed(now = new Date()) {
  const db = Object.fromEntries(tables.map(t => [t, []]));
  db.app_user = [{id:UID, role:'admin',display_name:'ผู้ทดลอง ENV',is_active:true}];
  db.personnel = [{id:UID,staff_code:'DEMO-01',full_name:'เจ้าหน้าที่จำลอง',position:'ผู้บันทึก',status:'active'}];
  db.location = [{id:UID,code:'DEMO-WWTP',area_name:'พื้นที่บำบัดน้ำเสียจำลอง',category_id:UID,lat:null,lng:null}];
  db.location_category = [{id:UID,name:'พื้นที่ทดลอง'}];
  db.equipment = ['pump1','pump2','aerator1','aerator2','sludge_pump1','sludge_pump2','chlorine_pump1','chlorine_pump2'].map((code,i)=>({id:`demo-equipment-${i}`,code,name:`อุปกรณ์จำลอง ${i+1}`,location_id:UID,is_active:true}));
  db.reading = Array.from({length:14}, (_,i) => {
    const d = new Date(now); d.setDate(d.getDate()-i);
    const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return {id:`demo-reading-${i+1}`,reading_date:date,do_aeration:3.2+i%3*0.2,do_sedimentation:2.4,do_before_discharge:3,ph:7.1+i%3*0.1,free_chlorine:0.6,tds_aeration:450+i,tds_before_discharge:400,temp_aeration:29,sv30:250,water_used_total:120+i,wastewater_in:100+i,system_operating:true,wastewater_discharged:true,pump1_running:true,aerator1_running:true,input_source:'manual',reported_by_name_legacy:'เจ้าหน้าที่จำลอง',location_id:UID,note:'ข้อมูลจำลองสำหรับทดลองเท่านั้น',created_at:d.toISOString()};
  });
  return db;
}
function computed(r) {
  const values=[r.do_aeration,r.do_sedimentation,r.do_before_discharge].filter(v=>v!=null && v!=='').map(Number).filter(Number.isFinite);
  const average=values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
  return {...r,do_average:average,date_thai_be:Number(r.reading_date?.slice(0,4))+543,do_alert:average!=null && average<2,chlorine_alert:r.free_chlorine!=null && r.free_chlorine<0.5,ph_alert:r.ph!=null && (r.ph<6.5 || r.ph>8.5),energy_kwh_estimate:r.pump1_meter!=null && r.pump2_meter!=null ? r.pump2_meter-r.pump1_meter : null};
}
function matches(row, filters) {
  return filters.every(([key,expression])=>{
    const dot=expression.indexOf('.'), op=expression.slice(0,dot), value=expression.slice(dot+1), actual=row[key];
    if(op==='eq') return String(actual)===value;
    if(op==='neq') return actual!=null && String(actual)!==value;
    if(op==='is') return value==='null' ? actual==null : String(actual)===value;
    if(op==='not' && value==='is.null') return actual!=null;
    if(op==='in') return value.slice(1,-1).split(',').includes(String(actual));
    if(op==='gte') return actual!=null && actual>=value;
    if(op==='gt') return actual!=null && actual>value;
    if(op==='lte') return actual!=null && actual<=value;
    if(op==='lt') return actual!=null && actual<value;
    throw new Error(`พรีวิวยังไม่รองรับตัวกรอง ${op}`);
  });
}
export function createDatabase(storage) {
  let db;
  try {db=JSON.parse(storage.getItem(KEY));} catch {db=null;}
  if (!db || !Array.isArray(db.reading)) db=seed();
  const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
  return {
    reset(){const next=seed();storage.setItem(KEY,JSON.stringify(next));db=next;},
    async fetch(input,init={}) {
      try {
        const persisted=storage.getItem(KEY);
        if(persisted) {const latest=JSON.parse(persisted);if(Array.isArray(latest?.reading)) db=latest;}
        const url=new URL(typeof input==='string'?input:input.url);
        if(url.origin!=='https://env-preview.invalid') throw new Error('พรีวิวปิดกั้นการเชื่อมต่อข้อมูลจริง');
        if(!url.pathname.startsWith('/rest/v1/')) throw new Error('พรีวิวนี้ไม่เรียก Auth, Storage หรือ AI ภายนอก');
        const name=url.pathname.slice('/rest/v1/'.length);
        const view=['v_dashboard_14day','v_reading_with_computed'].includes(name);
        const table=view?'reading':name;
        if(!Object.hasOwn(db,table)) throw new Error(`ยังไม่มีข้อมูลจำลองสำหรับ ${name}`);
        const method=(init.method || 'GET').toUpperCase();
        if(view && !['GET','HEAD'].includes(method)) throw new Error('ไม่สามารถเขียนผ่าน view');
        const filters=[...url.searchParams].filter(([k])=>!['select','order','limit','offset','on_conflict','columns'].includes(k));
        const select=url.searchParams.get('select');
        if(select?.includes('(')) throw new Error('พรีวิวยังไม่รองรับการเชื่อมตารางนี้');
        let rows=(view?db[table].map(computed):db[table]).filter(r=>matches(r,filters));
        const headers=new Headers(init.headers);
        if(method==='POST') {
          const inputRows=JSON.parse(init.body || '{}');
          rows=(Array.isArray(inputRows)?inputRows:[inputRows]).map(r=>({id:crypto.randomUUID(),created_at:new Date().toISOString(),...r}));
          const conflict=(url.searchParams.get('on_conflict') || 'id').split(',');
          const next=structuredClone(db[table]);
          for(const row of rows) {
            const index=next.findIndex(r=>conflict.every(k=>r[k]!==undefined && r[k]===row[k]));
            if(index>=0 && headers.get('prefer')?.includes('resolution=merge-duplicates')) next[index]={...next[index],...row};
            else if(index>=0) throw new Error('ข้อมูลจำลองซ้ำ');
            else next.push(row);
          }
          storage.setItem(KEY,JSON.stringify({...db,[table]:next})); db[table]=next;
        } else if(method==='PATCH' || method==='DELETE') {
          if(!filters.length) throw new Error('ต้องเลือกแถวก่อนแก้ไขหรือลบ');
          const changes=method==='PATCH'?JSON.parse(init.body || '{}'):null;
          const next=db[table].flatMap(r=>rows.includes(r)?(changes?[{...r,...changes}]:[]):[r]);
          rows=changes?rows.map(r=>({...r,...changes})):rows;
          storage.setItem(KEY,JSON.stringify({...db,[table]:next})); db[table]=next;
        } else if(!['GET','HEAD'].includes(method)) throw new Error('ไม่รองรับคำขอนี้');
        if(view) rows=rows.map(computed);
        const order=url.searchParams.get('order');
        if(order) {
          const [key,direction]=order.split('.');
          rows.sort((a,b)=>(a[key]>b[key]?1:a[key]<b[key]?-1:0)*(direction==='desc'?-1:1));
        }
        const count=rows.length, offset=Number(url.searchParams.get('offset')||0), limit=Number(url.searchParams.get('limit')||count);
        rows=rows.slice(offset,offset+limit);
        if(select && select!=='*') {
          if(select.includes('(')) throw new Error('พรีวิวยังไม่รองรับการเชื่อมตารางนี้');
          rows=rows.map(r=>Object.fromEntries(select.split(',').map(s=>{const [alias,field]=s.trim().split(':');return [alias,r[field||alias]??null];})));
        }
        const responseHeaders={'content-range':rows.length?`${offset}-${offset+rows.length-1}/${count}`:`*/${count}`};
        if(method==='HEAD') return new Response(null,{status:200,headers:responseHeaders});
        if(headers.get('accept')?.includes('vnd.pgrst.object')) {
          if(rows.length!==1) return json({code:'PGRST116',message:'Expected one row',details:`The result contains ${rows.length} rows`},406);
          return json(rows[0],200,responseHeaders);
        }
        return json(rows,200,responseHeaders);
      } catch(error) {return json({code:'PREVIEW_ONLY',message:error.message},400);}
    }
  };
}
