export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = {
    code: String(body.code || "").trim(),
    name: String(body.name || "").trim(),
    assetType: String(body.assetType || "Truck"),
    vin: body.vin ? String(body.vin).trim().toUpperCase() : null,
    plate: body.plate ? String(body.plate).trim().toUpperCase() : null,
    year: body.year ? Number(body.year) : null,
    make: body.make ? String(body.make).trim() : null,
    model: body.model ? String(body.model).trim() : null,
    status: "ACTIVE",
    meterUnit: body.meterUnit === "HOURS" ? "HOURS" : "MILES",
    currentMeter: null
  };
  if (!data.code || !data.name) {
    return NextResponse.json({ error: "Code and Name are required." }, { status: 400 });
  }
  const created = await prisma.asset.create({ data });
  return NextResponse.json(created, { status: 201 });
}
