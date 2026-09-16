import { Client, GatewayIntentBits } from "discord.js";
import { loadSettings } from "./core/settings.mjs";
import { registerCommands } from "./commands/register.mjs";
import { registerReadyEvent } from "./events/ready.mjs";
import { registerInteractionEvents } from "./events/interactions.mjs";
import { registerMessageEvents } from "./events/messages.mjs";

let settings = await loadSettings();
if (settings.discord_enabled !== "1") throw new Error("Le bot Discord est désactivé dans l'administration Web.");
if (!settings.discord_bot_token || !settings.discord_client_id || !settings.discord_guild_id) {
  throw new Error("Configuration Discord incomplète dans l'administration Web.");
}

const getSettings = async () => {
  settings = await loadSettings();
  return settings;
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// The command registration happens after the Discord client is connected.
// This makes the guild command deployment more reliable and guarantees /ticket
// is refreshed whenever the bot starts.
client.once("clientReady", async () => {
  try {
    const current = await getSettings();
    await registerCommands(current);
  } catch (error) {
    console.error("Enregistrement des commandes Discord :", error?.message || error);
  }
});

registerReadyEvent(client, getSettings);
registerInteractionEvents(client, getSettings);
registerMessageEvents(client);

await client.login(settings.discord_bot_token);
