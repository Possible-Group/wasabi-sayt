import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { normalizePhone } from "@/lib/poster/posterClients";
import { rateLimit } from "@/lib/auth/rateLimit";
import { sendClientSmsOtp } from "@/lib/auth/clientSmsOtp";

const Body = z.object({
  phone: z.string().min(6),
  locale: z.enum(["ru", "uz"]).optional(),
});

function getIp(req: Request) {
  const header = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  return header.split(",")[0].trim() || "unknown";
}

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

  const limiter = rateLimit(`client-reset-sms:${getIp(req)}:${phoneNormalized}`, 60, 5);
  if (!limiter.ok) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const existing = await prisma.clientUser.findUnique({
    where: { phoneNormalized },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  const result = await sendClientSmsOtp({
    purpose: "reset_password",
    phone: body.phone,
    locale: body.locale,
  });

  if (!result.ok) {
    if (result.error === "RATE_LIMIT") {
      return NextResponse.json(
        { error: "SMS_RESEND_TOO_EARLY", retryAfterSec: result.retryAfterSec || 60 },
        { status: 429 }
      );
    }
    if (result.error === "SMS_NOT_CONFIGURED") {
      return NextResponse.json({ error: "SMS_NOT_CONFIGURED" }, { status: 503 });
    }
    if (result.error === "SMS_TEMPLATE_NOT_APPROVED") {
      return NextResponse.json(
        {
          error: "SMS_TEMPLATE_NOT_APPROVED",
          detail: result.detail || "TEMPLATE_NOT_APPROVED",
        },
        { status: 400 }
      );
    }
    if (result.error === "SMS_SEND_FAILED") {
      return NextResponse.json(
        {
          error: "SMS_SEND_FAILED",
          detail: result.detail || "UNKNOWN",
          providerStatus: result.status ?? null,
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: "INVALID_PHONE" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
