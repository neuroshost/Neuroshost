import {SlashCommandBuilder} from "discord.js";
export const commands=[
  new SlashCommandBuilder().setName("neuroshost").setDescription("Afficher l'état de Neuroshost"),
  new SlashCommandBuilder().setName("boutique").setDescription("Afficher un résumé de la boutique"),
  new SlashCommandBuilder().setName("c").setDescription("Afficher le nombre de tickets ouverts"),
  new SlashCommandBuilder().setName("ticket").setDescription("Créer un ticket support depuis Discord")
    .addStringOption(o=>o.setName("sujet").setDescription("Sujet du ticket").setRequired(true).setMaxLength(191))
    .addStringOption(o=>o.setName("message").setDescription("Premier message").setRequired(true).setMaxLength(1900))
].map(c=>c.toJSON());
