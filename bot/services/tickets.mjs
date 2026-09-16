import { query } from "../core/database.mjs";
import { ChannelType, PermissionFlagsBits, EmbedBuilder } from "discord.js";

const DEFAULT_TICKET_CATEGORY_ID = "1549681145938186340";

export function ticketChannelName(id, subject) {
  const clean = String(subject || "ticket").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "ticket";
  return `ticket-${id}-${clean}`;
}

const channelCreationLocks = new Map();

async function createTicketChannelUnlocked(ticket, guild, settings) {
  if (ticket.discord_channel_id) return guild.channels.fetch(ticket.discord_channel_id).catch(() => null);
  const categoryId = String(settings.discord_ticket_category_id || DEFAULT_TICKET_CATEGORY_ID).trim();
  const supportRoleId = String(settings.discord_ticket_support_role_id || "").trim();
  const discordUserId = ticket.discord_id || ticket.discord_user_id || null;
  const member = discordUserId ? await guild.members.fetch(String(discordUserId)).catch(() => null) : null;
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: guild.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
  ];
  if (member) overwrites.push({ id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  if (supportRoleId) overwrites.push({ id: supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  const channel = await guild.channels.create({ name: ticketChannelName(ticket.id, ticket.subject), type: ChannelType.GuildText, parent: categoryId || undefined, permissionOverwrites: overwrites, topic: `Neuroshost Ticket #${ticket.id}` });
  await query("UPDATE tickets SET discord_channel_id=? WHERE id=?", [channel.id, ticket.id]);
  return channel;
}

export async function createTicketChannel(ticket, guild, settings) {
  if (ticket.discord_channel_id) return guild.channels.fetch(ticket.discord_channel_id).catch(() => null);
  const ticketId = String(ticket.id);
  const existingLock = channelCreationLocks.get(ticketId);
  if (existingLock) return existingLock;

  const promise = createTicketChannelUnlocked(ticket, guild, settings).finally(() => {
    channelCreationLocks.delete(ticketId);
  });
  channelCreationLocks.set(ticketId, promise);
  return promise;
}

function htmlToText(value) {
  return String(value || "").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}

export async function syncWebMessages(channel) {
  const [messages] = await query("SELECT tm.id,tm.source,tm.message,u.name author_name FROM ticket_messages tm LEFT JOIN users u ON u.id=tm.author_user_id WHERE tm.discord_message_id IS NULL AND tm.ticket_id IN (SELECT id FROM tickets WHERE discord_channel_id=?) ORDER BY tm.id ASC", [channel.id]);
  for (const row of messages) {
    const text = htmlToText(row.message);
    const embed = new EmbedBuilder().setDescription(text.slice(0, 4000) || "(message HTML)").setColor(row.source === "DISCORD" ? 0x5865f2 : 0x00c7eb).setFooter({ text: `Neuroshost • ${row.author_name || row.source}` });
    const sent = await channel.send({ embeds: [embed] }).catch(() => null);
    if (sent) await query("UPDATE ticket_messages SET discord_message_id=?,discord_synced_at=NOW() WHERE id=?", [sent.id, row.id]);
  }
}

export async function syncClosedTicketChannels(client, settings) {
  const guildId = String(settings.discord_guild_id || "").trim();
  if (!guildId) return;
  const guild = await client.guilds.fetch(guildId);
  const [tickets] = await query("SELECT id,discord_channel_id,status FROM tickets WHERE discord_channel_id IS NOT NULL AND status='CLOSED' ORDER BY id DESC LIMIT 100");

  for (const ticket of tickets) {
    if (!ticket.discord_channel_id) continue;

    const channel = await guild.channels.fetch(ticket.discord_channel_id).catch(() => null);

    // Si le salon existe encore, on le supprime du serveur Discord.
    // La suppression est volontaire : la fermeture depuis le Web clôture
    // définitivement le salon Discord associé au ticket.
    if (channel) {
      try {
        await channel.delete(`Neuroshost Ticket #${ticket.id} fermé depuis le Web`);
        console.log(`Salon Discord du ticket #${ticket.id} supprimé après fermeture Web.`);
      } catch (error) {
        console.error(`Suppression du salon ticket #${ticket.id}:`, error.message);
        continue;
      }
    }

    // Le salon n'existe plus : on retire sa référence pour garder la base
    // cohérente. Le ticket reste CLOSED et ne sera pas recréé.
    await query("UPDATE tickets SET discord_channel_id=NULL WHERE id=? AND status='CLOSED'", [ticket.id]).catch(error => {
      console.error(`Nettoyage du salon ticket #${ticket.id}:`, error.message);
    });
  }
}

export async function createMissingChannels(client, settings) {
  const guild = await client.guilds.fetch(String(settings.discord_guild_id));
  const [tickets] = await query("SELECT t.*,u.discord_id FROM tickets t LEFT JOIN users u ON u.id=t.user_id WHERE t.discord_channel_id IS NULL AND t.status<>'CLOSED' ORDER BY t.id ASC LIMIT 25");
  for (const ticket of tickets) {
    const channel = await createTicketChannel(ticket, guild, settings).catch(error => { console.error(`Création salon ticket #${ticket.id}:`, error.message); return null; });
    if (!channel) continue;
    await channel.send({ embeds: [new EmbedBuilder().setTitle(`🎫 Ticket #${ticket.id}`).setDescription(`**${ticket.subject}**\n\nCe ticket est synchronisé avec l'espace support Neuroshost.`).setColor(0x00c7eb)] }).catch(() => {});
    await syncWebMessages(channel);
  }
}

export async function syncAllTicketMessages(client, settings) {
  const guild = await client.guilds.fetch(String(settings.discord_guild_id));
  const [tickets] = await query("SELECT t.* FROM tickets t WHERE t.discord_channel_id IS NOT NULL ORDER BY t.id DESC LIMIT 100");
  for (const ticket of tickets) {
    const channel = await guild.channels.fetch(ticket.discord_channel_id).catch(() => null);
    if (channel?.isTextBased()) await syncWebMessages(channel);
  }
}

const openingTickets = new Set();

export async function openTicket(interaction, settings, ticketOptions = {}) {
  const discordUserId = String(interaction.user.id);
  if (openingTickets.has(discordUserId)) {
    return interaction.reply({ content: "La création de votre ticket est déjà en cours.", ephemeral: true }).catch(() => {});
  }
  openingTickets.add(discordUserId);
  try {
    const [users] = await query("SELECT id,name,email,role FROM users WHERE discord_id=? LIMIT 1", [discordUserId]);
    const user = users[0] || null;

    // One active Discord ticket per Discord user. This prevents double creation
    // when the button is clicked twice or Discord retries an interaction.
    const [existing] = await query(
      "SELECT t.id,t.subject,t.discord_channel_id,t.status FROM tickets t LEFT JOIN users u ON u.id=t.user_id WHERE t.status<>'CLOSED' AND (t.discord_user_id=? OR u.discord_id=?) ORDER BY t.id DESC LIMIT 1",
      [discordUserId, discordUserId]
    );
    if (existing[0]) {
      if (existing[0].status !== "CLOSED") {
        await query("UPDATE tickets SET discord_user_id=COALESCE(discord_user_id,?) WHERE id=?", [discordUserId, existing[0].id]).catch(() => {});
      }
      let existingChannel = null;
      if (existing[0].discord_channel_id) {
        existingChannel = await interaction.guild.channels.fetch(existing[0].discord_channel_id).catch(() => null);
      }
      const target = existingChannel ? ` <#${existingChannel.id}>` : "";
      return interaction.reply({ content: `Vous avez déjà un ticket ouvert : #${existing[0].id}.${target}`, ephemeral: true });
    }

    const allowedPriorities = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);
    const priority = allowedPriorities.has(String(ticketOptions.priority)) ? String(ticketOptions.priority) : "MEDIUM";
    const type = String(ticketOptions.type || "Support").trim().slice(0, 191) || "Support";
    const subject = `Ticket ${type}`.slice(0, 191);

    const [result] = await query(
      "INSERT INTO tickets(user_id,discord_user_id,subject,status,priority,department) VALUES(?,?,?,'OPEN',?,?)",
      [user?.id ?? null, discordUserId, subject, priority, type]
    );
    const ticketId = Number(result.insertId);
    if (!Number.isInteger(ticketId) || ticketId <= 0) throw new Error("Impossible de récupérer l'ID du ticket créé.");

    const channel = await createTicketChannel(
      { id: ticketId, subject, discord_id: discordUserId },
      interaction.guild,
      settings
    );
    if (!channel) throw new Error("Impossible de créer le salon Discord du ticket.");

    await query(
      "INSERT INTO ticket_messages(ticket_id,author_user_id,source,message,discord_message_id,discord_synced_at) VALUES(?,?, 'DISCORD', ?, NULL, NULL)",
      [ticketId, user?.id ?? null, `<p>Ticket ouvert depuis Discord par <strong>${interaction.user.username}</strong>.</p>`]
    );

    await interaction.reply({ content: `Ticket #${ticketId} créé : ${channel}`, ephemeral: true });
    await channel.send({
      embeds: [new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketId}`)
        .setDescription(`Bonjour <@${discordUserId}> !\n\nVotre ticket a été créé. Un membre du support va vous répondre ici.\n\n**Type :** ${type}\n**Priorité :** ${priority}\n\nLe ticket est également disponible dans l'administration Web.`)
        .setColor(0x00c7eb)]
    });
    await syncWebMessages(channel);
  } finally {
    openingTickets.delete(discordUserId);
  }
}

export async function handleTicketMessage(message) {
  if (message.author.bot || !message.guild) return;
  const [tickets] = await query("SELECT id,user_id,status FROM tickets WHERE discord_channel_id=? LIMIT 1", [message.channel.id]);
  const ticket = tickets[0];
  if (!ticket || ticket.status === "CLOSED") return;
  const [users] = await query("SELECT id FROM users WHERE discord_id=? LIMIT 1", [message.author.id]);
  const authorId = users[0]?.id ?? ticket.user_id ?? null;
  const safe = String(message.content || "").trim();
  if (!safe && !message.attachments.size) return;
  const content = safe ? `<p>${safe.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>")}</p>` : `<p>${message.attachments.size} pièce(s) jointe(s).</p>`;
  await query("INSERT INTO ticket_messages(ticket_id,author_user_id,source,message,discord_message_id,discord_synced_at) VALUES(?,?, 'DISCORD', ?, ?, NOW())", [ticket.id, authorId, content, message.id]);
  await query("UPDATE tickets SET status='OPEN' WHERE id=?", [ticket.id]);
}
