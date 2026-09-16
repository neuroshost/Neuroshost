import crypto from "node:crypto";
import { getRuntimeConfig } from "@/lib/runtime";
function key(){ return crypto.createHash("sha256").update(getRuntimeConfig().appSecret).digest(); }
export function encrypt(value:string){
  if(!value) return "";
  const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv("aes-256-gcm",key(),iv);
  const encrypted=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]); const tag=cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}
export function decrypt(value:string){
  if(!value?.startsWith("enc:v1:")) return value || "";
  const [, , ivB, tagB, dataB]=value.split(":");
  const decipher=crypto.createDecipheriv("aes-256-gcm",key(),Buffer.from(ivB,"base64")); decipher.setAuthTag(Buffer.from(tagB,"base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB,"base64")),decipher.final()]).toString("utf8");
}
