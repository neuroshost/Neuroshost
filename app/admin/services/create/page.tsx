import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import ServiceForm from "@/components/ServiceForm";

export const dynamic = "force-dynamic";

export default async function CreateService() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const [users, products, plans, currencies, coupons, billingAgreements] = await Promise.all([
    query<any[]>("SELECT id,name,email FROM users ORDER BY name"),
    query<any[]>("SELECT id,name,price FROM products WHERE hide_product=0 ORDER BY name"),
    query<any[]>("SELECT * FROM product_plans WHERE enabled=1 ORDER BY product_id,sort_order,id"),
    query<any[]>("SELECT code,name,symbol,decimals FROM currencies WHERE enabled=1 ORDER BY code"),
    query<any[]>("SELECT id,code,type AS discount_type,value AS discount_value FROM coupons WHERE (starts_at IS NULL OR starts_at <= NOW()) AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY code"),
    query<any[]>("SELECT id,name,type FROM billing_agreements WHERE enabled=1 ORDER BY name")
  ]);
  return <AdminShell title="Créer Service"><ServiceForm users={users} products={products} plans={plans} currencies={currencies} coupons={coupons} billingAgreements={billingAgreements}/></AdminShell>;
}
