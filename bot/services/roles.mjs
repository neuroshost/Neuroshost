export async function syncClientRole({client,pool,settings}){
  const roleId=String(settings.discord_client_role_id||"").trim();
  if(!roleId) return {checked:0,assigned:0};
  const guild=await client.guilds.fetch(String(settings.discord_guild_id));
  const role=await guild.roles.fetch(roleId).catch(()=>null);
  if(!role) throw new Error(`Rôle Client introuvable : ${roleId}`);
  const [users]=await pool.execute("SELECT id,discord_id FROM users WHERE role='CLIENT' AND discord_id IS NOT NULL AND discord_id<>''");
  let assigned=0;
  for(const user of users){
    const member=await guild.members.fetch(String(user.discord_id)).catch(()=>null); if(!member) continue;
    if(!member.roles.cache.has(role.id)){ try{await member.roles.add(role, "Rôle Client Neuroshost Billing"); assigned++}catch(e){console.warn(`[ROLE] Impossible d'ajouter le rôle à ${member.id}: ${e.message}`)} }
  }
  return {checked:users.length,assigned};
}
export async function assignClientRole({member,settings}){
  const roleId=String(settings.discord_client_role_id||"").trim(); if(!roleId) return false;
  const role=await member.guild.roles.fetch(roleId).catch(()=>null); if(!role) return false;
  if(!member.roles.cache.has(role.id)){ await member.roles.add(role,"Compte client Neuroshost"); return true; }
  return false;
}
