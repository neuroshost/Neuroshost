import { NextRequest,NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth"; import { query } from "@/lib/db";
export async function POST(req:NextRequest){
 try{await requireAdmin()}catch{return new NextResponse("Unauthorized",{status:401})}
 const f=await req.formData(); const userId=Number(f.get("userId")); const currency=String(f.get("currency")||"EUR");
 const services=JSON.parse(String(f.get("services")||"[]")); if(!userId||!services.length)return new NextResponse("User and at least one service are required",{status:400});
 let total=0; for(const x of services) total+=Number(x.price||0)*Math.max(1,Number(x.quantity||1));
 const [r]=await query<any[]>("INSERT INTO orders(user_id,status,total,currency) VALUES(?,?,?,?,?)",[userId,"PENDING",total,currency]);
 const orderId=Number(r.insertId);
 for(const x of services){
   const productId=Number(x.productId)||null; const plan=String(x.plan||""); const qty=Math.max(1,Number(x.quantity||1)); const price=Number(x.price||0);
   let productName=plan?`${x.productName||"Produit"} — ${plan}`:String(x.productName||"Service");
   await query("INSERT INTO order_items(order_id,product_id,product_name,quantity,unit_price) VALUES(?,?,?,?,?)",[orderId,productId,productName,qty,price]);
 }
 return NextResponse.redirect(new URL("/admin/orders",req.url),303);
}