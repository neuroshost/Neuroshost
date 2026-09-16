"use client";

import Brand from "@/components/Brand";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Active = "dashboard" | "orders" | "services" | "invoices" | "tickets" | "account";

type ClientUser = { id?: number; name?: string; email?: string; role?: string };

const accountItems = [
  ["Informations personnelles", "/client/account", "profile"],
  ["Parrainage", "/client/account/referral", "referral"],
  ["Sécurité", "/client/account/security", "security"],
  ["Crédits", "/client/account/credits", "credits"],
  ["Modes de paiement", "/client/account/payment-methods", "payment"],
  ["Notifications", "/client/account/notifications", "notifications"],
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    orders: <><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    services: <><rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 6V4h8v2M8 11h8M8 15h5"/></>,
    invoices: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>,
    tickets: <><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 1 1-1v-4Z"/></>,
    account: <><circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0 1 14 0M19 4l1 1 2-2"/></>,
    profile: <><circle cx="12" cy="8" r="3"/><path d="M5 21a7 7 0 0 1 14 0"/></>,
    referral: <><circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/><path d="m10.5 10.5 3 3"/></>,
    security: <><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="M9 12l2 2 4-4"/></>,
    credits: <><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.2 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1M12 5v14"/></>,
    payment: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  };
  return <svg {...common}>{paths[name] ?? paths.account}</svg>;
}

export default function ClientShell({ children, active }: { children: React.ReactNode; active: Active }) {
  const pathname = usePathname();
  const accountActive = pathname.startsWith("/client/account");
  const [accountOpen, setAccountOpen] = useState(accountActive);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<ClientUser | null>(null);

  useEffect(() => { try { const saved = localStorage.getItem("neuroshost-client-account-open"); if (saved !== null) setAccountOpen(saved === "1"); } catch {} }, []);
  useEffect(() => { if (accountActive) setAccountOpen(true); }, [accountActive]);
  useEffect(() => {
    if (!profileOpen || user) return;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(data => { if (data) setUser(data); })
      .catch(() => {});
  }, [profileOpen, user]);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".client-profile-actions")) setProfileOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const toggleAccount = () => setAccountOpen(v => { const next=!v; try { localStorage.setItem("neuroshost-client-account-open", next ? "1" : "0"); } catch {} return next; });
  const displayName = user?.name || "Compte";
  const displayEmail = user?.email || "";
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(String(user?.role || ""));

  const topNav = [
    ["dashboard", "Tableau de bord", "/client", "dashboard"],
    ["orders", "Commandes", "/client/orders", "orders"],
    ["services", "Services", "/client/services", "services"],
    ["invoices", "Factures", "/client/invoices", "invoices"],
    ["tickets", "Tickets", "/client/tickets", "tickets"],
  ] as const;

  return <div className="client-app-shell">
    <header className="client-app-topbar">
      <div className="client-app-topbar-inner">
        <a href="/" className="client-app-brand"><Brand compact /></a>
        <nav className="client-app-public-nav"><a href="/">Accueil</a><a href="/shop">Offres <span className="client-caret">⌄</span></a></nav>
        <div className="client-app-actions client-profile-actions">
          <button type="button" title="Langue">🇫🇷 <span>FR</span></button>
          <button type="button" title="Devise">| EUR €⌄</button>
          <button type="button" title="Mode sombre">☾</button>
          <button type="button" className="client-mini-avatar" title="Compte" aria-label="Ouvrir le menu du compte" aria-expanded={profileOpen} onClick={() => setProfileOpen(v => !v)}>●</button>
          {profileOpen && <div className="client-profile-menu">
            <div className="client-profile-identity">
              <strong>{displayName}</strong>
              {displayEmail && <span>{displayEmail}</span>}
            </div>
            <a href="/client">Tableau de bord</a>
            <a href="/client/tickets">Tickets</a>
            <a href="/client/account">Compte</a>
            {isAdmin && <a href="/admin">Admin</a>}
            <a className="logout" href="/api/auth/logout">Déconnexion</a>
          </div>}
        </div>
      </div>
    </header>
    <div className="client-app-body">
      <aside className="client-sidebar">
        <nav className="client-main-nav">
          {topNav.map(([key, label, href, icon]) => <a key={key} href={href} className={active === key ? "active" : ""}><span className="client-side-icon"><Icon name={icon}/></span><span>{label}</span></a>)}
          <button type="button" className={`client-account-toggle ${accountActive ? "active" : ""}`} onClick={toggleAccount} aria-expanded={accountOpen}>
            <span className="client-side-icon"><Icon name="account"/></span><span>Compte</span><span className={`client-account-chevron ${accountOpen ? "open" : ""}`}>⌃</span>
          </button>
          <div className={`client-account-subnav ${accountOpen ? "open" : ""}`}>
            {accountItems.map(([label, href, icon]) => {
              const selected = href === "/client/account" ? pathname === href : pathname.startsWith(href);
              return <a key={href} href={href} className={selected ? "active" : ""}>
                <span className="client-account-subicon"><Icon name={icon}/></span><span>{label}</span>
                {icon === "security" && <span className="client-security-loading" title="Fonctionnalité en cours de programmation" aria-label="En cours de programmation"/>}
              </a>;
            })}
          </div>
        </nav>
        <div className="client-sidebar-bottom">
          <a href="/shop"><span>◈</span> Voir la boutique</a>
          <a href="/api/auth/logout"><span>↪</span> Déconnexion</a>
        </div>
      </aside>
      <main className="client-app-main">{children}</main>
    </div>
    <footer className="client-app-footer"><div><Brand compact /></div><span>© 2026 Neuroshost. Tous droits réservés.</span></footer>
  </div>;
}
