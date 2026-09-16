import crypto from "node:crypto";
import { query } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

export type StripeGateway = { id:number; name:string; settings:Record<string,any> };

export async function getStripeGateway(): Promise<StripeGateway | null> {
  const rows = await query<any[]>("SELECT id,name,settings FROM gateways WHERE enabled=1 AND LOWER(gateway_type)='stripe' ORDER BY id ASC LIMIT 1");
  if (!rows[0]) return null;
  let settings:Record<string,any> = {};
  try { settings = JSON.parse(decrypt(rows[0].settings || "{}")); } catch { settings = {}; }
  return { id:Number(rows[0].id), name:String(rows[0].name), settings };
}

function secret(gateway:StripeGateway) {
  const key = String(gateway.settings.secret_key || "").trim();
  if (!/^sk_(test|live)_/.test(key)) throw new Error("Clé secrète Stripe invalide ou absente.");
  return key;
}

export async function stripeRequest(path:string, body:Record<string,string> = {}, gateway:StripeGateway) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method:"POST",
    headers:{ Authorization:`Bearer ${secret(gateway)}`, "Content-Type":"application/x-www-form-urlencoded" },
    body:new URLSearchParams(body).toString(),
    cache:"no-store"
  });
  const data:any = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(String(data?.error?.message || `Erreur Stripe ${response.status}`));
  return data;
}

export function verifyStripeSignature(payload:string, signature:string, webhookSecret:string, toleranceSeconds=300) {
  const parts = signature.split(",");
  const timestamp = parts.find(x=>x.startsWith("t="))?.slice(2);
  const signatures = parts.filter(x=>x.startsWith("v1=")).map(x=>x.slice(3));
  if (!timestamp || !signatures.length || !/^whsec_/.test(webhookSecret)) return false;
  const age = Math.abs(Math.floor(Date.now()/1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some(value => {
    try { return crypto.timingSafeEqual(Buffer.from(value,"hex"), Buffer.from(expected,"hex")); } catch { return false; }
  });
}

export function stripeInterval(cycle:string) {
  if (cycle === "YEARLY") return { interval:"year", interval_count:"1" };
  if (cycle === "QUARTERLY") return { interval:"month", interval_count:"3" };
  return { interval:"month", interval_count:"1" };
}
