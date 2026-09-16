import { redirect } from "next/navigation";
import { requireClient } from "@/lib/auth";
import ClientShell from "@/components/ClientShell";
export const dynamic="force-dynamic";
export default async function Security(){try{await requireClient()}catch{redirect("/client/login")}return <ClientShell active="account"><div className="client-breadcrumb">Compte <span>›</span> Sécurité</div><div className="client-page-head"><div><h1>Sécurité <span className="security-page-spinner"/></h1><p>Gestion de la sécurité de votre compte.</p></div></div><section className="client-security-placeholder"><div className="security-placeholder-spinner"/><h2>Fonctionnalité en cours de programmation</h2><strong>Erreur 2000</strong><p>La fonctionnalité n'est pas encore disponible.<br/>Cette section est actuellement en cours de développement.</p></section></ClientShell>}
