import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyClientSmsOtp } from "@/lib/auth/clientSmsOtp";
import { hashPassword } from "@/lib/auth/password";
import { normalizePhone, getPosterClientById, normalizePosterClient } from "@/lib/poster/posterClients";
import { setClientSession } from "@/lib/auth/clientAuth";

const Body = z.object({
  phone: z.string().min(6),
  code: z.string().min(4),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const body = parsed.data;
  const phoneNormalized = normalizePhone(body.phone);
  if (!phoneNormalized || phoneNormalized.length < 9) {
    return NextResponse.json({ error: "INVALID_PHONE" }, { status: 400 });
  }

  const password = body.password.trim();
  if (password.length < 8) {
    return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  }

  const client = await prisma.clientUser.findUnique({
    where: { phoneNormalized },
  });
  if (!client) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  const otpResult = await verifyClientSmsOtp({
    purpose: "reset_password",
    phone: body.phone,
    code: body.code.trim(),
  });
  if (!otpResult.ok) {
    if (otpResult.error === "CODE_EXPIRED") {
      return NextResponse.json({ error: "SMS_CODE_EXPIRED" }, { status: 400 });
    }
    if (otpResult.error === "CODE_NOT_FOUND") {
      return NextResponse.json({ error: "SMS_CODE_NOT_FOUND" }, { status: 400 });
    }
    if (otpResult.error === "TOO_MANY_ATTEMPTS") {
      return NextResponse.json({ error: "SMS_CODE_TOO_MANY_ATTEMPTS" }, { status: 429 });
    }
    return NextResponse.json({ error: "SMS_CODE_INVALID" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.clientUser.update({
    where: { id: client.id },
    data: { passwordHash },
  });

  const freshPoster = await getPosterClientById(client.posterClientId);
  const normalized = freshPoster ? normalizePosterClient(freshPoster) : null;

  await setClientSession({
    clientId: normalized?.id || client.posterClientId,
    phone: normalized?.phone || client.phone,
    name: normalized?.name || undefined,
  });

  return NextResponse.json({
    ok: true,
    client: normalized || {
      id: client.posterClientId,
      phone: client.phone,
      name: "",
      bonus: 0,
    },
  });
}
