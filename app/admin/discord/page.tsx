import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import AdminShell from "@/components/AdminShell";
export const dynamic = "force-dynamic";
export default async function Discord() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const s = await getSettings();
  return <AdminShell title="Discord">
    <div className="notice" style={{marginBottom:18}}>Le bot utilise cette configuration pour les rôles Clients, les tickets Discord ↔ Web et les commandes slash.</div>
    <div className="card"><form className="form" action="/api/admin/discord" method="post">
      <label>Activer le bot<select className="input" name="discord_enabled" defaultValue={s.discord_enabled||"0"}><option value="0">Non</option><option value="1">Oui</option></select></label>
      <label>Bot Token<input className="input" type="password" name="discord_bot_token" placeholder={s.discord_bot_token?"Token déjà enregistré — laisser vide pour conserver":"Colle le token ici"}/></label>
      <div className="two"><label>Application / Client ID<input className="input" name="discord_client_id" defaultValue={s.discord_client_id||""}/></label><label>Guild / Server ID<input className="input" name="discord_guild_id" defaultValue={s.discord_guild_id||""}/></label></div>
      <div className="two"><label>ID du rôle Client<input className="input" name="discord_client_role_id" defaultValue={s.discord_client_role_id||""} placeholder="123456789012345678"/><span className="muted small">Le bot attribue ce rôle aux utilisateurs CLIENT liés à Discord.</span></label><label>ID du rôle Support<input className="input" name="discord_ticket_support_role_id" defaultValue={s.discord_ticket_support_role_id||""} placeholder="123456789012345678"/></label></div>
      <div className="two"><label>ID de la catégorie Tickets<input className="input" name="discord_ticket_category_id" defaultValue={s.discord_ticket_category_id||""} placeholder="123456789012345678"/></label><label>Salon de logs ID<input className="input" name="discord_log_channel_id" defaultValue={s.discord_log_channel_id||""}/></label></div>
      <div className="notice">Pour la réception des messages dans les tickets, active également <strong>Message Content Intent</strong> dans le portail développeur Discord et donne au bot <strong>Manage Channels</strong>, <strong>Manage Roles</strong> et les permissions de lecture/envoi nécessaires.</div>
      <button className="btn primary">Enregistrer Discord</button>
    </form></div>
  </AdminShell>
}
