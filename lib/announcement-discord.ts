import { decrypt } from "@/lib/crypto";

export function validateDiscordWebhook(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
      url.pathname.startsWith("/api/webhooks/");
  } catch {
    return false;
  }
}

export async function sendAnnouncementToDiscord(input: {
  webhook: string;
  title: string;
  url: string;
  roleIds?: string[];
}) {
  const webhook = decrypt(input.webhook);
  if (!validateDiscordWebhook(webhook)) throw new Error("Webhook Discord invalide.");

  const roleIds = Array.from(new Set((input.roleIds || [])
    .map(String)
    .filter((id) => /^\d{15,25}$/.test(id)))).slice(0, 20);

  // The announcement content is intentionally NOT sent to Discord.
  // Discord receives only the role mentions and a compact embed pointing to the website.
  const roleMentions = roleIds.map((id) => `<@&${id}>`).join(" ");
  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Neuroshost-Billing/1.0.0"
    },
    body: JSON.stringify({
      content: roleMentions || undefined,
      embeds: [{
        title: "📢 Une nouvelle annonce a été publiée",
        description: "Une nouvelle annonce a été faite sur le Site de Neuroshost.",
        url: input.url,
        color: 0x00c7eb,
        footer: { text: "Neuroshost Billing" },
        timestamp: new Date().toISOString()
      }],
      allowed_mentions: {
        parse: [],
        roles: roleIds
      }
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Discord a refusé le webhook (${response.status})${text ? `: ${text.slice(0, 250)}` : ""}`);
  }
}
