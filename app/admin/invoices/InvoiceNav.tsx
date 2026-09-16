"use client";
import {usePathname} from "next/navigation";
export default function InvoiceNav(){const p=usePathname();return <div className="invoice-subnav"><a className={p==="/admin/invoices"?"active":""} href="/admin/invoices"><span>▣</span>Invoices</a><a className={p.startsWith("/admin/invoices/transactions")?"active":""} href="/admin/invoices/transactions"><span>▣</span>Invoice Transactions</a></div>}
