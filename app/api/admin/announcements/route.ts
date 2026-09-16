import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { sendAnnouncementToDiscord, validateDiscordWebhook } from "@/lib/announcement-discord";
function slugify(v:string){return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,180)}
export async function POST(req:NextRequest){
 const admin=await requireAdmin().catch(()=>null);if(!admin)return new NextResponse("Unauthorized",{status:401});
 const f=await req.formData();const title=String(f.get("title")||"").trim();const slug=slugify(String(f.get("slug")||title));const content=String(f.get("content")||"").trim();
 if(!title||!slug||!content)return NextResponse.redirect(new URL("/admin/announcements/create?error=missing",req.url),303);
 const rawDate=String(f.get("publishedAt")||"").trim();const publishedAt=rawDate?rawDate.replace("T"," ")+ (rawDate.length===16?":00":""):null;
 const webhook=String(f.get("discordWebhook")||"").trim();
 const roleIds=f.getAll("discordRoleIds").map(String).filter(id=>/^\d{15,25}$/.test(id)).slice(0,20);
 if(webhook && !validateDiscordWebhook(webhook)) return NextResponse.redirect(new URL("/admin/announcements/create?error=webhook",req.url),303);
 const sendDiscord=f.get("sendDiscord")==="1" && !!webhook;
 const result=await query<any>("INSERT INTO announcements(title,slug,description,published_at,is_published,content,discord_webhook_url,discord_webhook_enabled,discord_role_ids) VALUES(?,?,?,?,?,?,?,?,?)",[title,slug,String(f.get("description")||"").trim()||null,publishedAt,f.get("isPublished")==="1"?1:0,content,webhook?encrypt(webhook):null,sendDiscord?1:0,JSON.stringify(roleIds)]);
 const id=Number(result?.insertId||0);
 let discordStatus="none";
 if(sendDiscord && id){
   try { await sendAnnouncementToDiscord({webhook,title,url:new URL(`/announcements/${slug}`,req.url).toString(),roleIds}); await query("UPDATE announcements SET discord_last_status='SENT',discord_last_error=NULL,discord_sent_at=NOW() WHERE id=?",[id]); discordStatus="sent"; }
   catch(error){ const message=error instanceof Error?error.message:"Erreur Discord inconnue"; await query("UPDATE announcements SET discord_last_status='FAILED',discord_last_error=? WHERE id=?",[message,id]); discordStatus="error"; }
 }
 const target=f.get("continue")==="1"?"/admin/announcements/create":"/admin/announcements";
 return NextResponse.redirect(new URL(`${target}?discord=${discordStatus}`,req.url),303);
}
