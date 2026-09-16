import { getSettings } from "@/lib/settings";

export type DiscordRole = { id: string; name: string; color: number; position: number; managed: boolean };

export async function getDiscordGuildRoles(): Promise<DiscordRole[]> {
  try {
    const s = await getSettings();
    const token = String(s.discord_bot_token || "").trim();
    const guildId = String(s.discord_guild_id || "").trim();
    if (!token || !guildId) return [];
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}`, Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) return [];
    const roles = await response.json() as DiscordRole[];
    return roles.filter(r => !r.managed).sort((a,b) => b.position - a.position || a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
