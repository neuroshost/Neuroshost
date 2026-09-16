import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { query } from "@/lib/db";
import { headers } from "next/headers";
import ClientShell from "@/components/ClientShell";
import CopyReferralButton from "@/components/CopyReferralButton";
export const dynamic = "force-dynamic";
export default async function Referral() {
  let s:any; try { s=await requireClient(); } catch { redirect("/client/login"); }
  let rows:any[]=[]; try { rows=await query<any[]>("SELECT referral_code,visitors,signups,reward_percent FROM affiliates WHERE user_id=? ORDER BY id DESC LIMIT 1",[Number(s.id)]); } catch {}
  let a=rows[0];
  if(!a){ const codeCandidate=`NH-${String(s.id).padStart(6,"0")}`; try { await query("INSERT INTO affiliates(user_id,referral_code) VALUES(?,?)",[Number(s.id),codeCandidate]); a={referral_code:codeCandidate,visitors:0,signups:0,reward_percent:10}; } catch {} }
  const code=a?.referral_code || `NH-${String(s.id).padStart(6,"0")}`;
  const h=await headers();
  const proto=h.get("x-forwarded-proto") || "https";
  const host=h.get("x-forwarded-host") || h.get("host") || "localhost";
  const link=`${proto}://${host}/client/register?ref=${encodeURIComponent(code)}`;
  return <ClientShell active="account"><div className="client-breadcrumb">Compte <span>›</span> Parrainage</div><div className="client-page-head"><div><h1>Parrainage</h1><p>Partagez votre lien et suivez les inscriptions générées.</p></div></div>
    <div className="client-referral-stats"><div className="client-stat-card"><strong>Visiteurs</strong><span>Nombre total de visiteurs</span><b>{a?.visitors ?? 0}</b></div><div className="client-stat-card"><strong>Inscriptions</strong><span>Nombre total d'inscriptions</span><b>{a?.signups ?? 0}</b></div><div className="client-stat-card"><strong>Revenus</strong><span>Revenus générés</span><b>0,00 €</b></div></div>
    <section className="client-panel client-referral-panel"><h2>Parrainage</h2><label>Votre lien de parrainage<div className="client-copy-row"><input className="input" readOnly value={link}/><CopyReferralButton value={link}/></div></label></section>
  </ClientShell>;
}
