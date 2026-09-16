import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

function dateOrNull(value: FormDataEntryValue | null) { const v = String(value || "").trim(); return v ? v.replace("T", " ") + (v.length === 16 ? ":00" : "") : null; }

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f = await req.formData();
  const userId = Number(f.get("userId"));
  const productId = Number(f.get("productId"));
  if (!userId || !productId) return new NextResponse("User and product are required", { status: 400 });
  const planId = f.get("planId") ? Number(f.get("planId")) : null;
  const quantity = Math.max(1, Number(f.get("quantity") || 1));
  const price = Math.max(0, Number(f.get("price") || 0));
  const currency = String(f.get("currency") || "EUR").toUpperCase();
  const status = String(f.get("status") || "PENDING");
  const expiresAt = dateOrNull(f.get("expiresAt"));
  const couponId = f.get("couponId") ? Number(f.get("couponId")) : null;
  const billingAgreementId = f.get("billingAgreementId") ? Number(f.get("billingAgreementId")) : null;
  const subscriptionId = String(f.get("subscriptionId") || "").trim() || null;
  const [productRows] = await query<any[]>("SELECT name,billing_cycle FROM products WHERE id=? LIMIT 1", [productId]);
  if (!productRows) return new NextResponse("Product not found", { status: 400 });
  const [planRows] = planId ? await query<any[]>("SELECT name,billing_cycle,price FROM product_plans WHERE id=? AND product_id=? LIMIT 1", [planId, productId]) : [null];
  const cycle = planRows?.billing_cycle || productRows.billing_cycle || "MONTHLY";
  const name = `${productRows.name}${planRows?.name ? ` - ${planRows.name}` : ""}`;
  const renewAt = expiresAt;
  const [result] = await query<any[]>(`INSERT INTO services(user_id,product_id,plan_id,name,status,quantity,price,currency,coupon_id,billing_agreement_id,subscription_id,renew_at,expires_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, [userId, productId, planId, name, status, quantity, price, currency, couponId, billingAgreementId, subscriptionId, renewAt, expiresAt]);
  const id = Number(result.insertId);
  const createAnother = String(f.get("createAnother") || "") === "1";
  return NextResponse.redirect(new URL(createAnother ? "/admin/services/create" : `/admin/services/${id}`, req.url), 303);
}
