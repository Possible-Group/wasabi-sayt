import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findPosterClientByPhone,
  getPosterClientById,
  normalizePhone,
  normalizePosterClient,
} from "@/lib/poster/posterClients";
import { setClientSession } from "@/lib/auth/clientAuth";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";

const Body = z.object({
  phone: z.string().min(6),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const body = parsed.data;
  const phone = body.phone.trim();
  const phoneNormalized = normalizePhone(phone);
  if (!phoneNormalized || phoneNormalized.length < 6) {
    return NextResponse.json({ error: "INVALID_PHONE" }, { status: 400 });
  }
  const password = body.password.trim();
  if (password.length < 8) {
    return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  }

  const localClient = await prisma.clientUser.findUnique({
    where: { phoneNormalized },
  });
  if (!localClient) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  const passwordOk = await verifyPassword(password, localClient.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  let client = await getPosterClientById(localClient.posterClientId);
  if (!client) {
    client = await findPosterClientByPhone(phone);
  }
  if (!client) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  const normalized = normalizePosterClient(client);
  if (!normalized) {
    return NextResponse.json({ error: "CLIENT_NOT_FOUND" }, { status: 404 });
  }

  if (normalized.id !== localClient.posterClientId) {
    await prisma.clientUser.update({
      where: { id: localClient.id },
      data: { posterClientId: normalized.id },
    });
  }

  const fresh = await getPosterClientById(normalized.id);
  const freshNormalized = fresh ? normalizePosterClient(fresh) : null;
  const finalClient = freshNormalized || normalized;

  await setClientSession({
    clientId: finalClient.id,
    phone: finalClient.phone || phone,
    name: finalClient.name || undefined,
  });

  return NextResponse.json({ client: finalClient });
}
