import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { setSetting } from "@/lib/settings";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

const allowed: Record<string, Set<string>> = {
  app_logo: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  logo_light: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  logo_dark: new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
  favicon: new Set(["image/png", "image/x-icon", "image/vnd.microsoft.icon", "image/webp", "image/svg+xml"]),
};

const maxBytes = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const form = await req.formData();
  const key = String(form.get("key") || "");
  const file = form.get("file");
  if (!(key in allowed) || !(file instanceof File)) return NextResponse.json({ error: "Fichier invalide." }, { status: 400 });
  if (file.size <= 0 || file.size > maxBytes) return NextResponse.json({ error: "Le fichier doit faire entre 1 octet et 5 Mo." }, { status: 400 });
  if (!allowed[key].has(file.type)) return NextResponse.json({ error: "Format de fichier non autorisé." }, { status: 400 });

  const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || ".bin";
  const filename = `${key}-${crypto.randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "settings");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  const publicPath = `/api/public/assets/settings/${filename}`;
  await setSetting(key, publicPath, { publicValue: true });

  return NextResponse.json({ ok: true, key, url: publicPath });
}
