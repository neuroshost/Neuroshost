import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return new NextResponse("Unauthorized", { status: 401 }); }
  const f = await req.formData();
  const name = String(f.get("name") || "").trim();
  const slug = String(f.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "-");
  const version = String(f.get("version") || "1.0.0").trim();
  const type = String(f.get("type") || "EXTENSION");
  const description = String(f.get("description") || "");
  const author = "Local Upload";
  if (!name || !slug) return new NextResponse("Name and slug are required", { status: 400 });
  const allowed = new Set(["EXTENSION","THEME","GATEWAY","SERVER","OTHER"]);
  if (!allowed.has(type)) return new NextResponse("Invalid extension type", { status: 400 });

  const pkg = f.get("package");
  let packagePath = "";
  if (pkg instanceof File && pkg.size > 0) {
    if (pkg.size > 25 * 1024 * 1024) return new NextResponse("Package too large (25 MB max)", { status: 413 });
    const filename = String(pkg.name || "package.zip").toLowerCase();
    if (!filename.endsWith(".zip") && !filename.endsWith(".json")) return new NextResponse("Only ZIP or JSON packages are supported", { status: 400 });
    const dir = path.join(process.cwd(), ".runtime", "extensions", "packages");
    await fs.mkdir(dir, { recursive: true });
    const safeName = `${slug}-${crypto.randomUUID()}${filename.endsWith(".json") ? ".json" : ".zip"}`;
    packagePath = path.join(dir, safeName);
    await fs.writeFile(packagePath, Buffer.from(await pkg.arrayBuffer()));
  }

  const { query } = await import("@/lib/db");
  await query(`INSERT INTO extensions(slug,name,version,type,author,description,package_path,enabled) VALUES(?,?,?,?,?,?,?,1)
    ON DUPLICATE KEY UPDATE name=VALUES(name),version=VALUES(version),type=VALUES(type),author=VALUES(author),description=VALUES(description),package_path=VALUES(package_path),enabled=1`,
    [slug,name,version,type,author,description,packagePath]);
  return NextResponse.redirect(new URL("/admin/module/extensions?uploaded=1", req.url), 303);
}
