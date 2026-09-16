import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";
export default async function CreateCancellation() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const services = await query<any[]>("SELECT s.id,s.name,u.email FROM services s LEFT JOIN users u ON u.id=s.user_id ORDER BY s.id DESC");
  return <AdminShell title="Créer Service Cancellation"><CancellationForm services={services}/></AdminShell>;
}

function CancellationForm({services, initial = {}}: {services:any[]; initial?:any}) {
  return <form className="form cancellation-form" action={initial.id ? `/api/admin/service-cancellations/${initial.id}` : "/api/admin/service-cancellations"} method="post">
    <div className="two"><label>Service<span className="required">*</span><select className="input" name="serviceId" defaultValue={String(initial.service_id ?? "")} required><option value="">Sélectionnez une option</option>{services.map(s=><option key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ""}</option>)}</select></label><label>Reason<input className="input" name="reason" defaultValue={initial.reason ?? ""}/></label></div>
    <label>Type<span className="required">*</span><select className="input cancellation-type" name="type" defaultValue={initial.type ?? "IMMEDIATE"} required><option value="IMMEDIATE">immediate</option><option value="END_OF_TERM">end of term</option><option value="SCHEDULED">scheduled</option></select></label>
    <div className="form-actions"><button className="btn primary">{initial.id ? "Enregistrer" : "Créer"}</button>{!initial.id&&<button className="btn" type="submit" name="createAnother" value="1">Créer &amp; Ajouter un autre</button>}<a className="btn" href="/admin/services/cancellations">Annuler</a></div>
  </form>;
}
