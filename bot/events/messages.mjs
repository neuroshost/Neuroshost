import { handleTicketMessage } from "../services/tickets.mjs";
export function registerMessageEvents(client) { client.on("messageCreate", message => handleTicketMessage(message).catch(error => console.error("Message ticket:", error.message))); }
