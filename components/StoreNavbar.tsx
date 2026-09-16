"use client";
import { useState } from "react";
import Brand from "@/components/Brand";

export default function StoreNavbar({ loggedIn = false, isAdmin = false, hasAnnouncements = false }: { loggedIn?: boolean; isAdmin?: boolean; hasAnnouncements?: boolean }) {
  const [open, setOpen] = useState(false);
  return <header className="store-navbar">
    <div className="store-navbar-inner">
      <a href="/" className="store-brand"><Brand compact /></a>
      <nav><a href="/">Accueil</a><a href="/shop">Offres <span>⌄</span></a>{hasAnnouncements && <a href="/announcements">Annonces</a>}</nav>
      <div className="store-actions">
        <button type="button">🇫🇷 <span>FR</span></button>
        <button type="button">| EUR €⌄</button>
        <button type="button">☾</button>
        <button type="button" className="store-avatar" onClick={() => setOpen(v => !v)} aria-expanded={open}>●</button>
        {open && <div className="store-profile-menu">
          {loggedIn ? <>
            <div className="store-profile-email">Compte connecté</div>
            <a href="/client">Tableau de bord</a>
            <a href="/client/tickets">Tickets</a>
            {isAdmin && <a href="/admin">Admin</a>}
            <a className="logout" href="/api/auth/logout">Déconnexion</a>
          </> : <>
            <a href="/client/login">Connexion</a>
            <a href="/client/register">Créer un compte</a>
          </>}
        </div>}
      </div>
    </div>
  </header>;
}
