import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { verificationSendResult } from "@/lib/verification-email";
import { randomInt, createHash } from "crypto";

const SEND_COOLDOWN_MS = 60 * 1000;
const sendTimestamps = new Map<string, number>();

function generateCode(): string {
  return String(randomInt(100000, 999999));
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const lower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lower)) {
    return NextResponse.json({ error: "invalid email format" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  if (user.email && user.emailVerified) {
    return NextResponse.json({ error: "email already verified and cannot be changed" }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: lower },
    select: { id: true },
  });

  if (existingEmail && existingEmail.id !== session.user.id) {
    return NextResponse.json({ error: "email already in use" }, { status: 400 });
  }

  const now = Date.now();
  const lastSent = sendTimestamps.get(session.user.id);
  if (lastSent && now - lastSent < SEND_COOLDOWN_MS) {
    const retryAfter = Math.ceil((SEND_COOLDOWN_MS - (now - lastSent)) / 1000);
    return NextResponse.json({ error: `wait ${retryAfter} seconds before requesting another code` }, { status: 429 });
  }

  const code = generateCode();
  const hashedCode = hashCode(code);
  const expiry = new Date(now + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      email: lower,
      emailVerified: null,
      emailVerifyToken: hashedCode,
      emailVerifyExpiry: expiry,
    },
  });

  let emailSent = true;
  try {
    await sendVerificationEmail(lower, code);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    emailSent = false;
  }

  const result = verificationSendResult("resend", emailSent);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  sendTimestamps.set(session.user.id, now);
  return NextResponse.json({ ok: true, message: "verification code sent" });
}

export async function GET(_req: NextRequest) {
  const session: any = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  return NextResponse.json({
    email: user?.email || null,
    verified: !!user?.emailVerified,
  });
}
