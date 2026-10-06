import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushToUser } from "@/lib/notify";

export async function POST() {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  const subs = await prisma.notificationSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return NextResponse.json({ error: "not subscribed" }, { status: 400 });

  const payload = { title: "Opentip Test", body: "Push notifications are working!", url: "/" };
  const sent = await pushToUser(userId, payload);
  if (!sent) {
    await prisma.notification.create({
      data: { userId, type: "test", title: payload.title, body: payload.body, status: "failed" },
    });
    return NextResponse.json({ error: "push failed" }, { status: 500 });
  }
  await prisma.notification.create({
    data: { userId, type: "test", title: payload.title, body: payload.body, status: "sent" },
  });
  return NextResponse.json({ ok: true });
}
