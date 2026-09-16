import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStripeGateway, verifyStripeSignature } from "@/lib/stripe";
export const dynamic="force-dynamic";
function addCycle(cycle:string){const d=new Date(); if(cycle==='YEARLY')d.setFullYear(d.getFullYear()+1); else if(cycle==='QUARTERLY')d.setMonth(d.getMonth()+3); else d.setMonth(d.getMonth()+1); return d;}
export async function POST(req:NextRequest){
 const raw=await req.text(); const sig=req.headers.get('stripe-signature')||''; const gateway=await getStripeGateway();
 if(!gateway) return NextResponse.json({error:'Stripe gateway not configured'},{status:503});
 const secret=String(gateway.settings.webhook_secret||'');
 if(!verifyStripeSignature(raw,sig,secret)) return NextResponse.json({error:'Invalid signature'},{status:400});
 let event:any; try{event=JSON.parse(raw)}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 try{await query("INSERT INTO stripe_webhook_events(event_id,event_type,payload) VALUES(?,?,?)",[String(event.id),String(event.type),raw])}catch(e:any){if(e?.code==='ER_DUP_ENTRY')return NextResponse.json({received:true,duplicate:true});throw e;}
 try{
   if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
     const session=event.data.object; const orderId=Number(session.metadata?.order_id||session.client_reference_id||0); if(!orderId) return NextResponse.json({received:true});
     const order=(await query<any[]>("SELECT * FROM orders WHERE id=? LIMIT 1",[orderId]))[0]; if(!order)return NextResponse.json({received:true});
     if(order.status!=='PAID'){
       await query("UPDATE orders SET status='PAID',external_id=?,gateway='Stripe',paid_at=NOW() WHERE id=?",[String(session.id),orderId]);
       const invoice=(await query<any[]>("SELECT i.id FROM invoices i JOIN invoice_transactions it ON it.invoice_id=i.id WHERE it.transaction_id=? LIMIT 1",[`order_${orderId}`]))[0];
       if(invoice){await query("UPDATE invoices SET status='PAID',remaining=0 WHERE id=?",[invoice.id]);await query("UPDATE invoice_transactions SET status='SUCCEEDED',transaction_id=? WHERE invoice_id=?",[String(session.payment_intent||session.id),invoice.id]);}
       const items=await query<any[]>("SELECT oi.*,p.billing_cycle FROM order_items oi LEFT JOIN products p ON p.id=oi.product_id WHERE oi.order_id=?",[orderId]);
       for(const item of items){
         const existing=await query<any[]>("SELECT id FROM services WHERE user_id=? AND product_id=? AND status IN ('PENDING','ACTIVE') AND subscription_id=? LIMIT 1",[Number(order.user_id),Number(item.product_id),String(session.subscription||'')]);
         if(existing[0])continue;
         const cycle=String(item.billing_cycle||'ONE_TIME'); const renew=cycle==='ONE_TIME'?null:addCycle(cycle);
         await query("INSERT INTO services(user_id,product_id,plan_id,quantity,price,currency,name,status,subscription_id,expires_at) VALUES(?,?,?,?,?,?,?,'ACTIVE',?,?)",[Number(order.user_id),Number(item.product_id),item.plan_id||null,Number(item.quantity||1),Number(item.unit_price||0),String(order.currency||'EUR'),String(item.product_name),String(session.subscription||''),renew]);
       }
       if(session.customer){
         const methods=await query<any[]>("SELECT id FROM payment_methods WHERE user_id=? AND external_id=? LIMIT 1",[Number(order.user_id),String(session.customer)]); if(!methods[0])await query("INSERT INTO payment_methods(user_id,gateway,label,external_id) VALUES(?,?,?,?)",[Number(order.user_id),'Stripe','Stripe',String(session.customer)]);
       }
     }
   } else if(event.type==='payment_intent.payment_failed'){
     const pi=event.data.object; const orderId=Number(pi.metadata?.order_id||0); const rows=orderId?[{id:orderId}]:await query<any[]>("SELECT id FROM orders WHERE external_id=? LIMIT 1",[String(pi.id)]); if(rows[0]){await query("UPDATE orders SET status='CANCELLED' WHERE id=? AND status='PENDING'",[rows[0].id]); const inv=await query<any[]>("SELECT i.id FROM invoices i JOIN invoice_transactions it ON it.invoice_id=i.id WHERE it.transaction_id=? LIMIT 1",[`order_${rows[0].id}`]); if(inv[0]) await query("UPDATE invoice_transactions SET status='FAILED' WHERE invoice_id=?",[inv[0].id]);}
   } else if(event.type==='charge.refunded'){
     const charge=event.data.object; const pi=String(charge.payment_intent||''); const rows=await query<any[]>("SELECT id FROM orders WHERE external_id=? LIMIT 1",[pi]); if(rows[0]){await query("UPDATE orders SET status='REFUNDED' WHERE id=?",[rows[0].id]);const inv=await query<any[]>("SELECT i.id FROM invoices i JOIN invoice_transactions it ON it.invoice_id=i.id WHERE it.transaction_id=? LIMIT 1",[pi]);if(inv[0]){await query("UPDATE invoices SET status='VOID',remaining=0 WHERE id=?",[inv[0].id]);await query("UPDATE invoice_transactions SET status='REFUNDED' WHERE invoice_id=?",[inv[0].id]);}} 
   }
   return NextResponse.json({received:true});
 }catch(error:any){return NextResponse.json({error:String(error?.message||'Webhook processing failed')},{status:500});}
}
