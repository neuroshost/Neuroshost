import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const { id } = await params;
  const f = await req.formData();
  await query("UPDATE extensions SET name=?,version=?,type=?,author=?,description=?,icon_url=?,enabled=? WHERE id=?", [
    String(f.get("name") || "").trim(), String(f.get("version") || "1.0.0").trim(), String(f.get("type") || "EXTENSION"),
    String(f.get("author") || "").trim(), String(f.get("description") || ""), String(f.get("iconUrl") || "").trim(), f.get("enabled") ? 1 : 0, Number(id)
  ]);
  return NextResponse.redirect(new URL(`/admin/module/extensions/${id}?saved=1`, req.url), 303);
}
