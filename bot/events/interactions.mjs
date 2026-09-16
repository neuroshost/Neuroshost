import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import { query } from "../core/database.mjs";
import { openTicket } from "../services/tickets.mjs";

function getTicketTypes(settings) {
  const raw = String(settings.ticket_departments || "Support, Sales");
  const values = raw.split(",").map(v => v.trim()).filter(Boolean);
  return values.length ? values.slice(0, 25) : ["Support", "Billing", "Technical", "Sales"];
}

function encodeCustomId(prefix, value) {
  return `${prefix}:${Buffer.from(String(value), "utf8").toString("base64url").slice(0, 80)}`;
}

function decodeCustomId(customId, prefix) {
  const encoded = String(customId).slice(`${prefix}:`.length);
  try { return Buffer.from(encoded, "base64url").toString("utf8"); } catch { return ""; }
}

export function registerInteractionEvents(client, getSettings) {
  client.on("interactionCreate", async interaction => {
    try {
      const settings = await getSettings();

      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "neuroshost") return interaction.reply({ embeds: [new EmbedBuilder().setTitle(settings.site_name || "Neuroshost").setDescription("Le bot est connecté à la plateforme Neuroshost.").setColor(0x00c7eb)], ephemeral: true });
        if (interaction.commandName === "boutique") {
          const [products] = await query("SELECT name,price,billing_cycle FROM products WHERE visible=1 ORDER BY featured DESC LIMIT 5");
          const text = products.length ? products.map(p => `• **${p.name}** — ${Number(p.price).toFixed(2)} €`).join("\n") : "Aucune offre publiée.";
          return interaction.reply({ embeds: [new EmbedBuilder().setTitle("Boutique Neuroshost").setDescription(text).setColor(0x00c7eb)], ephemeral: true });
        }
        if (interaction.commandName === "ticket") {
          const embed = new EmbedBuilder().setTitle("🎫 Support Neuroshost").setDescription("Besoin d'aide ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket avec notre équipe support.\n\nVotre ticket sera également visible dans l'administration Web.").setColor(0x00c7eb).setFooter({ text: "Neuroshost Support" });
          const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket:open").setLabel("Ouvrir un ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary));
          return interaction.reply({ embeds: [embed], components: [row] });
        }
      }

      if (interaction.isButton() && interaction.customId === "ticket:open") {
        const types = getTicketTypes(settings);
        const menu = new StringSelectMenuBuilder()
          .setCustomId("ticket:type")
          .setPlaceholder("Sélectionnez le type de ticket")
          .addOptions(types.map((type, index) => ({ label: type.slice(0, 100), value: String(index), description: `Ouvrir un ticket de type ${type}`.slice(0, 100) })));
        return interaction.reply({
          embeds: [new EmbedBuilder().setTitle("🎫 Type de ticket").setDescription("Avant de créer votre ticket, sélectionnez le type correspondant à votre demande.").setColor(0x00c7eb)],
          components: [new ActionRowBuilder().addComponents(menu)],
          ephemeral: true
        });
      }

      if (interaction.isStringSelectMenu() && interaction.customId === "ticket:type") {
        const types = getTicketTypes(settings);
        const index = Number(interaction.values[0]);
        const type = Number.isInteger(index) && types[index] ? types[index] : types[0];
        const priority = new StringSelectMenuBuilder()
          .setCustomId(encodeCustomId("ticket:priority", type))
          .setPlaceholder("Sélectionnez la priorité")
          .addOptions(
            { label: "Faible", value: "LOW", description: "Demande non urgente" },
            { label: "Normale", value: "MEDIUM", description: "Priorité standard" },
            { label: "Haute", value: "HIGH", description: "Demande importante" },
            { label: "Urgente", value: "URGENT", description: "Demande nécessitant une intervention rapide" }
          );
        return interaction.update({
          embeds: [new EmbedBuilder().setTitle("🎫 Priorité du ticket").setDescription(`Type sélectionné : **${type}**\n\nChoisissez maintenant la priorité de votre ticket.`).setColor(0x00c7eb)],
          components: [new ActionRowBuilder().addComponents(priority)]
        });
      }

      if (interaction.isStringSelectMenu() && interaction.customId.startsWith("ticket:priority:")) {
        const type = decodeCustomId(interaction.customId, "ticket:priority");
        const priority = interaction.values[0];
        return openTicket(interaction, settings, { type, priority });
      }
    } catch (error) {
      console.error(error);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) await interaction.reply({ content: "Une erreur est survenue lors de la création du ticket.", ephemeral: true }).catch(() => {});
    }
  });
}
