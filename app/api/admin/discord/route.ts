import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f = await req.formData();
  await setSetting("discord_enabled", String(f.get("discord_enabled") || "0"));
  await setSetting("discord_client_id", String(f.get("discord_client_id") || ""));
  await setSetting("discord_guild_id", String(f.get("discord_guild_id") || ""));
  await setSetting("discord_log_channel_id", String(f.get("discord_log_channel_id") || ""));
  await setSetting("discord_client_role_id", String(f.get("discord_client_role_id") || "").trim());
  await setSetting("discord_ticket_category_id", String(f.get("discord_ticket_category_id") || "").trim());
  await setSetting("discord_ticket_support_role_id", String(f.get("discord_ticket_support_role_id") || "").trim());
  const token = String(f.get("discord_bot_token") || "");
  if (token) await setSetting("discord_bot_token", token, { secret: true });
  return NextResponse.redirect(new URL("/admin/discord?saved=1", req.url), 303);
}
