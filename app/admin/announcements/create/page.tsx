import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getDiscordGuildRoles } from "@/lib/discord-server";
import AdminShell from "@/components/AdminShell";
import HtmlEditor from "@/components/HtmlEditor";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreateAnnouncement() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }

  const discordRoles = await getDiscordGuildRoles();

  return (
    <AdminShell title="Créer Announcement">
      <form className="announcement-form" action="/api/admin/announcements" method="post">
        <div className="two">
          <label>Title*<input className="input" name="title" placeholder="Enter the title of the announcement" required /></label>
          <label>Slug*<input className="input" name="slug" placeholder="Enter the slug of the announcement" required /></label>
        </div>

        <div className="two">
          <label>Description <span className="muted">(optionnel)</span>
            <HtmlEditor name="description" placeholder="Short description..." minHeight={130} required={false} />
          </label>
          <label>Published At*<input className="input" type="datetime-local" name="publishedAt" required /></label>
        </div>

        <label className="checkline"><input type="checkbox" name="isPublished" value="1" /> Is Published</label>

        <label>Rôles à mentionner sur Discord <span className="muted">(Ctrl/Cmd + clic pour plusieurs)</span>
          <select className="input" name="discordRoleIds" multiple size={Math.min(10, Math.max(4, discordRoles.length || 4))}>
            {discordRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.id}</option>
            ))}
          </select>
          {discordRoles.length === 0
            ? <span className="muted small">Aucun rôle récupéré. Vérifie le Bot Token et l'ID du serveur Discord dans Settings.</span>
            : <span className="muted small">Les rôles sont récupérés directement depuis le serveur Discord configuré. Les rôles gérés par une intégration sont masqués.</span>}
        </label>

        <label>Webhook Discord <span className="muted">(optionnel)</span>
          <input className="input" type="url" name="discordWebhook" placeholder="https://discord.com/api/webhooks/..." />
          <span className="muted small">Le webhook est chiffré en base de données. Il sera utilisé pour publier l'embed de l'annonce.</span>
        </label>

        <label className="checkline"><input type="checkbox" name="sendDiscord" value="1" defaultChecked /> Envoyer automatiquement l'annonce sur Discord à la création</label>

        <label>Content*<HtmlEditor name="content" placeholder="Enter the content of the announcement..." minHeight={330} /></label>

        <div className="form-actions">
          <button className="btn primary">Créer</button>
          <button className="btn" type="submit" name="continue" value="1">Créer &amp; Ajouter un autre</button>
          <a className="btn" href="/admin/announcements">Annuler</a>
        </div>
      </form>
    </AdminShell>
  );
}
