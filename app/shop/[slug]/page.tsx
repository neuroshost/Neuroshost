import { notFound, redirect } from "next/navigation";
import { isInstalled } from "@/lib/runtime";
import { query } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  if(!isInstalled()) redirect("/install");
  const {slug}=await params;
  const rows=await query<any[]>("SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=? AND p.visible=1 LIMIT 1",[slug]);
  const p=rows[0]; if(!p) notFound();
  return <div className="container"><nav className="nav"><a className="brand" href="/">NEUROS<span>HOST</span></a><div className="navlinks"><a href="/">Accueil</a><a href="/shop">Boutique</a></div></nav><main className="product-page">{p.image_url?<img className="product-image" src={p.image_url} alt=""/>:null}<div className="product-head"><div><div className="muted">{p.category_name||"Offre"}</div><h1>{p.name}</h1></div><div className="product-price">{Number(p.price).toFixed(2)} €<span>{p.billing_cycle==="MONTHLY"?" / mois":p.billing_cycle==="YEARLY"?" / an":p.billing_cycle==="QUARTERLY"?" / trimestre":""}</span></div></div><div className="product-html" dangerouslySetInnerHTML={{__html:p.description||`<p>${p.short_description||""}</p>`}}/><div className="purchase-bar"><div><strong>{p.name}</strong><div className="muted">Commande en ligne — prochain module de la V2</div></div><button className="btn primary" disabled>🛍 Commander</button></div></main></div>
}
