import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();

    const rows = await query<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM failed_jobs WHERE resolved_at IS NULL"
    );

    return NextResponse.json({ count: Number(rows[0]?.count ?? 0) });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }
}
