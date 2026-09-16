import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import { query } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function Success({searchParams}:{searchParams:Promise<{order?:string;free?:string}>}){
 const s=await requireClient().catch(()=>null); if(!s)redirect('/client/login'); const q=await searchParams; const id=Number(q.order||0);
 const o=(await query<any[]>("SELECT o.*,oi.product_name FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.id=? AND o.user_id=? LIMIT 1",[id,Number(s.id)]))[0];
 if(!o)redirect('/client/orders');
 return <div className="container" style={{maxWidth:760,paddingTop:80}}><div className="card checkout-success"><div className="success-icon">✓</div><div className="muted">COMMANDE #{o.id}</div><h1>{o.status==='PAID'?'Paiement confirmé':'Commande créée'}</h1><p className="muted">{o.status==='PAID'?'Votre commande a été enregistrée et votre service est en cours d’activation.':'Votre commande est en attente de confirmation du paiement.'}</p><div className="notice"><strong>{o.product_name||'Commande Neuroshost'}</strong><span>{Number(o.total).toFixed(2)} {o.currency}</span></div><div className="form-actions"><a className="btn primary" href="/client/orders">Mes commandes</a><a className="btn" href="/client/services">Mes services</a><a className="btn" href="/">Retour à la boutique</a></div></div></div>
}
