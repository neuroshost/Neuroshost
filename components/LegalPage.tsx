import { getPublicSettings } from "@/lib/settings";
import StoreNavbar from "@/components/StoreNavbar";
import { readSession } from "@/lib/auth";

export default async function LegalPage({ settingKey, title }: { settingKey: string; title: string }) {
  const settings = await getPublicSettings();
  const session = await readSession();
  const content = String((settings as any)[settingKey] || `<h1>${title}</h1><p>Cette page n'a pas encore été configurée.</p>`);
  return <div className="store-page legal-page">
    <StoreNavbar loggedIn={!!session} isAdmin={!!session && ["ADMIN","SUPER_ADMIN"].includes(String(session.role))} />
    <main className="legal-main"><article className="legal-content" dangerouslySetInnerHTML={{ __html: content }} /></main>
    <footer className="store-footer"><div><a href="/cgu">CGU</a><span> · </span><a href="/cgv">CGV</a><span> · </span><a href="/refund-policy">Remboursement</a><span> · </span><a href="/privacy-policy">Confidentialité</a></div><div>© 2026 {settings.site_name || "Neuroshost"}. Tous droits réservés.</div></footer>
  </div>;
}
