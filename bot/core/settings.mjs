import { query } from "./database.mjs";
import { decrypt } from "./crypto.mjs";
export async function loadSettings() {
  const [rows] = await query("SELECT setting_key,setting_value,is_secret FROM settings WHERE setting_key LIKE 'discord_%' OR setting_key='site_name'");
  return Object.fromEntries(rows.map(row => [row.setting_key, row.is_secret ? decrypt(row.setting_value) : row.setting_value]));
}
