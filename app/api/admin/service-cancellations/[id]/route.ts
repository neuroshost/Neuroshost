import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
export async function POST(req: NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin()}catch{return new NextResponse("Unauthorized",{status:401})}
  const {id}=await params; const f=await req.formData(); const serviceId=Number(f.get("serviceId")); const reason=String(f.get("reason")||"").trim()||null; const type=String(f.get("type")||"IMMEDIATE");
  if(!serviceId)return new NextResponse("Service is required",{status:400});
  await query("UPDATE service_cancellations SET service_id=?,reason=?,type=? WHERE id=?",[serviceId,reason,type,Number(id)]);
  if(type==="IMMEDIATE") await query("UPDATE services SET status='TERMINATED' WHERE id=?",[serviceId]);
  return NextResponse.redirect(new URL("/admin/services/cancellations",req.url),303);
}
