import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await query<any[]>("SELECT id,name,email,role FROM users WHERE id=? LIMIT 1", [Number(session.id)]);
    const user = rows[0];
    return NextResponse.json({ id: user?.id ?? session.id, name: user?.name ?? "Administrateur", email: user?.email ?? session.email, role: user?.role ?? session.role });
  } catch {
    return NextResponse.json({ id: session.id, name: "Administrateur", email: session.email, role: session.role });
  }
}
