import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import AdminShell from "@/components/AdminShell";
import NotificationTemplateList from "./NotificationTemplateList";
export const dynamic = "force-dynamic";
export default async function NotificationTemplatesPage(){try{await requireAdmin()}catch{redirect("/admin/login")}const templates=await query<any[]>("SELECT * FROM email_templates ORDER BY id DESC");return <AdminShell title="Notification Templates"><NotificationTemplateList templates={templates}/></AdminShell>}
