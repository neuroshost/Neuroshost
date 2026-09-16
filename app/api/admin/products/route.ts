import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f = await req.formData();
  const name = String(f.get("name") || "").trim();
  const slug = String(f.get("slug") || "").trim();
  if (!name || !slug) return new NextResponse("Name and slug are required", {status:400});

  const [result] = await query<any[]>("INSERT INTO products(category_id,name,slug,short_description,description,price,billing_cycle,currency,visible,featured,stock,image_url,per_user_limit,allow_quantity,email_template,hide_product,server_id) VALUES(?,?,?,?,?,?,?,'EUR',?,?,?,?,?,?,?,?,?)", [
    f.get("categoryId") ? Number(f.get("categoryId")) : null, name, slug,
    String(f.get("shortDescription") || ""), String(f.get("description") || ""),
    Number(f.get("price") || 0), String(f.get("billingCycle") || "MONTHLY"),
    Number(f.get("visible") || 0), Number(f.get("featured") || 0),
    f.get("stock") !== "" && f.get("stock") != null ? Number(f.get("stock")) : null,
    String(f.get("imageUrl") || ""), f.get("perUserLimit") ? Number(f.get("perUserLimit")) : null,
    String(f.get("allowQuantity") || "SEPARATED"), String(f.get("emailTemplate") || ""),
    Number(f.get("hideProduct") || 0), f.get("serverId") ? Number(f.get("serverId")) : null
  ]);
  const productId = Number(result.insertId);
  const plans = JSON.parse(String(f.get("plans") || "[]"));
  for (let i=0;i<plans.length;i++) {
    const x=plans[i]; if (!x?.name) continue;
    await query("INSERT INTO product_plans(product_id,name,type,price,billing_cycle,initial_price,recurring_price,sort_order) VALUES(?,?,?,?,?,?,?,?)", [
      productId,String(x.name),String(x.type||"FREE"),Number(x.price||0),String(x.billingCycle||"MONTHLY"),Number(x.initialPrice||0),Number(x.recurringPrice||x.price||0),i
    ]);
  }
  const upgrades = JSON.parse(String(f.get("upgrades") || "[]"));
  for (const target of upgrades) if (Number(target) && Number(target)!==productId)
    await query("INSERT IGNORE INTO product_upgrades(product_id,target_product_id) VALUES(?,?)",[productId,Number(target)]);
  return NextResponse.redirect(new URL("/admin/products", req.url), 303);
}