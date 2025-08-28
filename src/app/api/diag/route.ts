export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = await prisma.$queryRawUnsafe<{ now: string }[]>("select now()");
    const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
      "select table_name from information_schema.tables where table_schema='public' and table_name ilike 'asset%';"
    );
    return NextResponse.json({ ok: true, now: now?.[0]?.now, tables });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
