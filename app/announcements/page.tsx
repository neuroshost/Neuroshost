import { query } from "@/lib/db";
import { getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Announcement = {
  title: string;
  slug: string;
  description: string | null;
  published_at: Date | string | null;
};

export default async function AnnouncementsPage() {
  const rows = await query<Announcement[]>(
    `SELECT title, slug, description, published_at
     FROM announcements
     WHERE is_published = 1
       AND (published_at IS NULL OR published_at <= NOW())
     ORDER BY COALESCE(published_at, created_at) DESC, id DESC`
  );

  const settings = await getPublicSettings();
  const siteName = settings.site_name || "Neuroshost";

  return (
    <main className="container" style={{ padding: "50px 0 80px" }}>
      <nav className="nav">
        <a className="brand" href="/">
          NEUROS<span>HOST</span>
        </a>
        <div className="navlinks">
          <a href="/">Accueil</a>
          <a href="/shop">Boutique</a>
          <a href="/announcements">Annoncements</a>
          <a href="/client">Espace client</a>
        </div>
      </nav>

      <div style={{ paddingTop: 40 }}>
        <div className="muted">{siteName}</div>
        <h1>Announcements</h1>

        <div className="grid" style={{ marginTop: 25 }}>
          {rows.length > 0 ? (
            rows.map((announcement) => (
              <article className="card" key={announcement.slug}>
                <h2>{announcement.title}</h2>

                {announcement.description ? (
                  <div
                    className="html-content"
                    dangerouslySetInnerHTML={{ __html: announcement.description }}
                  />
                ) : null}

                <div
                  className="muted small"
                  style={{ margin: "16px 0" }}
                >
                  {announcement.published_at
                    ? new Date(announcement.published_at).toLocaleString("fr-FR")
                    : ""}
                </div>

                <a
                  className="btn primary"
                  href={`/announcements/${announcement.slug}`}
                >
                  Lire l'annonce
                </a>
              </article>
            ))
          ) : (
            <div className="empty card">Aucune annonce publiée.</div>
          )}
        </div>
      </div>
    </main>
  );
}
