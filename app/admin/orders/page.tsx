import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth"; import { query } from "@/lib/db"; import AdminShell from "@/components/AdminShell";
export const dynamic="force-dynamic";
export default async function Orders(){
 try{await requireAdmin()}catch{redirect("/admin/login")}
 const rows=await query<any[]>("SELECT o.*,u.name user_name FROM orders o LEFT JOIN users u ON u.id=o.user_id ORDER BY o.id DESC");
 return <AdminShell title="Orders"><div className="subnav"><a className="active" href="/admin/orders">Orders</a></div>
 <div className="toolbar-card"><input className="input search-input" placeholder="🔍  Rechercher"/></div>
 <div className="card table-card"><table className="table admin-table"><thead><tr><th>□</th><th>ID ↕</th><th>User</th><th>Currency ↕</th><th>Total</th><th>Updated At ↕</th><th></th></tr></thead><tbody>
 {rows.length?rows.map(r=><tr key={r.id}><td>□</td><td>{r.id}</td><td>{r.user_name||"—"}</td><td>{r.currency}</td><td>{Number(r.total).toFixed(2)} {r.currency}</td><td>{new Date(r.updated_at||r.created_at).toLocaleString("fr-FR")}</td><td><a className="action-link" href={`/admin/orders/${r.id}`}>✎ Modifier</a></td></tr>):<tr><td colSpan={7}><div className="empty">Aucune commande.</div></td></tr>}</tbody></table><div className="table-footer"><span>Affichage de 1 à {rows.length} sur {rows.length} résultats</span><span className="page-size">par page　10　⌄</span></div></div>
 <a className="floating-create btn primary" href="/admin/orders/create">Créer</a></AdminShell>
}