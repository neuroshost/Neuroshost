import {NextRequest,NextResponse} from "next/server";
import {requireAdmin} from "@/lib/auth";
import {query} from "@/lib/db";
import {encrypt,decrypt} from "@/lib/crypto";
import {sendAnnouncementToDiscord,validateDiscordWebhook} from "@/lib/announcement-discord";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const admin=await requireAdmin().catch(()=>null);if(!admin)return new NextResponse("Unauthorized",{status:401});
 const {id}=await params;const numericId=Number(id);const f=await req.formData();
 if(f.get("_action")==="delete"){await query("DELETE FROM announcements WHERE id=?",[numericId]);return NextResponse.redirect(new URL("/admin/announcements",req.url),303)}
 const existing=await query<any[]>("SELECT * FROM announcements WHERE id=? LIMIT 1",[numericId]);
 const current=existing[0];if(!current)return new NextResponse("Not found",{status:404});
 const title=String(f.get("title")||"").trim();const slug=String(f.get("slug")||"").trim();const description=String(f.get("description")||"").trim()||null;const content=String(f.get("content")||"");
 const raw=String(f.get("publishedAt")||"");const publishedAt=raw?raw.replace("T"," ")+(raw.length===16?":00":""):null;
 const webhookInput=String(f.get("discordWebhook")||"").trim();
 const roleIds=f.getAll("discordRoleIds").map(String).filter(id=>/^\d{15,25}$/.test(id)).slice(0,20);
 if(webhookInput && !validateDiscordWebhook(webhookInput)) return NextResponse.redirect(new URL(`/admin/announcements/${id}?error=webhook`,req.url),303);
 const webhook=webhookInput || (current.discord_webhook_url ? decrypt(String(current.discord_webhook_url)) : "");
 const sendDiscord=f.get("sendDiscord")==="1" && !!webhook;
 await query("UPDATE announcements SET title=?,slug=?,description=?,published_at=?,is_published=?,content=?,discord_webhook_url=?,discord_webhook_enabled=?,discord_role_ids=? WHERE id=?",[title,slug,description,publishedAt,f.get("isPublished")==="1"?1:0,content,webhookInput?encrypt(webhookInput):current.discord_webhook_url||null,sendDiscord?1:Number(current.discord_webhook_enabled||0),JSON.stringify(roleIds),numericId]);
 let status="none";
 if(sendDiscord){try{await sendAnnouncementToDiscord({webhook,title,url:new URL(`/announcements/${slug}`,req.url).toString(),roleIds});await query("UPDATE announcements SET discord_last_status='SENT',discord_last_error=NULL,discord_sent_at=NOW() WHERE id=?",[numericId]);status="sent"}catch(error){const message=error instanceof Error?error.message:"Erreur Discord inconnue";await query("UPDATE announcements SET discord_last_status='FAILED',discord_last_error=? WHERE id=?",[message,numericId]);status="error"}}
 return NextResponse.redirect(new URL(`/admin/announcements/${id}?discord=${status}`,req.url),303);
}
