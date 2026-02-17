import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";

function asLogin(phoneNormalized: string) {
  const digits = String(phoneNormalized || "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function adminSafePasswordHash(value: string) {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.clientUser.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      posterClientId: true,
      phone: true,
      phoneNormalized: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    clients.map((client) => ({
      id: client.id,
      posterClientId: client.posterClientId,
      phone: client.phone,
      phoneNormalized: client.phoneNormalized,
      passwordHash: adminSafePasswordHash(client.passwordHash),
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      login: asLogin(client.phoneNormalized),
    }))
  );
}

export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get("id");
  const id = Number(rawId);

  if (!rawId || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "INVALID_ID" }, { status: 400 });
  }

  try {
    await prisma.clientUser.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
