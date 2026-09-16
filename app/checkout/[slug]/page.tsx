import { redirect, notFound } from "next/navigation";
import { isInstalled } from "@/lib/runtime";
import { query } from "@/lib/db";
import { readSession } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function Checkout({params}:{params:Promise<{slug:string}>}){
 if(!isInstalled()) redirect("/install");
 const {slug}=await params;
 const p=(await query<any[]>("SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.visible=1 AND COALESCE(p.hide_product,0)=0 LIMIT 1",[slug]))[0];
 if(!p)notFound();
 const plans=await query<any[]>("SELECT * FROM product_plans WHERE product_id=? AND enabled=1 ORDER BY sort_order,id",[Number(p.id)]);
 const session=await readSession();
 if(!session) redirect(`/client/login?next=${encodeURIComponent(`/checkout/${p.slug}`)}`);
 return <div className="checkout-page"><div className="container"><div className="checkout-top"><a href={`/shop/${p.slug}`}>← Retour au produit</a><span>Commande sécurisée</span></div><div className="checkout-grid"><section className="card checkout-card"><div className="muted">{p.category_name||"Offre"}</div><h1>Commander {p.name}</h1><p className="muted">Configurez votre commande avant de passer au paiement.</p><form className="form" action="/api/checkout" method="post"><input type="hidden" name="productId" value={p.id}/>{plans.length>0&&<label>Plan<select className="input" name="planId" defaultValue={plans[0].id}>{plans.map(x=><option key={x.id} value={x.id}>{x.name} — {Number(x.price).toFixed(2)} € / {x.billing_cycle.toLowerCase()}</option>)}</select></label>}<label>Quantité<input className="input" name="quantity" type="number" min="1" max="99" defaultValue="1"/></label><label>Code promo <input className="input" name="coupon" placeholder="Optionnel"/></label><label className="terms-check"><input type="checkbox" name="acceptTerms" value="1" required/> <span>J'accepte les <a href="/cgu">CGU</a> et les <a href="/cgv">CGV</a>.</span></label><button className="btn primary checkout-submit">Continuer vers le paiement →</button></form></section><aside className="card checkout-summary"><div className="muted">RÉCAPITULATIF</div><h2>{p.name}</h2><div className="summary-row"><span>Prix</span><strong>{Number(p.price).toFixed(2)} {p.currency||"EUR"}</strong></div><div className="summary-row"><span>Cycle</span><span>{p.billing_cycle}</span></div><hr/><div className="summary-total"><span>Total</span><strong>{Number(p.price).toFixed(2)} €</strong></div><small className="muted">Le montant final peut être modifié par un code promotionnel.</small></aside></div></div></div>
}
