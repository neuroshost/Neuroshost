import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import ServiceForm from "@/components/ServiceForm";

export const dynamic = "force-dynamic";

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
  const { id } = await params;
  const service = await query<any[]>("SELECT * FROM services WHERE id=? LIMIT 1", [Number(id)]);
  if (!service[0]) notFound();
  const [users, products, plans, currencies, coupons, billingAgreements] = await Promise.all([
    query<any[]>("SELECT id,name,email FROM users ORDER BY name"),
    query<any[]>("SELECT id,name,price FROM products ORDER BY name"),
    query<any[]>("SELECT * FROM product_plans WHERE enabled=1 ORDER BY product_id,sort_order,id"),
    query<any[]>("SELECT code,name,symbol,decimals FROM currencies WHERE enabled=1 ORDER BY code"),
    query<any[]>("SELECT id,code,type AS discount_type,value AS discount_value FROM coupons ORDER BY code"),
    query<any[]>("SELECT id,name,type FROM billing_agreements WHERE enabled=1 ORDER BY name")
  ]);
  return <AdminShell title={`Modifier Service #${id}`}><ServiceForm initial={service[0]} users={users} products={products} plans={plans} currencies={currencies} coupons={coupons} billingAgreements={billingAgreements}/></AdminShell>;
}
