import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import HtmlEditor from "@/components/HtmlEditor";
export const dynamic = "force-dynamic";

export default async function CreateTicket() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const users = await query<any[]>("SELECT id,name,email FROM users ORDER BY name");
  const services = await query<any[]>("SELECT id,name FROM services ORDER BY name");
  const staff = await query<any[]>("SELECT id,name,email FROM users WHERE role IN ('SUPER_ADMIN','ADMIN','STAFF') ORDER BY name");
  return <AdminShell title="Créer Ticket">
    <form className="ticket-create-form" action="/api/admin/tickets" method="post">
      <div className="two">
        <label>Subject*<input className="input" name="subject" maxLength={191} placeholder="Enter the subject" required /></label>
        <label>Status*<select className="input" name="status" defaultValue="OPEN"><option value="OPEN">Open</option><option value="ANSWERED">Answered</option><option value="CLOSED">Closed</option></select></label>
      </div>
      <div className="two">
        <label>Priority*<select className="input" name="priority" defaultValue="MEDIUM"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        <label>Department<select className="input" name="department"><option value="">Sélectionnez une option</option><option value="Support">Support</option><option value="Billing">Billing</option><option value="Technical">Technical</option><option value="Sales">Sales</option></select></label>
      </div>
      <div className="two">
        <label>User*<select className="input" name="userId" required><option value="">Sélectionnez une option</option>{users.map(u=><option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}</select></label>
        <label>Assigned To<select className="input" name="assignedTo"><option value="">Sélectionnez une option</option>{staff.map(u=><option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}</select></label>
      </div>
      <label>Service<select className="input" name="serviceId"><option value="">Sélectionnez une option</option>{services.map(s=><option key={s.id} value={s.id}>#{s.id} — {s.name}</option>)}</select></label>
      <label>Initial Message*<HtmlEditor name="message" placeholder="Enter the initial message..." minHeight={280} /></label>
      <div className="form-actions"><button className="btn primary">Créer</button><button className="btn" type="submit" name="continue" value="1">Créer &amp; Ajouter un autre</button><a className="btn" href="/admin/tickets">Annuler</a></div>
    </form>
  </AdminShell>;
}
