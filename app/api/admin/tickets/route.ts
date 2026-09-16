import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
export async function POST(req: NextRequest){
  const admin=await requireAdmin().catch(()=>null); if(!admin)return new NextResponse("Unauthorized",{status:401});
  const f=await req.formData(); const subject=String(f.get("subject")||"").trim(); const message=String(f.get("message")||"").trim();
  if(!subject||!message)return NextResponse.redirect(new URL("/admin/tickets/create?error=missing",req.url),303);
  const status=String(f.get("status")||"OPEN"); const priority=String(f.get("priority")||"MEDIUM");
  const allowedStatus=["OPEN","ANSWERED","CLOSED"], allowedPriority=["LOW","MEDIUM","HIGH","URGENT"];
  const userId=f.get("userId")?Number(f.get("userId")):null; const assignedTo=f.get("assignedTo")?Number(f.get("assignedTo")):null; const serviceId=f.get("serviceId")?Number(f.get("serviceId")):null;
  const r=await query<any>("INSERT INTO tickets(user_id,subject,status,priority,department,assigned_to,service_id) VALUES(?,?,?,?,?,?,?)",[userId,subject,allowedStatus.includes(status)?status:"OPEN",allowedPriority.includes(priority)?priority:"MEDIUM",String(f.get("department")||"")||null,assignedTo,serviceId]);
  await query("INSERT INTO ticket_messages(ticket_id,author_user_id,source,message) VALUES(?,?,'WEB',?)",[Number(r.insertId),Number(admin.id),message]);
  const target=f.get("continue")==="1"?"/admin/tickets/create":`/admin/tickets/${r.insertId}`;
  return NextResponse.redirect(new URL(target,req.url),303);
}
