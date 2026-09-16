export function validateSettings(s){
  if(s.discord_enabled!=="1") throw new Error("Le bot Discord est désactivé dans l'administration Web.");
  for(const key of ["discord_bot_token","discord_client_id","discord_guild_id"]){ if(!s[key]) throw new Error(`Configuration Discord manquante : ${key}`); }
}
