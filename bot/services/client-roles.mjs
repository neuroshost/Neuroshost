import { query } from "../core/database.mjs";
export async function syncClientRoles(client, settings) {
  const roleId = String(settings.discord_client_role_id || "").trim();
  if (!roleId) return;
  const guild = await client.guilds.fetch(String(settings.discord_guild_id));
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) return console.warn(`Rôle Client introuvable : ${roleId}`);
  const [users] = await query("SELECT id,discord_id FROM users WHERE role='CLIENT' AND discord_id IS NOT NULL AND discord_id<>''");
  for (const user of users) {
    const member = await guild.members.fetch(String(user.discord_id)).catch(() => null);
    if (!member || member.user.bot) continue;
    if (!member.roles.cache.has(role.id)) await member.roles.add(role, "Client Neuroshost").catch(() => {});
  }
}
