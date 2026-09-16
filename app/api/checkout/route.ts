import { NextRequest, NextResponse } from "next/server";
import { requireClient } from "@/lib/auth";
import { query } from "@/lib/db";
import { getPublicOrigin } from "@/lib/public-url";
import { getStripeGateway, stripeRequest, stripeInterval } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function money(value:any){ return Math.max(0, Math.round(Number(value || 0) * 100) / 100); }

async function couponFor(code:string, productId:number) {
  if (!code) return null;
  const rows = await query<any[]>(`SELECT c.* FROM coupons c LEFT JOIN coupon_products cp ON cp.coupon_id=c.id
    WHERE UPPER(c.code)=UPPER(?) AND (c.starts_at IS NULL OR c.starts_at<=NOW()) AND (c.expires_at IS NULL OR c.expires_at>=NOW())
    AND (NOT EXISTS(SELECT 1 FROM coupon_products x WHERE x.coupon_id=c.id) OR cp.product_id=?) LIMIT 1`, [code, productId]);
  return rows[0] || null;
}

export async function POST(req:NextRequest){
  const session = await requireClient().catch(()=>null);
  if (!session) return NextResponse.redirect(new URL(`/client/login?next=${encodeURIComponent("/shop")}`, getPublicOrigin(req)),303);
  try {
    const f = await req.formData();
    const productId = Number(f.get("productId"));
    const planId = Number(f.get("planId") || 0) || null;
    const quantity = Math.max(1, Math.min(99, Number(f.get("quantity") || 1)));
    const couponCode = String(f.get("coupon") || "").trim();
    if (!productId || f.get("acceptTerms") !== "1") throw new Error("Vous devez accepter les CGU et CGV.");

    const products = await query<any[]>(`SELECT p.*, s.name server_name FROM products p LEFT JOIN servers s ON s.id=p.server_id
      WHERE p.id=? AND p.visible=1 AND COALESCE(p.hide_product,0)=0 LIMIT 1`, [productId]);
    const product = products[0];
    if (!product) throw new Error("Produit introuvable.");
    if (product.stock !== null && Number(product.stock) < quantity) throw new Error("Stock insuffisant.");
    if (product.per_user_limit !== null) {
      const used = await query<any[]>("SELECT COALESCE(SUM(quantity),0) n FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=? AND oi.product_id=? AND o.status IN ('PENDING','PAID')", [Number(session.id),productId]);
      if (Number(used[0]?.n||0) + quantity > Number(product.per_user_limit)) throw new Error("La limite par utilisateur pour ce produit a été atteinte.");
    }

    let plan:any = null;
    if (planId) {
      plan = (await query<any[]>("SELECT * FROM product_plans WHERE id=? AND product_id=? AND enabled=1 LIMIT 1",[planId,productId]))[0];
      if (!plan) throw new Error("Plan invalide.");
    }
    const cycle = String(plan?.billing_cycle || product.billing_cycle || "ONE_TIME");
    const baseUnit = money(plan ? (Number(plan.initial_price || 0) > 0 ? plan.initial_price : plan.price) : product.price);
    let total = money(baseUnit * quantity);
    const coupon = await couponFor(couponCode,productId);
    let discount = 0;
    if (coupon) discount = coupon.type === "PERCENTAGE" ? money(total * Number(coupon.value)/100) : money(Number(coupon.value));
    total = money(Math.max(0,total-discount));

    const [existing] = await Promise.all([query<any[]>("SELECT id FROM orders WHERE user_id=? AND status='PENDING' AND created_at>DATE_SUB(NOW(),INTERVAL 30 MINUTE) ORDER BY id DESC LIMIT 1",[Number(session.id)])]);
    let orderId:number;
    if (existing[0]) {
      orderId = Number(existing[0].id);
      await query("DELETE FROM order_items WHERE order_id=?",[orderId]);
      await query("UPDATE orders SET total=?,currency=?,gateway=NULL,external_id=NULL WHERE id=?",[total,String(product.currency||"EUR"),orderId]);
    } else {
      const r:any = await query<any>("INSERT INTO orders(user_id,status,total,currency,gateway) VALUES(?,?,?,?,?)",[Number(session.id),"PENDING",total,String(product.currency||"EUR"),"Stripe"]);
      orderId = Number(r.insertId);
    }
    await query("INSERT INTO order_items(order_id,product_id,product_name,quantity,unit_price,plan_id,coupon_id) VALUES(?,?,?,?,?,?,?)",[orderId,productId,String(product.name)+(plan?` — ${plan.name}`:""),quantity,baseUnit,planId,coupon?.id||null]);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(orderId).padStart(6,"0")}`;
    const invoiceExisting = await query<any[]>("SELECT id FROM invoices WHERE user_id=? AND number=? LIMIT 1",[Number(session.id),invoiceNumber]);
    let invoiceId:number;
    if(invoiceExisting[0]) invoiceId=Number(invoiceExisting[0].id);
    else {
      const inv:any = await query<any>("INSERT INTO invoices(user_id,number,issued_at,due_at,status,currency,subtotal,tax_total,total,remaining) VALUES(?,?,CURDATE(),CURDATE(),'PENDING',?,?,?,?,?)",[Number(session.id),invoiceNumber,String(product.currency||"EUR"),total,0,total,total]);
      invoiceId=Number(inv.insertId);
      await query("INSERT INTO invoice_items(invoice_id,description,quantity,unit_price,total) VALUES(?,?,?,?,?)",[invoiceId,String(product.name)+(plan?` — ${plan.name}`:""),quantity,baseUnit,total]);
      await query("INSERT INTO invoice_transactions(invoice_id,gateway,amount,transaction_id,status) VALUES(?,?,?,?,'PENDING')",[invoiceId,"Stripe",total,`order_${orderId}`]);
    }

    if (total <= 0) {
      await query("UPDATE orders SET status='PAID',paid_at=NOW() WHERE id=?",[orderId]);
      await query("UPDATE invoices SET status='PAID',remaining=0 WHERE id=?",[invoiceId]);
      await query("UPDATE invoice_transactions SET status='SUCCEEDED' WHERE invoice_id=? AND transaction_id=?",[invoiceId,`order_${orderId}`]);
      await query("INSERT INTO services(user_id,product_id,plan_id,quantity,price,currency,name,status,coupon_id,expires_at) VALUES(?,?,?,?,?,?,?,'ACTIVE',?,?)",[Number(session.id),productId,planId,quantity,total,String(product.currency||"EUR"),String(product.name)+(plan?` — ${plan.name}`:""),coupon?.id||null,cycle==='ONE_TIME'?null:null]);
      return NextResponse.redirect(new URL(`/checkout/success?order=${orderId}&free=1`,getPublicOrigin(req)),303);
    }

    const gateway = await getStripeGateway();
    if (!gateway) throw new Error("Aucune passerelle Stripe active n'est configurée.");
    const origin = getPublicOrigin(req);
    const params:Record<string,string> = {
      mode: cycle === "ONE_TIME" ? "payment" : "subscription",
      "line_items[0][quantity]": String(quantity),
      "line_items[0][price_data][currency]": String(product.currency||"EUR").toLowerCase(),
      "line_items[0][price_data][product_data][name]": String(product.name)+(plan?` — ${plan.name}`:""),
      "line_items[0][price_data][unit_amount]": String(Math.round(total / quantity * 100)),
      customer_email: String((await query<any[]>("SELECT email FROM users WHERE id=?",[Number(session.id)]))[0]?.email||""),
      client_reference_id: String(orderId),
      "metadata[order_id]": String(orderId),
      "metadata[user_id]": String(session.id),
      "metadata[product_id]": String(productId),
      success_url: `${origin}/checkout/success?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/shop/${encodeURIComponent(product.slug)}?checkout=cancelled`,
      "billing_address_collection": "required",
      "allow_promotion_codes": "false"
    };
    if (cycle === "ONE_TIME") params["payment_intent_data[metadata][order_id]"] = String(orderId);
    if (cycle !== "ONE_TIME") params["subscription_data[metadata][order_id]"] = String(orderId);
    if (cycle !== "ONE_TIME") {
      const interval = stripeInterval(cycle);
      params["line_items[0][price_data][recurring][interval]"] = interval.interval;
      params["line_items[0][price_data][recurring][interval_count]"] = interval.interval_count;
    }
    const checkout = await stripeRequest("/checkout/sessions",params,gateway);
    await query("UPDATE orders SET external_id=?,gateway=? WHERE id=?",[String(checkout.id),"Stripe",orderId]);
    return NextResponse.redirect(checkout.url,303);
  } catch (error:any) {
    const msg = encodeURIComponent(String(error?.message || "Impossible de créer la commande."));
    return NextResponse.redirect(new URL(`/shop?checkout_error=${msg}`,getPublicOrigin(req)),303);
  }
}
