"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Brand from "@/components/Brand";

const groups = [
  { title: "Administration", items: [["Invoices", "/admin/invoices", "invoice"], ["Orders", "/admin/orders", "orders"], ["Products", "/admin/products", "products"], ["Tickets", "/admin/tickets", "tickets"], ["Users", "/admin/customers", "users"], ["Announcements", "/admin/module/announcements", "megaphone"], ["Affiliates", "/admin/module/affiliates", "affiliates"], ["Services", "/admin/services", "services"], ["Categories", "/admin/categories", "folder"]] },
  { title: "Configuration", items: [["Config Options", "/admin/config-options", "sliders"], ["Coupons", "/admin/coupons", "ticket"], ["Currencies", "/admin/currencies", "currency"], ["Custom Properties", "/admin/module/custom-properties", "properties"], ["Roles", "/admin/module/roles", "role"], ["Tax Rates", "/admin/module/tax-rates", "tax"]] },
  { title: "Extensions", items: [["Gateways", "/admin/module/gateways", "gateway"], ["Servers", "/admin/module/servers", "server"], ["Extensions", "/admin/module/extensions", "extensions"]] },
  { title: "System", items: [["Settings", "/admin/settings", "settings"], ["Discord", "/admin/discord", "discord"], ["Updates", "/admin/module/updates", "updates"], ["Audits", "/admin/module/audits", "audits"], ["Cron Statistics", "/admin/module/cron-statistics", "cron"]] },
  { title: "Other", items: [["Api Keys", "/admin/module/api-keys", "key"], ["Email Logs", "/admin/emails", "email"], ["Failed Jobs", "/admin/module/failed-jobs", "failed"], ["Notification Templates", "/admin/module/notification-templates", "template"], ["OAuth Clients", "/admin/module/oauth-clients", "oauth"]] },
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    invoice:<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></>, orders:<><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>, products:<><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>,
    tickets:<><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4ZM20 14h-3v5h2a1 1 0 0 0 1-1v-4Z"/></>, users:<><path d="M16 21v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7" r="3.5"/><path d="M17 11a3 3 0 1 0 0-6M21 21v-1a4 4 0 0 0-3-3.87"/></>, megaphone:<><path d="m3 11 18-6v14L3 13v-2Z"/><path d="M11 15.7 12.5 21H9l-1.5-6"/></>, affiliates:<><circle cx="8" cy="8" r="3"/><circle cx="16" cy="16" r="3"/><path d="m10.5 10.5 3 3M4 21a4 4 0 0 1 8 0M12 3a4 4 0 0 1 8 0"/></>, services:<><path d="M4 7h16v13H4z"/><path d="M8 7V5h8v2M8 12h8M8 16h5"/></>, folder:<path d="M3 6h7l2 2h9v10H3V6Z"/>,
    sliders:<><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>, ticket:<><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z"/><path d="M12 8v1M12 15v1"/></>, currency:<><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.2 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1M12 5v14"/></>, properties:<><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h5M8 16h8"/></>, role:<><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><circle cx="12" cy="10" r="2"/><path d="M8.5 16a4 4 0 0 1 7 0"/></>, tax:<><circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M9 9h.01M15 15h.01"/></>,
    gateway:<><path d="M4 7h16v10H4z"/><path d="M4 11h16M8 15h3"/></>, server:<><rect x="4" y="3" width="16" height="7" rx="1"/><rect x="4" y="14" width="16" height="7" rx="1"/><path d="M7 6h.01M7 17h.01M10 6h7M10 17h7"/></>, extensions:<><path d="M9 3v5a2 2 0 0 1-2 2H4v5h3a2 2 0 0 1 2 2v4h5v-4a2 2 0 0 1 2-2h4v-5h-4a2 2 0 0 1-2-2V3H9Z"/></>, settings:<><circle cx="12" cy="12" r="3"/><path d="M19 15l2 1-2 3-2-1a7 7 0 0 1-3 2v2h-4v-2a7 7 0 0 1-3-2l-2 1-2-3 2-1a7 7 0 0 1 0-4L3 10l2-3 2 1a7 7 0 0 1 3-2V4h4v2a7 7 0 0 1 3 2l2-1 2 3-2 1a7 7 0 0 1 0 4Z"/></>, updates:<><path d="M20 11a8 8 0 0 0-14.9-4M4 5v4h4M4 13a8 8 0 0 0 14.9 4M20 19v-4h-4"/></>, audits:<><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></>, cron:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, key:<><circle cx="8" cy="15" r="3"/><path d="m10.5 12.5 8-8M15 7l2 2M17 5l2 2"/></>, email:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>, failed:<><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></>, template:<><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>, discord:<><path d="M7 8c-2 0-3 1-3 3v4c0 2 1 3 3 3h2l1 2 2-2h2c2 0 3-1 3-3v-4c0-2-1-3-3-3H7Z"/><path d="M8 12h.01M16 12h.01"/></>, oauth:<><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 8h6M9 12h4M9 16h3"/></>
  };
  return <svg {...common}>{paths[name] ?? paths.properties}</svg>;
}

function isActive(pathname: string, href: string) { return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"); }

export default function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [failedJobsCount, setFailedJobsCount] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState("Administrateur");

  useEffect(() => {
    try { const saved = localStorage.getItem("neuroshost-admin-sidebar-groups"); if (saved) setCollapsedGroups(JSON.parse(saved)); } catch {}
  }, []);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(u => { if (u?.name) setUserName(u.name); }).catch(() => {});
  }, []);
  useEffect(() => {
    let mounted = true;
    const load = async () => { try { const r = await fetch("/api/admin/failed-jobs/count", { cache:"no-store" }); if(r.ok){ const d=await r.json(); if(mounted)setFailedJobsCount(Math.max(0, Number(d?.count ?? 0))); } } catch {} };
    load(); const i=window.setInterval(load,15000); return()=>{mounted=false;window.clearInterval(i)};
  }, []);
  const toggleGroup=(title:string)=>setCollapsedGroups(c=>{const n={...c,[title]:!c[title]};try{localStorage.setItem("neuroshost-admin-sidebar-groups",JSON.stringify(n))}catch{}return n});

  return <div className="admin-shell">
    <aside className="sidebar">
      <a href="/admin" className="admin-brand"><Brand /></a>
      <div className="admin-home-link"><a href="/admin" className={pathname==="/admin"?"active":""}><Icon name="properties"/><span>Dashboard</span></a></div>
      {groups.map(group=><section className="sidebar-group" key={group.title}>
        <button type="button" className={`side-title-row ${collapsedGroups[group.title]?"collapsed":""}`} onClick={()=>toggleGroup(group.title)} aria-expanded={!collapsedGroups[group.title]}><span>{group.title}</span><span className="side-chevron">⌃</span></button>
        <nav className={`sidebar-nav ${collapsedGroups[group.title]?"sidebar-nav-collapsed":""}`}>
          {group.items.map(([label,href,icon])=><a href={href} className={isActive(pathname,href)?"active":""} key={href} tabIndex={collapsedGroups[group.title]?-1:0}><Icon name={icon}/><span>{label}</span>{label==="Failed Jobs"&&<b className={`sidebar-badge ${failedJobsCount>0?"sidebar-badge-error":"sidebar-badge-ok"}`}>{failedJobsCount}</b>}</a>)}
        </nav>
      </section>)}
      <div className="sidebar-footer">
        <div className="sidebar-powered">Powered by Neuroshost © 2026</div>
        <a href="#" onClick={(e)=>e.preventDefault()}><span className="footer-icon sponsor">♥</span><span>Sponsor</span></a>
        <a href="https://github.com/neuroshost/Neuroshost" target="_blank" rel="noreferrer"><span className="footer-icon github">★</span><span>Star us on GitHub</span></a>
        <a href="/documentation"><span className="footer-icon">▣</span><span>Documentation</span></a>
      </div>
    </aside>

    <main className="main">
      <header className="admin-navbar">
        <div className="admin-navbar-left">
          <div className="admin-search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher" aria-label="Rechercher"/></div>
        </div>
        <div className="admin-navbar-right">
          <button className="navbar-icon" type="button" title="Thème">☾</button>
          <button className="navbar-icon" type="button" title="Notifications">♧</button>
          <button className="avatar-button" type="button" onClick={()=>setMenuOpen(v=>!v)} aria-expanded={menuOpen}>👨🏻‍💻</button>
          {menuOpen&&<div className="profile-menu">
            <div className="profile-name"><span className="profile-avatar">●</span><strong>{userName}</strong></div>
            <div className="profile-theme"><button type="button">☼</button><button type="button">☾</button><button type="button" className="selected">▣</button></div>
            <a href="/" className="profile-action">↩ <span>Exit Admin</span></a>
            <a href="/api/auth/logout" className="profile-action">⇱ <span>Sign out</span></a>
          </div>}
        </div>
      </header>
      <div className="topline"><div><div className="muted">Administration Neuroshost</div><h1>{title}</h1></div></div>
      {children}
    </main>
  </div>;
}
