import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import AdminShell from "@/components/AdminShell";
import SettingsTabs from "./SettingsTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Settings() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const settings = await getSettings();
  return <AdminShell title="Settings"><div className="settings-tabs-card"><SettingsTabs settings={settings} /></div></AdminShell>;
}
