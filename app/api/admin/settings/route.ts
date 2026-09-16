import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

const secretKeys = new Set([
  "smtp_password", "captcha_secret", "google_client_secret", "github_client_secret", "discord_client_secret", "tickets_email_password"
]);
const publicKeys = new Set([
  "site_name", "company_name", "app_logo", "hero_title", "hero_subtitle", "primary_color", "timezone", "default_language", "allowed_languages", "app_url", "logo_light", "logo_dark", "favicon", "system_email", "terms_url", "theme", "theme_light_primary", "theme_light_secondary", "theme_light_border", "theme_light_text", "theme_light_muted", "theme_light_inverse", "theme_light_bg", "theme_light_bg_secondary", "theme_dark_primary", "theme_dark_secondary", "theme_dark_border", "theme_dark_text", "theme_dark_muted", "theme_dark_inverse", "theme_dark_bg", "theme_dark_bg_secondary", "default_currency"
]);
const fields = [
  "site_name", "company_name", "app_logo", "hero_title", "hero_subtitle", "primary_color", "timezone", "default_language", "allowed_languages", "app_url", "logo_light", "logo_dark", "favicon", "system_email", "terms_url",
  "captcha", "captcha_site_key", "captcha_secret", "trusted_proxies", "session_validation",
  "google_enabled", "google_client_id", "google_client_secret", "github_enabled", "github_client_id", "github_client_secret", "discord_enabled", "discord_client_id", "discord_client_secret",
  "tax_enabled", "tax_type",
  "mail_disabled", "mail_verify_email", "smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from", "smtp_encryption", "mail_from_name", "mail_header", "mail_footer", "mail_css",
  "tickets_disabled", "ticket_departments", "tickets_disallow_close", "tickets_email_piping", "tickets_email_host", "tickets_email_port", "tickets_email_address", "tickets_email_password",
  "cron_time", "cron_invoice_send_days", "cron_invoice_reminder_days", "cron_cancel_pending_days", "cron_suspend_days", "cron_delete_server_days", "cron_delete_email_logs_days", "cron_close_tickets_days",
  "credits_enabled", "credits_min_deposit", "credits_max_deposit", "credits_max_credit", "credits_auto_use", "credits_downgrade",
  "theme", "theme_light_primary", "theme_light_secondary", "theme_light_border", "theme_light_text", "theme_light_muted", "theme_light_inverse", "theme_light_bg", "theme_light_bg_secondary", "theme_dark_primary", "theme_dark_secondary", "theme_dark_border", "theme_dark_text", "theme_dark_muted", "theme_dark_inverse", "theme_dark_bg", "theme_dark_bg_secondary",
  "invoice_bill_to", "invoice_number", "invoice_padding", "invoice_format", "invoice_proforma", "invoice_snapshot",
  "gravatar_default", "default_currency", "disable_registration", "pagination", "debug_mode"
];
const checkboxKeys = new Set([
  "google_enabled", "github_enabled", "discord_enabled", "tax_enabled", "mail_disabled", "mail_verify_email", "tickets_disabled", "tickets_disallow_close", "tickets_email_piping", "credits_enabled", "credits_auto_use", "credits_downgrade", "invoice_proforma", "invoice_snapshot", "disable_registration", "debug_mode"
]);

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f = await req.formData();

  for (const key of fields) {
    let value: string;
    if (checkboxKeys.has(key)) value = f.get(key) ? "1" : "0";
    else value = String(f.get(key) ?? "");

    // Password fields are intentionally skipped when left blank so an existing secret remains unchanged.
    if (secretKeys.has(key) && !value) continue;
    await setSetting(key, value, { secret: secretKeys.has(key), publicValue: publicKeys.has(key) });
  }

  return NextResponse.redirect(new URL("/admin/settings?saved=1", req.url), 303);
}
