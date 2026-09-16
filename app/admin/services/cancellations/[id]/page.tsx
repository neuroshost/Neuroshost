import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";
export default async function EditCancellation({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const { id } = await params;
  const rows = await query<any[]>("SELECT * FROM service_cancellations WHERE id=? LIMIT 1", [Number(id)]);
  if (!rows[0]) notFound();
  const services = await query<any[]>("SELECT s.id,s.name,u.email FROM services s LEFT JOIN users u ON u.id=s.user_id ORDER BY s.id DESC");
  return <AdminShell title={`Modifier Service Cancellation #${id}`}><form className="form cancellation-form" action={`/api/admin/service-cancellations/${id}`} method="post"><div className="two"><label>Service<span className="required">*</span><select className="input" name="serviceId" defaultValue={String(rows[0].service_id)} required><option value="">Sélectionnez une option</option>{services.map(s=><option key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ""}</option>)}</select></label><label>Reason<input className="input" name="reason" defaultValue={rows[0].reason ?? ""}/></label></div><label>Type<span className="required">*</span><select className="input" name="type" defaultValue={rows[0].type} required><option value="IMMEDIATE">immediate</option><option value="END_OF_TERM">end of term</option><option value="SCHEDULED">scheduled</option></select></label><div className="form-actions"><button className="btn primary">Enregistrer</button><a className="btn" href="/admin/services/cancellations">Annuler</a></div></form></AdminShell>;
}
