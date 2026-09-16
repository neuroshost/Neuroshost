import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function TypeBadge({ type }: { type: string }) {
  return <span className="extension-type-badge">{type === "THEME" ? "Theme" : type === "EXTENSION" ? "Extension" : type}</span>;
}

export default async function ExtensionsPage() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const installed = await query<any[]>("SELECT * FROM extensions ORDER BY name ASC");
  const available = await query<any[]>("SELECT c.* FROM extension_catalog c LEFT JOIN extensions e ON e.slug=c.slug WHERE e.id IS NULL ORDER BY c.featured DESC, c.name ASC");

  return <AdminShell title="Extensions">
    <div className="extension-layout">
      <aside className="extension-subnav">
        <a className="active" href="/admin/module/extensions"><span>🧩</span> Extensions</a>
        <a href="/admin/module/extensions/available"><span>⇩</span> Available Extensions</a>
      </aside>
      <section className="extension-content">
        <div className="extension-toolbar-top">
          <div className="extension-breadcrumb">Extensions <span>›</span> Liste</div>
          <a className="btn primary" href="/admin/module/extensions/available">Install Extension</a>
        </div>
        <div className="card module-table-card extension-list-card">
          <div className="toolbar-card"><input className="input search-input" placeholder="Rechercher" /></div>
          <table className="table admin-table extension-table"><thead><tr><th>Name</th><th>Type</th><th>Enabled</th><th></th></tr></thead>
          <tbody>{installed.map((item) => <tr key={item.id}>
            <td><strong>{item.name}</strong><div className="muted small">v{item.version}</div></td>
            <td><TypeBadge type={item.type}/></td>
            <td><span className={item.enabled ? "enabled-dot" : "disabled-dot"}>{item.enabled ? "✓" : "×"}</span></td>
            <td className="action-cell"><a className="action-link" href={`/admin/module/extensions/${item.id}`}>✎ Modifier</a></td>
          </tr>)}</tbody></table>
          {!installed.length && <div className="empty"><span className="empty-icon">×</span>Aucun(e) extension</div>}
          <div className="table-footer">Affichage de {installed.length} résultat{installed.length > 1 ? "s" : ""}<span className="page-size">par page　10⌄</span></div>
        </div>
      </section>
    </div>
  </AdminShell>;
}
