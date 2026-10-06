import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { displayNameMessage } from "@/lib/display-name";
import { displayNameSignatureValid } from "@/lib/display-name-verify";

export async function POST(req: NextRequest) {
  const { address, displayName, signature } = await req.json();
  if (!address || !displayName || !signature) return NextResponse.json({ error: "address, displayName, signature required" }, { status: 400 });
  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }
  if (typeof displayName !== "string" || displayName.length < 1 || displayName.length > 64) {
    return NextResponse.json({ error: "displayName 1-64 chars" }, { status: 400 });
  }
  if (typeof signature !== "string" || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const message = displayNameMessage(displayName, address);
  const valid = await displayNameSignatureValid(address as `0x${string}`, message, signature as `0x${string}`);
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  await prisma.displayName.upsert({
    where: { tipper_address: address.toLowerCase() },
    create: { tipper_address: address.toLowerCase(), display_name: displayName },
    update: { display_name: displayName },
  });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const addr = req.nextUrl.searchParams.get("address");
  if (!addr) return NextResponse.json({ error: "address required" }, { status: 400 });
  const row = await prisma.displayName.findUnique({ where: { tipper_address: addr.toLowerCase() } });
  return NextResponse.json(row || {});
}
