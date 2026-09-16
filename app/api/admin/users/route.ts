import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
export async function POST(req:NextRequest){
 const admin=await requireAdmin().catch(()=>null); if(!admin)return new NextResponse("Unauthorized",{status:401});
 const f=await req.formData(); const first=String(f.get("firstName")||"").trim(); const last=String(f.get("lastName")||"").trim(); const email=String(f.get("email")||"").trim().toLowerCase(); const password=String(f.get("password")||""); const role=String(f.get("role")||"CLIENT");
 if(!first||!last||!email||password.length<8)return NextResponse.redirect(new URL("/admin/customers/create?error=invalid",req.url),303);
 const roles=["SUPER_ADMIN","ADMIN","STAFF","CLIENT"]; const safeRole=roles.includes(role)?role:"CLIENT";
 const hash=await bcrypt.hash(password,12); await query("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",[`${first} ${last}`,email,hash,safeRole]);
 const target=f.get("continue")==="1"?"/admin/customers/create":"/admin/customers"; return NextResponse.redirect(new URL(target,req.url),303);
}
