import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getRuntimeConfig } from "@/lib/runtime";
function secret(){return new TextEncoder().encode(getRuntimeConfig().appSecret)}
export async function createSession(user:{id:number;email:string;role:string}){
  const token=await new SignJWT(user).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("12h").sign(secret());
  const c=await cookies(); c.set("nh_session",token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:43200});
}
export async function readSession(){
  try{ const c=await cookies(); const token=c.get("nh_session")?.value; if(!token)return null; const {payload}=await jwtVerify(token,secret()); return payload as any; }catch{return null}
}
export async function requireAdmin(){ const s=await readSession(); if(!s || !["SUPER_ADMIN","ADMIN"].includes(s.role)) throw new Error("UNAUTHORIZED"); return s; }
export async function requireClient(){ const s=await readSession(); if(!s || !["CLIENT","STAFF","ADMIN","SUPER_ADMIN"].includes(s.role)) throw new Error("UNAUTHORIZED"); return s; }
