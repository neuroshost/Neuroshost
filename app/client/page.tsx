import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { query } from "@/lib/db";
import ClientShell from "@/components/ClientShell";
export const dynamic = "force-dynamic";
export default async function ClientHome() {
  let s:any; try { s = await requireClient(); } catch { redirect("/client/login"); }
  const [tickets, services, invoices] = await Promise.all([
    query<any[]>("SELECT id,subject,status,created_at FROM tickets WHERE user_id=? ORDER BY id DESC LIMIT 5", [Number(s.id)]),
    query<any[]>("SELECT id,name,status,renew_at FROM services WHERE user_id=? ORDER BY id DESC LIMIT 5", [Number(s.id)]),
    query<any[]>("SELECT id,number,status,total,currency,due_at FROM invoices WHERE user_id=? ORDER BY id DESC LIMIT 5", [Number(s.id)])
  ]);
  return <ClientShell active="dashboard"><div className="client-page-head"><div><div className="client-kicker">Espace client</div><h1>Tableau de bord</h1><p>Gérez vos services actifs, vos factures et vos demandes de support.</p></div><a className="client-primary-btn" href="/client/tickets/new">+ Nouveau ticket</a></div>
    <div className="client-dashboard-grid">
      <section className="client-panel"><div className="client-panel-head"><h2>Services actifs</h2><span className="client-count">{services.length}</span></div>{services.length ? services.map(v=><div className="client-service-row" key={v.id}><div><strong>{v.name}</strong><span>Prochain renouvellement : {v.renew_at ? new Date(v.renew_at).toLocaleDateString("fr-FR") : "Non défini"}</span></div><b className="client-status-ok">●</b></div>) : <div className="client-empty">Aucun service actif.</div>}<a className="client-panel-link" href="/client/services">Voir tout →</a></section>
      <section className="client-panel"><div className="client-panel-head"><h2>Factures impayées</h2><span className="client-count">{invoices.filter(i=>i.status!=="PAID").length}</span></div>{invoices.filter(i=>i.status!=="PAID").slice(0,3).map(i=><a href="/client/invoices" className="client-service-row" key={i.id}><div><strong>{i.number}</strong><span>{Number(i.total).toFixed(2)} {i.currency}</span></div><b>→</b></a>)}{!invoices.filter(i=>i.status!=="PAID").length && <div className="client-empty">Aucune facture impayée.</div>}<a className="client-panel-link" href="/client/invoices">Voir tout →</a></section>
      <section className="client-panel"><div className="client-panel-head"><h2>Tickets ouverts</h2><span className="client-count">{tickets.filter(t=>t.status!=="CLOSED").length}</span></div>{tickets.filter(t=>t.status!=="CLOSED").slice(0,3).map(t=><a href={`/client/tickets/${t.id}`} className="client-service-row" key={t.id}><div><strong>#{t.id} · {t.subject}</strong><span>{new Date(t.created_at).toLocaleString("fr-FR")}</span></div><b>→</b></a>)}{!tickets.filter(t=>t.status!=="CLOSED").length && <div className="client-empty">Vous n'avez aucun ticket ouvert.</div>}<a className="client-panel-link" href="/client/tickets">Voir tout →</a></section>
    </div>
  </ClientShell>;
}
