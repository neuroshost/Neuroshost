import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f=await req.formData(); const serviceId=Number(f.get("serviceId")); const reason=String(f.get("reason")||"").trim()||null; const type=String(f.get("type")||"IMMEDIATE");
  if(!serviceId)return new NextResponse("Service is required",{status:400});
  const [result]=await query<any[]>("INSERT INTO service_cancellations(service_id,reason,type) VALUES(?,?,?)",[serviceId,reason,type]);
  if(type==="IMMEDIATE") await query("UPDATE services SET status='TERMINATED' WHERE id=?",[serviceId]);
  const another=String(f.get("createAnother")||"")==="1";
  return NextResponse.redirect(new URL(another?"/admin/services/cancellations":`/admin/services/cancellations/${result.insertId}`,req.url),303);
}
