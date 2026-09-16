import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f = await req.formData();
  const id = Number(f.get("catalogId"));
  const rows = await query<any[]>("SELECT * FROM extension_catalog WHERE id=?", [id]);
  if (!rows[0]) return new NextResponse("Extension not found", { status: 404 });
  const e = rows[0];
  await query(`INSERT INTO extensions(slug,name,version,type,author,description,icon_url,source_url,enabled) VALUES(?,?,?,?,?,?,?,?,1)
    ON DUPLICATE KEY UPDATE version=VALUES(version),name=VALUES(name),description=VALUES(description),enabled=1`, [e.slug,e.name,e.version,e.type,e.author,e.description,e.icon_url,e.source_url]);
  await query("UPDATE extension_catalog SET downloads=downloads+1 WHERE id=?", [id]);
  return NextResponse.redirect(new URL("/admin/module/extensions?installed=1", req.url), 303);
}
