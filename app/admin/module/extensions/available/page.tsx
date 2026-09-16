import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; type?: string }> };
function TypeBadge({ type }: { type: string }) { return <span className="extension-type-badge">{type === "THEME" ? "Theme" : type === "EXTENSION" ? "Extension" : type}</span>; }

export default async function AvailableExtensionsPage({ searchParams }: Props) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const params = await searchParams;
  const q = String(params.q || "").trim();
  const type = String(params.type || "ALL").toUpperCase();
  const allowed = new Set(["ALL", "EXTENSION", "THEME"]);
  const selectedType = allowed.has(type) ? type : "ALL";
  const where: string[] = ["e.id IS NULL"];
  const values: any[] = [];
  if (q) { where.push("(c.name LIKE ? OR c.description LIKE ? OR c.author LIKE ?)"); values.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  if (selectedType !== "ALL") { where.push("c.type=?"); values.push(selectedType); }
  const items = await query<any[]>(`SELECT c.* FROM extension_catalog c LEFT JOIN extensions e ON e.slug=c.slug WHERE ${where.join(" AND ")} ORDER BY c.featured DESC, c.name ASC`, values);
  const uploadable = await query<any[]>("SELECT * FROM extension_catalog WHERE slug NOT IN (SELECT slug FROM extensions) ORDER BY created_at DESC, name ASC");

  return <AdminShell title="Extension">
    <div className="extension-layout">
      <aside className="extension-subnav">
        <a href="/admin/module/extensions"><span>🧩</span> Extensions</a>
        <a className="active" href="/admin/module/extensions/available"><span>⇩</span> Available Extensions</a>
      </aside>
      <section className="extension-content">
        <div className="extension-tabs"><a className="active" href="#marketplace">Browse Marketplace</a><a href="#upload">Ready to Install / Upload</a></div>
        <form className="extension-market-head" id="marketplace" method="get">
          <input className="input extension-search" name="q" defaultValue={q} placeholder="⌕  Search extensions by name..." />
          <div className="extension-filters">
            <a className={`filter-pill ${selectedType === "ALL" ? "active" : ""}`} href="/admin/module/extensions/available">All</a>
            <a className={`filter-pill ${selectedType === "EXTENSION" ? "active" : ""}`} href="/admin/module/extensions/available?type=EXTENSION">Extensions</a>
            <a className={`filter-pill ${selectedType === "THEME" ? "active" : ""}`} href="/admin/module/extensions/available?type=THEME">Themes</a>
          </div>
        </form>
        <div className="extension-grid">
          {items.map((item) => <article className="extension-card" key={item.id}>
            <div className="extension-cover">{item.icon_url ? <img src={item.icon_url} alt=""/> : <div className="extension-cover-mark">{item.type === "THEME" ? "◈" : "🧩"}</div>}<TypeBadge type={item.type}/></div>
            <div className="extension-card-body"><h3>{item.name}</h3><p className="muted small">By {item.author || "Community"}</p><p className="extension-description">{item.description}</p><div className="extension-card-meta"><span>★ {Number(item.rating).toFixed(1)} ({item.reviews})</span><span>⇩ {item.downloads}</span><strong>{Number(item.price) === 0 ? "Free" : `${Number(item.price).toFixed(2)} ${item.currency}`}</strong></div><form action="/api/admin/extensions/install" method="post" className="extension-install-form"><input type="hidden" name="catalogId" value={item.id}/><button className="btn primary extension-install-btn">Install</button></form></div>
          </article>)}
        </div>
        {!items.length && <div className="empty"><span className="empty-icon">×</span>Aucune extension disponible</div>}

        <div className="extension-upload-panel" id="upload">
          <div><h2>Ready to Install / Upload</h2><p className="muted">Liste des extensions disponibles localement et import d'un nouveau package.</p></div>
          <div className="extension-ready-list">
            {uploadable.map(item => <div className="extension-ready-row" key={item.id}><div><strong>{item.name}</strong><span className="muted"> · v{item.version}</span><p className="muted small">{item.description}</p></div><form action="/api/admin/extensions/install" method="post"><input type="hidden" name="catalogId" value={item.id}/><button className="action-link extension-install-link">Install</button></form></div>)}
            {!uploadable.length && <div className="empty">Aucune extension prête à être installée.</div>}
          </div>
          <form className="extension-upload-form" action="/api/admin/extensions/upload" method="post" encType="multipart/form-data">
            <div className="two"><label>Name*<input className="input" name="name" required placeholder="WhatsAppNotifications"/></label><label>Version*<input className="input" name="version" defaultValue="1.0.0" required/></label></div>
            <div className="two"><label>Type*<select className="input" name="type" defaultValue="EXTENSION"><option value="EXTENSION">Extension</option><option value="THEME">Theme</option><option value="GATEWAY">Gateway</option><option value="SERVER">Server</option><option value="OTHER">Other</option></select></label><label>Slug*<input className="input" name="slug" required placeholder="whatsapp-notifications"/></label></div>
            <label>Description<textarea className="input" name="description" placeholder="Description de l'extension..."/></label>
            <label>Package (.zip / .json)<input className="input" type="file" name="package" accept=".zip,.json"/></label>
            <button className="btn primary">Upload Extension</button>
          </form>
        </div>
      </section>
    </div>
  </AdminShell>;
}
