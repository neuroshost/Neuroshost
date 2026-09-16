import AdminShell from "@/components/AdminShell";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminModulePage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "notification-templates") redirect("/admin/notification-templates");
  if (section === "announcements") redirect("/admin/announcements");
  if (section === "affiliates") redirect("/admin/affiliates");
  if (["custom-properties","roles","tax-rates","gateways","servers"].includes(section)) redirect(`/admin/module/${section}`);
  const title = section.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  return <AdminShell title={title}><div className="card admin-placeholder"><div className="admin-placeholder-icon">◈</div><h2>{title}</h2><p className="muted">Cette section est déjà intégrée à la navigation Neuroshost Billing et sera connectée à son module métier.</p><a href="/admin" className="btn primary">Retour au tableau de bord</a></div></AdminShell>;
}
