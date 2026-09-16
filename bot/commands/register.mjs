import { REST, Routes, SlashCommandBuilder } from "discord.js";

export async function registerCommands(settings) {
  const commands = [
    new SlashCommandBuilder()
      .setName("neuroshost")
      .setDescription("Afficher l'état de Neuroshost"),
    new SlashCommandBuilder()
      .setName("boutique")
      .setDescription("Afficher un résumé de la boutique"),
    new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("Afficher le panneau pour ouvrir un ticket")
  ].map(command => command.setDMPermission(false).toJSON());

  const rest = new REST({ version: "10" }).setToken(settings.discord_bot_token);
  const applicationId = String(settings.discord_client_id);
  const guildId = String(settings.discord_guild_id);

  await rest.put(
    Routes.applicationGuildCommands(applicationId, guildId),
    { body: commands }
  );

  console.log("Commandes Discord enregistrées : /neuroshost, /boutique, /ticket");
}
