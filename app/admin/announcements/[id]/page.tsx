import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { getDiscordGuildRoles } from "@/lib/discord-server";
import AdminShell from "@/components/AdminShell";
import HtmlEditor from "@/components/HtmlEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditAnnouncement({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }

  const { id } = await params;
  const rows = await query<any[]>("SELECT * FROM announcements WHERE id=?", [Number(id)]);
  const a = rows[0];
  if (!a) notFound();

  const discordRoles = await getDiscordGuildRoles();
  let selectedRoleIds: string[] = [];
  try {
    const parsed = a.discord_role_ids ? JSON.parse(String(a.discord_role_ids)) : [];
    if (Array.isArray(parsed)) selectedRoleIds = parsed.map(String).filter((value) => /^\d{15,25}$/.test(value));
  } catch { selectedRoleIds = []; }

  return (
    <AdminShell title={`Modifier Announcement #${a.id}`}>
      <form className="announcement-form" action={`/api/admin/announcements/${a.id}`} method="post">
        <div className="two">
          <label>Title*<input className="input" name="title" defaultValue={a.title} required /></label>
          <label>Slug*<input className="input" name="slug" defaultValue={a.slug} required /></label>
        </div>

        <div className="two">
          <label>Description <span className="muted">(optionnel)</span>
            <HtmlEditor name="description" defaultValue={a.description || ""} minHeight={130} required={false} />
          </label>
          <label>Published At*<input className="input" type="datetime-local" name="publishedAt" defaultValue={a.published_at ? new Date(a.published_at).toISOString().slice(0, 16) : ""} /></label>
        </div>

        <label className="checkline"><input type="checkbox" name="isPublished" value="1" defaultChecked={a.is_published === 1} /> Is Published</label>

        <label>Rôles à mentionner sur Discord <span className="muted">(Ctrl/Cmd + clic pour plusieurs)</span>
          <select className="input" name="discordRoleIds" multiple size={Math.min(10, Math.max(4, discordRoles.length || 4))} defaultValue={selectedRoleIds}>
            {discordRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.id}</option>
            ))}
          </select>
          {discordRoles.length === 0
            ? <span className="muted small">Aucun rôle récupéré. Vérifie le Bot Token et l'ID du serveur Discord dans Settings.</span>
            : <span className="muted small">Les rôles enregistrés pour cette annonce sont présélectionnés.</span>}
        </label>

        <label>Webhook Discord <span className="muted">(laisser vide pour conserver celui existant)</span>
          <input className="input" type="url" name="discordWebhook" placeholder={a.discord_webhook_url ? "Webhook déjà configuré — saisir une nouvelle URL pour le remplacer" : "https://discord.com/api/webhooks/..."} />
        </label>

        <label className="checkline"><input type="checkbox" name="sendDiscord" value="1" /> Envoyer la modification sur Discord après l'enregistrement</label>

        <label>Content*<HtmlEditor name="content" defaultValue={a.content || ""} minHeight={330} /></label>

        <div className="form-actions">
          <button className="btn primary">Enregistrer</button>
          <a className="btn" href="/admin/announcements">Annuler</a>
        </div>
      </form>
    </AdminShell>
  );
}
