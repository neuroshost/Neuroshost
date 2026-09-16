import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function ServiceCancellations() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const rows = await query<any[]>(`SELECT sc.*, s.name service_name, s.id service_id, u.email user_email
    FROM service_cancellations sc
    LEFT JOIN services s ON s.id=sc.service_id
    LEFT JOIN users u ON u.id=s.user_id
    ORDER BY sc.id DESC`);
  return <AdminShell title="Service Cancellations">
    <a className="floating-create btn primary" href="/admin/services/cancellations/create">Créer</a>
    <div className="service-subnav"><a href="/admin/services"><span className="service-subnav-icon">▦</span>Services</a><a className="active" href="/admin/services/cancellations"><span className="service-subnav-icon">▱</span>Service Cancellations</a></div>
    <div className="toolbar-card"><input className="input search-input" placeholder="⌕  Rechercher"/><span className="filter-icon">▤</span></div>
    <div className="card table-card service-table-card"><table className="table admin-table"><thead><tr><th>□</th><th>Service id　⌄</th><th>Reason</th><th>Type</th><th></th></tr></thead><tbody>
      {rows.length ? rows.map(r => <tr key={r.id}><td>□</td><td>{r.service_name || `Service #${r.service_id}`} {r.user_email ? <small className="service-plan">({r.user_email})</small> : null}</td><td>{r.reason || "—"}</td><td>{r.type.toLowerCase().replaceAll("_", " ")}</td><td><a className="action-link" href={`/admin/services/cancellations/${r.id}`}>✎ Modifier</a></td></tr>) : <tr><td colSpan={5}><div className="empty">Aucune annulation de service.</div></td></tr>}
    </tbody></table><div className="table-footer"><span>Affichage de 1 à {rows.length} sur {rows.length} résultats</span><span className="page-size">par page　10　⌄</span></div></div>
  </AdminShell>;
}
