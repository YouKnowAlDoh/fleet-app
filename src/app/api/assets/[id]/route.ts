// src/app/api/assets/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// PATCH /api/assets/:id  (partial update)
export async function PATCH(req: Request, { params }: Params) {
  const id = params.id;
  const body = await req.json();

  const data = {
    code: body.code?.toString().trim(),
    name: body.name?.toString().trim(),
    assetType: body.assetType?.toString(),
    vin: body.vin ? String(body.vin).trim().toUpperCase() : null,
    plate: body.plate ? String(body.plate).trim().toUpperCase() : null,
    year: body.year != null ? Number(body.year) : undefined,
    make: body.make?.toString().trim() ?? null,
    model: body.model?.toString().trim() ?? null,
    status: body.status ?? undefined,            // "ACTIVE" | "IN_SHOP" | ...
    meterUnit: body.meterUnit ?? undefined,      // "MILES" | "HOURS"
    currentMeter: body.currentMeter ?? undefined // number | null
  };

  // remove undefined fields so prisma doesn't try to set them
  Object.keys(data).forEach((k) => (data as any)[k] === undefined && delete (data as any)[k]);

  try {
    const updated = await prisma.asset.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Update failed" }, { status: 400 });
  }
}

// DELETE /api/assets/:id
export async function DELETE(_req: Request, { params }: Params) {
  const id = params.id;
  try {
    await prisma.asset.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Delete failed" }, { status: 400 });
  }
}
