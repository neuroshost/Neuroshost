import { redirect } from "next/navigation";
import { isInstalled } from "@/lib/runtime";
import { getPublicSettings } from "@/lib/settings";
import { query } from "@/lib/db";
import { readSession } from "@/lib/auth";
import Brand from "@/components/Brand";
import StoreNavbar from "@/components/StoreNavbar";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isInstalled()) redirect("/install");
  const s = await getPublicSettings();
  const session = await readSession();
  const announcementRows = await query<any[]>("SELECT id FROM announcements WHERE is_published=1 AND (published_at IS NULL OR published_at<=NOW()) LIMIT 1");
  const products = await query<any[]>("SELECT p.*,c.name category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.visible=1 AND p.hide_product=0 ORDER BY p.featured DESC,c.sort_order,p.name LIMIT 12");
  const site = s.site_name || "Neuroshost";
  return <div className="store-page">
    <StoreNavbar loggedIn={!!session} isAdmin={!!session && ["ADMIN","SUPER_ADMIN"].includes(String(session.role))} hasAnnouncements={announcementRows.length > 0} />
    <main className="store-main">
      <section className="store-offers-section">
        <div className="store-eyebrow">OFFRES</div>
        <div className="store-offers-grid">
          {products.map(p => <article className="store-offer-card" key={p.id}>
            {p.image_url && <img src={p.image_url} alt="" className="store-offer-image" />}
            <div className="store-category">{p.category_name || "Offre"}</div>
            <h1>{p.name}</h1>
            <div className="store-description" dangerouslySetInnerHTML={{ __html: p.description || `<p>${p.short_description || "Découvrez cette offre Neuroshost."}</p>` }} />
            <div className="store-price">{Number(p.price).toFixed(2)} € <span>{p.billing_cycle === "MONTHLY" ? "/ mois" : p.billing_cycle === "YEARLY" ? "/ an" : ""}</span></div>
            <a className="store-offer-button" href={`/shop/${p.slug}`}>Tout afficher <span>→</span></a>
          </article>)}
        </div>
        {!products.length && <div className="empty">Aucune offre disponible.</div>}
      </section>
    </main>
    <footer className="store-footer"><Brand compact /><div>© 2026 {site}. Tous droits réservés.</div></footer>
  </div>;
}
