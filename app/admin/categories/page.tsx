import {redirect} from "next/navigation";
import {requireAdmin} from "@/lib/auth";
import {query} from "@/lib/db";
import AdminShell from "@/components/AdminShell";
export const dynamic="force-dynamic";
export default async function Categories(){try{await requireAdmin()}catch{redirect("/admin/login")}
 const rows=await query<any[]>("SELECT c.*, p.name parent_name FROM categories c LEFT JOIN categories p ON p.id=c.parent_category_id ORDER BY c.sort_order,c.name");
 return <AdminShell title="Categories"><div className="page-head"><div/><a className="btn primary" href="/admin/categories/create">Créer</a></div><div className="card module-table-card"><div className="toolbar-card"><input className="input search-input" placeholder="Rechercher"/></div><table className="table admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Parent</th><th></th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.slug}</td><td><span className="html-mini">HTML</span> {r.description?"Configurée":"—"}</td><td>{r.parent_name||"—"}</td><td className="action-cell"><a className="action-link" href={`/admin/categories/${r.id}`}>✎ Modifier</a></td></tr>)}</tbody></table>{!rows.length&&<div className="empty">Aucune catégorie</div>}<div className="table-footer">Affichage de {rows.length} résultat{rows.length>1?"s":""}<span className="page-size">par page　10⌄</span></div></div></AdminShell>}
