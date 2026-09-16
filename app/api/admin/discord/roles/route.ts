import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const s = await getSettings();
  const token = s.discord_bot_token ? decrypt(s.discord_bot_token) : "";
  const guildId = String(s.discord_guild_id || "").trim();
  if (!token || !guildId) return NextResponse.json({ error: "Configurez d'abord le token du bot et l'ID du serveur Discord." }, { status: 400 });
  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, { headers: { Authorization: `Bot ${token}`, "User-Agent": "Neuroshost-Billing/1.0.0" }, cache: "no-store" });
  const data = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: `Discord a refusé la requête (${response.status}).` }, { status: response.status });
  const roles = Array.isArray(data) ? data.map((r:any) => ({ id: String(r.id), name: String(r.name), color: Number(r.color || 0), managed: Boolean(r.managed) })) : [];
  roles.sort((a:any,b:any) => a.name.localeCompare(b.name, "fr"));
  return NextResponse.json({ roles });
}
