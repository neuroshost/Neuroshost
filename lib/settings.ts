import { query } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
export async function getSettings(){
  const rows=await query<any[]>("SELECT setting_key, setting_value, is_secret FROM settings");
  return Object.fromEntries(rows.map(r=>[r.setting_key, r.is_secret ? decrypt(r.setting_value) : r.setting_value]));
}
export async function getPublicSettings(): Promise<Record<string, string>>{
  const rows=await query<any[]>("SELECT setting_key, setting_value FROM settings WHERE is_public=1");
  return Object.fromEntries(rows.map(r=>[r.setting_key,r.setting_value]));
}
export async function setSetting(key:string,value:string,{secret=false,publicValue=false}:{secret?:boolean;publicValue?:boolean}={}){
  const stored=secret?encrypt(value):value;
  await query("INSERT INTO settings(setting_key,setting_value,is_secret,is_public) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),is_secret=VALUES(is_secret),is_public=VALUES(is_public)",[key,stored,secret?1:0,publicValue?1:0]);
}
