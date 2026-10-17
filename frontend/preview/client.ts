import { createClient } from '@supabase/supabase-js';
import { createDatabase, UID } from './database.mjs';
export const database = createDatabase(localStorage);
export const supabaseConfig = { url:'https://env-preview.invalid',anonKey:'synthetic-preview-key' };
const session = {access_token:'synthetic-preview-token',refresh_token:'synthetic-preview-refresh',token_type:'bearer',expires_in:86400,expires_at:Math.floor(Date.now()/1000)+86400,user:{id:UID,aud:'authenticated',email:'demo@example.test',app_metadata:{provider:'email'},user_metadata:{full_name:'ผู้ทดลอง ENV'},created_at:new Date().toISOString()}};
localStorage.setItem('env-preview-auth',JSON.stringify(session));
export const supabase = createClient(supabaseConfig.url,supabaseConfig.anonKey,{
  auth:{storageKey:'env-preview-auth',autoRefreshToken:false,persistSession:true,detectSessionInUrl:false},
  global:{fetch:database.fetch},
});
// Never create a real websocket or claim live sensor connectivity.
supabase.channel = (()=>{const channel={on:()=>channel,subscribe:(cb?: (s:string)=>void)=>{queueMicrotask(()=>cb?.('CHANNEL_ERROR'));return channel;},unsubscribe:async()=> 'ok'};return channel;}) as unknown as typeof supabase.channel;
supabase.removeChannel = async()=> 'ok';
