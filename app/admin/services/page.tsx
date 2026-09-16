import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

const statusClass: Record<string, string> = { ACTIVE: "service-status active", CANCELLED: "service-status cancelled", SUSPENDED: "service-status suspended", TERMINATED: "service-status terminated", PENDING: "service-status pending" };

export default async function Services() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const rows = await query<any[]>(`SELECT s.*, u.name user_name, u.email user_email, p.name product_name, pp.name plan_name
    FROM services s
    LEFT JOIN users u ON u.id=s.user_id
    LEFT JOIN products p ON p.id=s.product_id
    LEFT JOIN product_plans pp ON pp.id=s.plan_id
    ORDER BY s.id DESC`);

  return <AdminShell title="Services">
    <a className="floating-create btn primary" href="/admin/services/create">Créer</a>
    <div className="service-subnav"><a className="active" href="/admin/services"><span className="service-subnav-icon">▦</span>Services</a><a href="/admin/services/cancellations"><span className="service-subnav-icon">▱</span>Service Cancellations</a></div>
    <div className="toolbar-card"><input className="input search-input" placeholder="⌕  Rechercher"/><span className="filter-icon">▤</span></div>
    <div className="card table-card service-table-card"><table className="table admin-table"><thead><tr><th>□</th><th>ID　⌄</th><th>User</th><th>Product　⌄</th><th>Status　⌄</th><th>Expires At　⌄</th><th></th></tr></thead><tbody>
      {rows.length ? rows.map(r => <tr key={r.id}><td>□</td><td>{r.id}</td><td>{r.user_name || "—"}</td><td>{r.product_name || "—"}{r.plan_name ? <small className="service-plan">{r.plan_name}</small> : null}</td><td><span className={statusClass[r.status] || "service-status"}>{r.status === "ACTIVE" ? "Active" : r.status === "CANCELLED" ? "Cancelled" : r.status.charAt(0)+r.status.slice(1).toLowerCase()}</span></td><td>{r.expires_at ? new Date(r.expires_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : r.renew_at ? new Date(r.renew_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td><td><a className="action-link" href={`/admin/services/${r.id}`}>✎ Modifier</a></td></tr>) : <tr><td colSpan={7}><div className="empty">Aucun service pour le moment.</div></td></tr>}
    </tbody></table><div className="table-footer"><span>Affichage de 1 à {rows.length} sur {rows.length} résultats</span><span className="page-size">par page　10　⌄</span></div></div>
  </AdminShell>;
}
