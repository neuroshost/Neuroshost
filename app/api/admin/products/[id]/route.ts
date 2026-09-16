import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized",{status:401}); }
  const {id}=await params; const pid=Number(id); const f=await req.formData(); const action=String(f.get("_action")||"");
  if(action==="delete"){await query("DELETE FROM products WHERE id=?",[pid]);return NextResponse.redirect(new URL("/admin/products",req.url),303);}
  if(action==="update"){
    await query("UPDATE products SET category_id=?,name=?,slug=?,short_description=?,description=?,price=?,billing_cycle=?,visible=?,featured=?,stock=?,image_url=?,per_user_limit=?,allow_quantity=?,email_template=?,hide_product=?,server_id=? WHERE id=?",[
      f.get("categoryId")?Number(f.get("categoryId")):null,String(f.get("name")),String(f.get("slug")),String(f.get("shortDescription")||""),String(f.get("description")||""),Number(f.get("price")||0),String(f.get("billingCycle")||"MONTHLY"),Number(f.get("visible")||0),Number(f.get("featured")||0),f.get("stock")!==""&&f.get("stock")!=null?Number(f.get("stock")):null,String(f.get("imageUrl")||""),f.get("perUserLimit")?Number(f.get("perUserLimit")):null,String(f.get("allowQuantity")||"SEPARATED"),String(f.get("emailTemplate")||""),Number(f.get("hideProduct")||0),f.get("serverId")?Number(f.get("serverId")):null,pid
    ]);
    await query("DELETE FROM product_plans WHERE product_id=?",[pid]);
    const plans=JSON.parse(String(f.get("plans")||"[]"));
    for(let i=0;i<plans.length;i++){const x=plans[i];if(!x?.name)continue;await query("INSERT INTO product_plans(product_id,name,type,price,billing_cycle,initial_price,recurring_price,sort_order) VALUES(?,?,?,?,?,?,?,?)",[pid,String(x.name),String(x.type||"FREE"),Number(x.price||0),String(x.billingCycle||"MONTHLY"),Number(x.initialPrice||0),Number(x.recurringPrice||x.price||0),i]);}
    await query("DELETE FROM product_upgrades WHERE product_id=?",[pid]);
    const upgrades=JSON.parse(String(f.get("upgrades")||"[]"));for(const target of upgrades)if(Number(target)&&Number(target)!==pid)await query("INSERT IGNORE INTO product_upgrades(product_id,target_product_id) VALUES(?,?)",[pid,Number(target)]);
  }
  return NextResponse.redirect(new URL("/admin/products",req.url),303);
}