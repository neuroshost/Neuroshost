import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/auth";
import { query } from "@/lib/db";
export async function POST(req:NextRequest){const s=await requireClient().catch(()=>null);if(!s)return new NextResponse("Unauthorized",{status:401});const f=await req.formData();const first=String(f.get("first_name")||"").trim();const last=String(f.get("last_name")||"").trim();const email=String(f.get("email")||"").trim();if(!first||!email)return NextResponse.redirect(new URL("/client/account?error=missing",req.url),303);await query("UPDATE users SET name=?,email=? WHERE id=?",[[first,last].filter(Boolean).join(" "),email,Number(s.id)]);return NextResponse.redirect(new URL("/client/account?saved=1",req.url),303)}
