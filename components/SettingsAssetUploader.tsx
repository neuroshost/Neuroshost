"use client";
import { useState } from "react";

export default function SettingsAssetUploader({ label, name, value, accept }: { label: string; name: string; value?: string; accept: string }) {
  const [url, setUrl] = useState(value || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const fd = new FormData(); fd.append("key", name); fd.append("file", file);
      const res = await fetch("/api/admin/settings/assets", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload impossible");
      setUrl(data.url);
      window.dispatchEvent(new CustomEvent("neuroshost-settings-asset", { detail: { key: name, url: data.url } }));
    } catch (e) { setError(e instanceof Error ? e.message : "Upload impossible"); }
    finally { setBusy(false); }
  }

  return <div className="settings-asset-field">
    <div className="settings-asset-label"><span>{label}</span>{busy && <small>Upload…</small>}</div>
    <div className="settings-asset-row">
      <div className="settings-asset-preview">{url ? <img src={url} alt="Aperçu" /> : <span>Aucun fichier</span>}</div>
      <div className="settings-asset-controls">
        <label className="btn"><input type="file" accept={accept} hidden disabled={busy} onChange={e => upload(e.target.files?.[0])} />Choisir un fichier</label>
        <input className="input" name={name} value={url} onChange={e => setUrl(e.target.value)} placeholder="URL ou chemin du fichier" />
      </div>
    </div>
    {error && <small className="danger">{error}</small>}
  </div>;
}
