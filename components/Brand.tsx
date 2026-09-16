"use client";

import { useEffect, useState } from "react";

type Props = { className?: string; compact?: boolean };
type PublicSettings = {
  logo_dark?: string;
  app_logo?: string;
  logo_light?: string;
};

export default function Brand({ className = "", compact = false }: Props) {
  const [logo, setLogo] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/public/settings", { cache: "no-store" });
        if (!response.ok) throw new Error("settings");
        const settings = (await response.json()) as PublicSettings;
        setFailed(false);
        setLogo(settings.logo_dark || settings.app_logo || settings.logo_light || null);
      } catch { setLogo(null); }
    };
    load();
    const onAsset = () => load();
    window.addEventListener("neuroshost-settings-asset", onAsset);
    return () => window.removeEventListener("neuroshost-settings-asset", onAsset);
  }, []);

  if (logo && !failed) {
    return <img className={`brand-image ${compact ? "brand-image-compact" : ""} ${className}`} src={logo} alt="Neuroshost" onError={() => setFailed(true)} />;
  }

  return <span className={`brand-fallback ${className}`}>Neuro<span>shost</span></span>;
}
