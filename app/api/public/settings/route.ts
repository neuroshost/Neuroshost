import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
export async function GET(){ try { return NextResponse.json(await getPublicSettings()); } catch { return NextResponse.json({}, {status:503}); } }
