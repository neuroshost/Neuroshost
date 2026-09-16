"use client";
import { useEffect, useState } from "react";

type Role = { id: string; name: string; color: number; managed?: boolean };
export default function DiscordRolePicker({ name = "discordRoleIds", defaultValue = "" }: { name?: string; defaultValue?: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selected, setSelected] = useState<string[]>(() => defaultValue ? defaultValue.split(",").map(v => v.trim()).filter(Boolean) : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/discord/roles", { cache: "no-store" })
      .then(async r => { const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || "Impossible de récupérer les rôles."); return data; })
      .then(data => setRoles(Array.isArray(data.roles) ? data.roles : []))
      .catch(e => setError(e instanceof Error ? e.message : "Erreur Discord"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => setSelected(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);
  return <div className="discord-role-picker">
    <input type="hidden" name={name} value={selected.join(",")} />
    <div className="discord-role-picker-head"><strong>Rôles à mentionner</strong><span>{selected.length} sélectionné(s)</span></div>
    {loading ? <div className="notice">Chargement des rôles du serveur Discord…</div> : error ? <div className="notice danger">{error}</div> : roles.length === 0 ? <div className="notice">Aucun rôle disponible.</div> : <div className="discord-role-list">
      {roles.filter(r => !r.managed).map(role => <label key={role.id} className={`discord-role-option ${selected.includes(role.id) ? "selected" : ""}`}>
        <input type="checkbox" checked={selected.includes(role.id)} onChange={() => toggle(role.id)} />
        <span className="discord-role-dot" style={{ background: role.color ? `#${role.color.toString(16).padStart(6,"0")}` : "#8b8d98" }} />
        <span>{role.name}</span><small>{role.id}</small>
      </label>)}
    </div>}
  </div>;
}
