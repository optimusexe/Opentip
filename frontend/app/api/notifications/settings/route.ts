import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayedNotificationTypes } from "@/lib/notification-push";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const sub = await prisma.notificationSubscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { types: true, updatedAt: true },
  });

  return NextResponse.json({
    types: displayedNotificationTypes(sub?.types, sub != null),
    lastUpdated: sub?.updatedAt ?? null,
  });
}

export async function PUT(request: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid body" }, { status: 400 }); }
  const { types } = body;
  if (!Array.isArray(types)) {
    return NextResponse.json({ error: "types must be an array" }, { status: 400 });
  }

  const existing = await prisma.notificationSubscription.findFirst({ where: { userId } });
  if (!existing) return NextResponse.json({ error: "subscribe first" }, { status: 400 });

  await prisma.notificationSubscription.updateMany({
    where: { userId },
    data: { types, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
