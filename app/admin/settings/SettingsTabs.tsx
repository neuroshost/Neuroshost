"use client";

import { useState } from "react";
import MailCodeEditor from "@/components/MailCodeEditor";
import SettingsAssetUploader from "@/components/SettingsAssetUploader";

type Settings = Record<string, string>;

type Props = { settings: Settings };

const tabs = ["General", "Security", "Social Login", "Tax", "Mail", "Tickets", "Cronjob", "Credits", "Theme", "Invoices", "Other"];

function TextField({ label, name, value, type = "text", placeholder = "", required = false }: { label: string; name: string; value?: string; type?: string; placeholder?: string; required?: boolean }) {
  return <label>{label}{required && <sup>*</sup>}<input className="input" name={name} type={type} defaultValue={value || ""} placeholder={placeholder} required={required} /></label>;
}
function SelectField({ label, name, value, children }: { label: string; name: string; value?: string; children: React.ReactNode }) {
  return <label>{label}<select className="input" name={name} defaultValue={value || ""}>{children}</select></label>;
}
function Check({ label, name, checked }: { label: string; name: string; checked?: boolean }) {
  return <label className="settings-checkline"><input type="checkbox" name={name} defaultChecked={checked} /><span>{label}</span></label>;
}
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="settings-section"><div className="settings-section-title"><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{children}</section>;
}

export default function SettingsTabs({ settings: s }: Props) {
  const [active, setActive] = useState("Mail");

  return <>
    <div className="settings-tabs" aria-label="Settings">
      {tabs.map(tab => <button key={tab} type="button" className={tab === active ? "active" : ""} onClick={() => setActive(tab)}>{tab}</button>)}
    </div>

    <form className="settings-form" action="/api/admin/settings" method="post">
      <div className={active === "General" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="General" description="Configuration générale de votre installation Neuroshost Billing.">
          <TextField label="Company Name" name="site_name" value={s.site_name || s.company_name || "Neuroshost"} required />
          <TextField label="Timezone" name="timezone" value={s.timezone || "Europe/Paris"} required />
          <SelectField label="Default Language" name="default_language" value={s.default_language || "fr"}><option value="fr">fr</option><option value="en">en</option></SelectField>
          <label>Allowed Languages*<input className="input" name="allowed_languages" defaultValue={s.allowed_languages || "AR, BN, DA, DE, EN, ES, FI, FR, HE, HI, HU, ID, IT, KO, LV, NL, NO, PL, PT, SR, SV, TR, UK, ZH"} /></label>
          <TextField label="App URL" name="app_url" value={s.app_url || "https://dashboard.neuroshost.fr"} />
          <SettingsAssetUploader label="Logo de l'application" name="app_logo" value={s.app_logo} accept="image/png,image/jpeg,image/webp,image/svg+xml" />
          <SettingsAssetUploader label="Logo (Light Mode)" name="logo_light" value={s.logo_light} accept="image/png,image/jpeg,image/webp,image/svg+xml" />
          <SettingsAssetUploader label="Logo (Dark Mode)" name="logo_dark" value={s.logo_dark} accept="image/png,image/jpeg,image/webp,image/svg+xml" />
          <SettingsAssetUploader label="Favicon" name="favicon" value={s.favicon} accept="image/png,image/x-icon,image/webp,image/svg+xml" />
          <TextField label="System Email Address" name="system_email" value={s.system_email || "neuroshost@gmail.com"} required />
          <TextField label="Terms of Service" name="terms_url" value={s.terms_url} placeholder="https://..." />
        </Section>
      </div>

      <div className={active === "Security" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Security" description="Protection anti-abus et validation des sessions.">
          <SelectField label="Captcha" name="captcha" value={s.captcha || "DISABLED"}><option value="DISABLED">Disabled</option><option value="HCAPTCHA">hCaptcha</option><option value="RECAPTCHA">reCAPTCHA</option></SelectField>
          <TextField label="Captcha Site Key" name="captcha_site_key" value={s.captcha_site_key} />
          <TextField label="Captcha Secret" name="captcha_secret" type="password" value={s.captcha_secret} />
          <TextField label="Trusted Proxies" name="trusted_proxies" value={s.trusted_proxies} placeholder="IP Addresses or CIDR (e.g. 1.1.1.1/32)" />
          <SelectField label="Session Validation" name="session_validation" value={s.session_validation || "NONE"}><option value="NONE">None</option><option value="IP">IP Address</option><option value="USER_AGENT">User Agent</option><option value="STRICT">IP + User Agent</option></SelectField>
        </Section>
      </div>

      <div className={active === "Social Login" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Social Login" description="Connexion OAuth pour les comptes utilisateurs.">
          <div className="settings-social-provider"><Check label="Google Enabled" name="google_enabled" checked={s.google_enabled === "1"} /><p className="settings-help">Documentation</p><TextField label="Google Client ID" name="google_client_id" value={s.google_client_id} /><TextField label="Google Client Secret" name="google_client_secret" type="password" value={s.google_client_secret} /></div>
          <div className="settings-social-provider"><Check label="GitHub Enabled" name="github_enabled" checked={s.github_enabled === "1"} /><p className="settings-help">Documentation</p><TextField label="GitHub Client ID" name="github_client_id" value={s.github_client_id} /><TextField label="GitHub Client Secret" name="github_client_secret" type="password" value={s.github_client_secret} /></div>
          <div className="settings-social-provider"><Check label="Discord Enabled" name="discord_enabled" checked={s.discord_enabled === "1"} /><p className="settings-help">Documentation</p><TextField label="Discord Client ID" name="discord_client_id" value={s.discord_client_id} /><TextField label="Discord Client Secret" name="discord_client_secret" type="password" value={s.discord_client_secret} /></div>
        </Section>
      </div>

      <div className={active === "Tax" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Tax" description="Configuration globale de la taxation.">
          <Check label="Tax Enabled" name="tax_enabled" checked={s.tax_enabled !== "0"} />
          <SelectField label="Tax Type" name="tax_type" value={s.tax_type || "EXCLUSIVE"}><option value="EXCLUSIVE">Exclusive (Price does not include tax)</option><option value="INCLUSIVE">Inclusive (Price includes tax)</option></SelectField>
        </Section>
      </div>

      <div className={active === "Mail" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Mail" description="Configurez le serveur SMTP utilisé par Neuroshost Billing.">
          <Check label="Disable Mail" name="mail_disabled" checked={s.mail_disabled === "1"} />
          <Check label="Users must verify email before buying" name="mail_verify_email" checked={s.mail_verify_email !== "0"} />
          <div className="two"><TextField label="Mail Host" name="smtp_host" value={s.smtp_host || "smtp.gmail.com"} required /><TextField label="Mail Port" name="smtp_port" value={s.smtp_port || "587"} required /></div>
          <div className="two"><TextField label="Mail Username" name="smtp_user" value={s.smtp_user} required /><TextField label="Mail Password" name="smtp_password" type="password" placeholder="Laisser vide pour conserver le mot de passe actuel" /></div>
          <div className="two"><SelectField label="Mail Encryption" name="smtp_encryption" value={s.smtp_encryption || "STARTTLS"}><option value="STARTTLS">STARTTLS</option><option value="SSL">SSL / TLS</option><option value="NONE">Aucune</option></SelectField><TextField label="Mail From Address" name="smtp_from" value={s.smtp_from || "neuroshost@gmail.com"} required /></div>
          <TextField label="Mail From Name" name="mail_from_name" value={s.mail_from_name || "Neuroshost Billing"} required />
        </Section>
        <Section title="HTML / CSS des e-mails" description="Header et Footer acceptent du HTML libre. Mail CSS accepte du CSS libre. Ces contenus sont enregistrés tels quels et utilisés lors de la génération des e-mails.">
          <MailCodeEditor headerDefault={s.mail_header || ""} footerDefault={s.mail_footer || ""} cssDefault={s.mail_css || ""} />
        </Section>
      </div>

      <div className={active === "Tickets" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Tickets" description="Configuration du système de tickets clients.">
          <Check label="Disable Tickets" name="tickets_disabled" checked={s.tickets_disabled === "1"} />
          <p className="settings-help">Disable the ticket system. This disables client ticket creation and viewing.</p>
          <label>Ticket Departments*<input className="input" name="ticket_departments" defaultValue={s.ticket_departments || "Support, Sales"} /></label>
          <Check label="Disallow clients from closing tickets" name="tickets_disallow_close" checked={s.tickets_disallow_close !== "0"} />
          <Check label="Email Piping" name="tickets_email_piping" checked={s.tickets_email_piping !== "0"} />
          <TextField label="Email Host" name="tickets_email_host" value={s.tickets_email_host || "imap.gmail.com"} />
          <TextField label="Email Port" name="tickets_email_port" value={s.tickets_email_port || "993"} />
          <TextField label="Email Address" name="tickets_email_address" value={s.tickets_email_address || "neuroshost@gmail.com"} />
          <TextField label="Email Password" name="tickets_email_password" type="password" placeholder="Laisser vide pour conserver le mot de passe actuel" />
        </Section>
      </div>

      <div className={active === "Cronjob" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Cronjob" description="Tâches automatiques quotidiennes.">
          <TextField label="Cron Job Time" name="cron_time" value={s.cron_time || "00:00"} type="time" required />
          <TextField label="Send invoice if due date is x days away" name="cron_invoice_send_days" value={s.cron_invoice_send_days || "7"} type="number" required />
          <TextField label="Send invoice reminder if due date is x days away" name="cron_invoice_reminder_days" value={s.cron_invoice_reminder_days || "3"} type="number" required />
          <TextField label="Cancel order if pending for x days" name="cron_cancel_pending_days" value={s.cron_cancel_pending_days || "7"} type="number" required />
          <TextField label="Suspend server if invoice is x days overdue" name="cron_suspend_days" value={s.cron_suspend_days || "2"} type="number" required />
          <TextField label="Delete server if invoice is x days overdue" name="cron_delete_server_days" value={s.cron_delete_server_days || "14"} type="number" required />
          <TextField label="Delete email logs older than x days" name="cron_delete_email_logs_days" value={s.cron_delete_email_logs_days || "90"} type="number" required />
          <TextField label="Close tickets if no response for x days" name="cron_close_tickets_days" value={s.cron_close_tickets_days || "7"} type="number" required />
        </Section>
      </div>

      <div className={active === "Credits" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Credits" description="Gestion des crédits prépayés des clients.">
          <Check label="Credits Enabled" name="credits_enabled" checked={s.credits_enabled !== "0"} />
          <TextField label="Minimum Deposit" name="credits_min_deposit" value={s.credits_min_deposit || "5"} type="number" required />
          <TextField label="Maximum Deposit" name="credits_max_deposit" value={s.credits_max_deposit || "100"} type="number" required />
          <TextField label="Maximum Credit" name="credits_max_credit" value={s.credits_max_credit || "300"} type="number" required />
          <Check label="Automatically use credits" name="credits_auto_use" checked={s.credits_auto_use !== "0"} />
          <p className="settings-help">Automatically pay recurring invoices using available credits.</p>
          <Check label="Enable credits on service downgrade" name="credits_downgrade" checked={s.credits_downgrade !== "0"} />
          <p className="settings-help">Give back credits for the prorated difference when a client downgrades a service.</p>
        </Section>
      </div>

      <div className={active === "Theme" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Theme" description="Personnalisation des couleurs de l'interface.">
          <SelectField label="Theme" name="theme" value={s.theme || "neuroshost"}><option value="neuroshost">neuroshost</option><option value="default">default</option></SelectField>
          <TextField label="Couleur principale de la marque (claire)" name="theme_light_primary" value={s.theme_light_primary || "hsl(205, 100%, 48%)"} />
          <TextField label="Couleur secondaire de la marque (claire)" name="theme_light_secondary" value={s.theme_light_secondary || "hsl(200, 100%, 67%)"} />
          <TextField label="Bordures, accents... (Clair)" name="theme_light_border" value={s.theme_light_border || "hsl(210, 28%, 88%)"} />
          <TextField label="Base – Couleur du texte (clair)" name="theme_light_text" value={s.theme_light_text || "hsl(220, 35%, 12%)"} />
          <TextField label="Atténué – Couleur du texte (clair)" name="theme_light_muted" value={s.theme_light_muted || "hsl(215, 20%, 38%)"} />
          <TextField label="Inversé – Couleur du texte (clair)" name="theme_light_inverse" value={s.theme_light_inverse || "hsl(0, 0%, 100%)"} />
          <TextField label="Fond – Couleur (Clair)" name="theme_light_bg" value={s.theme_light_bg || "hsl(210, 40%, 99%)"} />
          <TextField label="Fond – Couleur secondaire (Clair)" name="theme_light_bg_secondary" value={s.theme_light_bg_secondary || "hsl(210, 30%, 96%)"} />
          <TextField label="Couleur principale de la marque (sombre)" name="theme_dark_primary" value={s.theme_dark_primary || "hsl(205, 100%, 48%)"} />
          <TextField label="Couleur secondaire de la marque (sombre)" name="theme_dark_secondary" value={s.theme_dark_secondary || "hsl(200, 100%, 67%)"} />
          <TextField label="Bordures, accents... (Sombre)" name="theme_dark_border" value={s.theme_dark_border || "hsl(215, 20%, 20%)"} />
          <TextField label="Base – Couleur du texte (sombre)" name="theme_dark_text" value={s.theme_dark_text || "hsl(0, 0%, 98%)"} />
          <TextField label="Atténué – Couleur du texte (sombre)" name="theme_dark_muted" value={s.theme_dark_muted || "hsl(215, 18%, 70%)"} />
          <TextField label="Inversé – Couleur du texte (sombre)" name="theme_dark_inverse" value={s.theme_dark_inverse || "hsl(210, 25%, 35%)"} />
          <TextField label="Fond – Couleur (Sombre)" name="theme_dark_bg" value={s.theme_dark_bg || "hsl(220, 28%, 10%)"} />
          <TextField label="Fond – Couleur secondaire (Sombre)" name="theme_dark_bg_secondary" value={s.theme_dark_bg_secondary || "hsl(220, 25%, 14%)"} />
        </Section>
      </div>

      <div className={active === "Invoices" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Invoices" description="Numérotation et comportement des factures.">
          <label>Bill To Text<textarea className="input settings-textarea" name="invoice_bill_to" defaultValue={s.invoice_bill_to || ""} /></label>
          <TextField label="Invoice Number" name="invoice_number" value={s.invoice_number || "1"} type="number" />
          <p className="settings-help">The next invoice number to use. This will be incremented automatically.</p>
          <TextField label="Invoice Number Padding" name="invoice_padding" value={s.invoice_padding || "1"} type="number" />
          <p className="settings-help">Number of digits to use for invoice numbers. Example: 001, 002, etc.</p>
          <TextField label="Invoice number format" name="invoice_format" value={s.invoice_format || "INV-{number}"} />
          <p className="settings-help">Use {'{number}'} to insert the zero padded number and {'{year}'}, {'{month}'} and {'{day}'} for the current date.</p>
          <Check label="Proforma Invoices" name="invoice_proforma" checked={s.invoice_proforma !== "0"} />
          <p className="settings-help">Proforma invoices will not be assigned an official invoice number until payment is received.</p>
          <Check label="Invoice Snapshot" name="invoice_snapshot" checked={s.invoice_snapshot !== "0"} />
          <p className="settings-help">Save a snapshot of important customer data on the invoice when it is paid.</p>
        </Section>
      </div>

      <div className={active === "Other" ? "settings-tab-panel" : "settings-tab-panel hidden"}>
        <Section title="Other" description="Autres paramètres globaux de la plateforme.">
          <SelectField label="Gravatar Default" name="gravatar_default" value={s.gravatar_default || "Wavatar"}><option>Wavatar</option><option>Identicon</option><option>Retro</option><option>Robohash</option></SelectField>
          <SelectField label="Default Currency" name="default_currency" value={s.default_currency || "EUR"}><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></SelectField>
          <Check label="Disable User Registration" name="disable_registration" checked={s.disable_registration === "1"} />
          <p className="settings-help">Only allow existing users to log in. This hides the registration page and prevents new users from signing up.</p>
          <TextField label="Pagination" name="pagination" value={s.pagination || "50"} type="number" required />
          <p className="settings-help">Number of items to show per page.</p>
          <Check label="Debug Mode" name="debug_mode" checked={s.debug_mode === "1"} />
          <p className="settings-help">Enable debug mode to log HTTP requests and errors.</p>
        </Section>
      </div>

      <div className="settings-actions"><button className="btn primary" type="submit">Save</button></div>
    </form>
  </>;
}
