import Brand from "@/components/Brand";

const sections: Array<[string, string[]]> = [
  ["Démarrage", ["Installation", "Première connexion", "Configuration générale"]],
  ["Administration", ["Dashboard", "Clients", "Commandes", "Produits", "Services", "Tickets", "Annonces", "Affiliés"]],
  ["Configuration", ["Catégories", "Options de configuration", "Coupons", "Devises", "Propriétés personnalisées", "Rôles", "Taxes"]],
  ["Infrastructure", ["Passerelles de paiement", "Serveurs", "Extensions"]],
  ["Système", ["Paramètres", "Mises à jour", "Audits", "Cron Statistics", "API Keys", "Email Logs", "Failed Jobs", "Notification Templates", "OAuth Clients"]],
  ["Espace client", ["Compte", "Boutique", "Tickets"]],
];

export default function DocumentationPage() {
  return (
    <div className="docs-page">
      <header className="docs-header">
        <div className="docs-header-inner">
          <a href="/" className="docs-brand"><Brand /></a>
          <nav className="docs-nav">
            <a href="/documentation" className="active">Documentation</a>
            <a href="/shop">Boutique</a>
            <a href="/client">Espace client</a>
          </nav>
          <a className="docs-admin-link" href="/admin">Administration</a>
        </div>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar-title">Documentation</div>
          {sections.map(([title, items]) => (
            <div className="docs-nav-group" key={title}>
              <div className="docs-nav-group-title">{title}</div>
              {(items as string[]).map((item) => <a key={item} href={`#${slug(item)}`}>{item}</a>)}
            </div>
          ))}
        </aside>

        <main className="docs-content">
          <section className="docs-hero">
            <span className="docs-eyebrow">NEUROSHOST BILLING · V1.0.0</span>
            <h1>Documentation Neuroshost Billing</h1>
            <p>Guide complet pour installer, configurer et administrer votre plateforme de facturation et d’hébergement.</p>
            <div className="docs-hero-actions">
              <a href="/install" className="docs-button primary">Installer Neuroshost Billing</a>
              <a href="/shop" className="docs-button">Voir la boutique</a>
            </div>
          </section>

          <DocSection id="installation" title="Installation">
            <p>Neuroshost Billing utilise Next.js, React et MariaDB. L’installation initiale se fait depuis l’assistant <code>/install</code>.</p>
            <div className="docs-code"><pre>{`npm install
npm run build
npm start`}</pre></div>
            <ol>
              <li>Installez Node.js <strong>22.14.0 ou supérieur</strong>.</li>
              <li>Créez une base MariaDB et un utilisateur disposant des droits nécessaires.</li>
              <li>Lancez l’application puis ouvrez <code>/install</code>.</li>
              <li>Renseignez les paramètres MariaDB et le compte administrateur.</li>
              <li>Terminez l’installation puis connectez-vous sur <code>/admin</code>.</li>
            </ol>
            <div className="docs-note">La configuration bootstrap est enregistrée dans <code>.runtime/config.json</code>. Ne publiez jamais ce fichier dans Git.</div>
          </DocSection>

          <DocSection id="premiere-connexion" title="Première connexion">
            <p>Après l’installation, utilisez le compte administrateur créé par l’assistant. L’administration est disponible sur <code>/admin</code>.</p>
            <p>Le menu latéral est organisé en cinq groupes rétractables : <strong>Administration</strong>, <strong>Configuration</strong>, <strong>Extensions</strong>, <strong>System</strong> et <strong>Other</strong>.</p>
          </DocSection>

          <DocSection id="configuration-generale" title="Configuration générale">
            <p>Dans <strong>Administration → Settings</strong>, configurez l’identité de l’application, la sécurité, les connexions sociales, les taxes, les emails, les tickets, le cron, les crédits, le thème, les factures et les autres paramètres.</p>
            <ul><li>Les logos Light/Dark peuvent être chargés depuis votre PC.</li><li>Le favicon est également configurable.</li><li>Les paramètres sont stockés en MariaDB.</li><li>Les secrets applicatifs sont protégés et ne doivent jamais être affichés dans le frontend.</li></ul>
          </DocSection>

          <DocSection id="dashboard" title="Dashboard">
            <p>Le dashboard donne une vue synthétique de l’activité de la plateforme : clients, commandes, services, revenus et éléments nécessitant une intervention.</p>
          </DocSection>

          <DocSection id="clients" title="Clients">
            <p>Le module Clients permet de créer, modifier et consulter les comptes utilisateurs. Les rôles distinguent notamment les administrateurs, le staff et les clients.</p>
          </DocSection>

          <DocSection id="commandes" title="Commandes">
            <p>Les commandes regroupent les achats effectués depuis la boutique. Une commande peut être en attente, payée, annulée ou remboursée.</p>
          </DocSection>

          <DocSection id="produits" title="Produits">
            <p>Les produits sont les offres vendues depuis la boutique. Vous pouvez définir le nom, le slug, la catégorie, le prix, le cycle de facturation, le stock, l’image et la visibilité.</p>
            <p>La <strong>Description HTML</strong> accepte du HTML personnalisé. Elle peut être utilisée pour présenter les caractéristiques techniques, tableaux, blocs d’information et mises en avant de l’offre.</p>
            <div className="docs-code"><pre>{`<h2>Caractéristiques techniques</h2>
<ul>
  <li>4 Go de RAM</li>
  <li>1 vCPU</li>
  <li>10 Go NVMe</li>
</ul>`}</pre></div>
          </DocSection>

          <DocSection id="services" title="Services">
            <p>Les services représentent les ressources attribuées à un client après une commande. Leur état peut être <code>PENDING</code>, <code>ACTIVE</code>, <code>SUSPENDED</code> ou <code>TERMINATED</code>.</p>
          </DocSection>

          <DocSection id="tickets" title="Tickets">
            <p>Les tickets permettent au client de contacter le support. Les administrateurs et membres du staff peuvent répondre depuis l’administration.</p>
            <p>Les messages peuvent contenir du HTML lorsque celui-ci est saisi par un utilisateur autorisé.</p>
          </DocSection>

          <DocSection id="annonces" title="Annonces">
            <p>Les annonces permettent de publier des informations sur la plateforme. La description et le contenu peuvent utiliser du HTML pour créer des annonces riches.</p>
          </DocSection>

          <DocSection id="affilies" title="Affiliés">
            <p>Le module Affiliates gère les programmes de parrainage, codes de recommandation, récompenses et activation des programmes.</p>
          </DocSection>

          <DocSection id="categories" title="Catégories">
            <p>Les catégories organisent les produits de la boutique. Elles peuvent être visibles ou masquées, triées et liées à une catégorie parent.</p>
          </DocSection>

          <DocSection id="options-de-configuration" title="Options de configuration">
            <p>Les Config Options permettent d’ajouter des paramètres liés aux produits : texte, nombre, booléen, sélection ou mot de passe. Elles peuvent être masquées et associées à plusieurs produits.</p>
          </DocSection>

          <DocSection id="coupons" title="Coupons">
            <p>Les coupons permettent d’appliquer une remise en pourcentage ou un montant fixe. Vous pouvez limiter les utilisations, définir une période de validité et associer le coupon à certains produits.</p>
          </DocSection>

          <DocSection id="devises" title="Devises">
            <p>Configurez les devises utilisées par votre catalogue et votre facturation : code ISO, symbole, préfixe, suffixe, nombre de décimales et format.</p>
          </DocSection>

          <DocSection id="proprietes-personnalisees" title="Propriétés personnalisées">
            <p>Les Custom Properties ajoutent des champs métier supplémentaires aux objets gérés par Neuroshost Billing. Elles peuvent être obligatoires, non modifiables ou affichées sur les factures selon leur configuration.</p>
          </DocSection>

          <DocSection id="roles" title="Rôles">
            <p>Les rôles contrôlent les permissions disponibles dans l’administration. Utilisez des permissions minimales pour les comptes staff.</p>
          </DocSection>

          <DocSection id="taxes" title="Taxes">
            <p>Les Tax Rates permettent de définir les taux de taxe et leur pays d’application. Les paramètres de taxation doivent être configurés selon votre situation légale et comptable.</p>
          </DocSection>

          <DocSection id="passerelles-de-paiement" title="Passerelles de paiement">
            <p>Les Gateways centralisent la configuration des moyens de paiement. Les paramètres sensibles doivent rester côté serveur et être chiffrés avant stockage.</p>
          </DocSection>

          <DocSection id="serveurs" title="Serveurs">
            <p>Le module Servers permet de déclarer les infrastructures utilisées par les produits et services. Il prépare notamment l’intégration de gestionnaires tels que Pterodactyl.</p>
          </DocSection>

          <DocSection id="extensions" title="Extensions">
            <p>Les extensions ajoutent des fonctionnalités à Neuroshost Billing. Le catalogue peut contenir des extensions, thèmes, gateways, modules serveur et autres composants.</p>
          </DocSection>

          <DocSection id="parametres" title="Paramètres">
            <p>Les paramètres système sont regroupés par onglets. Utilisez les onglets correspondant à votre besoin plutôt que de modifier directement les fichiers de l’application.</p>
          </DocSection>

          <DocSection id="mises-a-jour" title="Mises à jour">
            <p>La page Updates est destinée à vérifier les nouvelles versions publiées sur le dépôt GitHub officiel du projet.</p>
            <p>Pour une release, le dépôt cible est <code>neuroshost/Neuroshost</code>. Les fichiers d’installation et les données persistantes doivent être séparés du code de l’application.</p>
            <div className="docs-note warning">Avant toute mise à jour : effectuez une sauvegarde de MariaDB et conservez une copie de <code>.runtime</code>.</div>
          </DocSection>

          <DocSection id="audits" title="Audits">
            <p>Les audits enregistrent les actions importantes effectuées dans l’administration afin de faciliter le suivi et le diagnostic.</p>
          </DocSection>

          <DocSection id="cron-statistics" title="Cron Statistics">
            <p>Cette section permet de suivre les exécutions du scheduler et des tâches planifiées. Elle sert notamment à vérifier que les traitements récurrents s’exécutent correctement.</p>
          </DocSection>

          <DocSection id="api-keys" title="API Keys">
            <p>Les clés API donnent accès aux fonctionnalités autorisées par leurs permissions. Limitez les IP autorisées lorsque cela est possible et ne partagez jamais une clé dans un dépôt public.</p>
          </DocSection>

          <DocSection id="email-logs" title="Email Logs">
            <p>Email Logs permet de consulter les tentatives d’envoi, leurs destinataires, leur statut et les éventuelles erreurs.</p>
          </DocSection>

          <DocSection id="failed-jobs" title="Failed Jobs">
            <p>Failed Jobs regroupe les tâches ayant échoué. Le badge du menu affiche le nombre de tâches <strong>non résolues</strong> :</p>
            <div className="docs-statuses"><span className="ok">0 · aucune erreur</span><span className="error">1+ · erreurs non résolues</span></div>
            <p>Une tâche marquée comme résolue n’est plus comptabilisée dans le badge.</p>
          </DocSection>

          <DocSection id="notification-templates" title="Notification Templates">
            <p>Les modèles de notification permettent de définir les emails et notifications in-app. Le champ Body peut contenir du HTML et du CSS pour les modèles gérés par des administrateurs de confiance.</p>
          </DocSection>

          <DocSection id="oauth-clients" title="OAuth Clients">
            <p>Les OAuth Clients servent à déclarer des applications clientes avec leur nom et leurs URL de redirection. Les secrets OAuth doivent rester confidentiels.</p>
          </DocSection>

          <DocSection id="compte" title="Espace client · Compte">
            <p>L’espace client est accessible via <code>/client</code>. Un client peut créer son compte, se connecter, consulter ses services et accéder au support.</p>
          </DocSection>

          <DocSection id="boutique" title="Espace client · Boutique">
            <p>La boutique publique est accessible via <code>/shop</code>. Les produits publiés par l’administration sont présentés avec leur prix, leur cycle et leur description.</p>
          </DocSection>

          <DocSection id="tickets-client" title="Espace client · Tickets">
            <p>Le client peut créer un ticket depuis <code>/client/tickets/new</code>, consulter ses tickets et répondre à ses conversations.</p>
          </DocSection>

          <section className="docs-end">
            <h2>Besoin d’aide ?</h2>
            <p>Consultez le dépôt GitHub du projet ou ouvrez un ticket support depuis votre espace client.</p>
            <div className="docs-hero-actions">
              <a className="docs-button primary" href="https://github.com/neuroshost/Neuroshost" target="_blank" rel="noreferrer">Dépôt GitHub</a>
              <a className="docs-button" href="/client/tickets/new">Ouvrir un ticket</a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section className="docs-section" id={id}><h2>{title}</h2><div>{children}</div></section>;
}

function slug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
