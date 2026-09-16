import { createMissingChannels, syncAllTicketMessages, syncClosedTicketChannels } from "../services/tickets.mjs";
import { syncClientRoles } from "../services/client-roles.mjs";
export function registerReadyEvent(client, getSettings) {
  client.once("clientReady", async () => {
    console.log(`Bot Neuroshost connecté : ${client.user.tag}`);
    const settings = await getSettings();
    await syncClientRoles(client, settings).catch(error => console.error("Rôle Client:", error.message));
    await createMissingChannels(client, settings).catch(error => console.error("Tickets:", error.message));
    await syncAllTicketMessages(client, settings).catch(error => console.error("Messages:", error.message));
    await syncClosedTicketChannels(client, settings).catch(error => console.error("Fermeture tickets:", error.message));
    setInterval(async () => {
      const current = await getSettings();
      await createMissingChannels(client, current).catch(error => console.error("Tickets:", error.message));
      await syncAllTicketMessages(client, current).catch(error => console.error("Messages:", error.message));
      await syncClosedTicketChannels(client, current).catch(error => console.error("Fermeture tickets:", error.message));
      await syncClientRoles(client, current).catch(error => console.error("Rôles:", error.message));
    }, 3000);
  });
}
