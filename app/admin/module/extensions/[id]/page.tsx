import { redirect, notFound } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExtensionEditPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const { id } = await params;
  const rows = await query<any[]>("SELECT * FROM extensions WHERE id=?", [Number(id)]);
  if (!rows[0]) notFound();
  const e = rows[0];
  return <AdminShell title="Modifier Extension"><div className="module-form single-panel"><div className="form-tab">Extension</div><div className="editor-body">
    <div className="extension-edit-header"><div className="extension-cover small-cover"><div className="extension-cover-mark">🧩</div></div><div><h2>{e.name}</h2><p className="muted">{e.slug} · v{e.version}</p></div></div>
    <form action={`/api/admin/extensions/${e.id}`} method="post" className="module-form">
      <label>Name<input className="input" name="name" defaultValue={e.name} required/></label>
      <div className="two"><label>Version<input className="input" name="version" defaultValue={e.version} required/></label><label>Type<select className="input" name="type" defaultValue={e.type}><option value="EXTENSION">Extension</option><option value="THEME">Theme</option><option value="GATEWAY">Gateway</option><option value="SERVER">Server</option><option value="OTHER">Other</option></select></label></div>
      <label>Author<input className="input" name="author" defaultValue={e.author || ""}/></label>
      <label>Description<textarea className="input" name="description" defaultValue={e.description || ""}/></label>
      <label>Icon URL<input className="input" name="iconUrl" defaultValue={e.icon_url || ""}/></label>
      <label className="checkline"><input type="checkbox" name="enabled" value="1" defaultChecked={!!e.enabled}/> Enabled</label>
      <div className="form-actions"><button className="btn primary">Enregistrer</button><a className="btn" href="/admin/module/extensions">Annuler</a></div>
    </form>
  </div></div></AdminShell>;
}
