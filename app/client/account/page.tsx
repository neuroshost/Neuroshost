import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { query } from "@/lib/db";
import ClientShell from "@/components/ClientShell";
export const dynamic = "force-dynamic";

export default async function Account() {
  let s:any; try { s = await requireClient(); } catch { redirect("/client/login"); }
  const rows = await query<any[]>("SELECT id,name,email,role FROM users WHERE id=? LIMIT 1", [Number(s.id)]);
  const user = rows[0] || s;
  const parts = String(user.name || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return <ClientShell active="account">
    <div className="client-page-head"><div><div className="client-kicker">Compte</div><h1>Compte</h1></div></div>
    <section className="client-panel client-account-form-panel">
      <form className="form" action="/api/client/account/profile" method="post">
        <div className="two">
          <label>Prénom<input className="input" name="first_name" defaultValue={firstName} required /></label>
          <label>Nom de famille<input className="input" name="last_name" defaultValue={lastName} /></label>
        </div>
        <label>E-mail<input className="input" type="email" name="email" defaultValue={user.email} required /></label>
        <button className="client-primary-btn" type="submit">Mettre à jour</button>
      </form>
    </section>
  </ClientShell>;
}
