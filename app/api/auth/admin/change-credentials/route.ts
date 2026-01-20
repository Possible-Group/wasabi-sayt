import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const Body = z.object({
  oldPassword: z.string().min(6),
  newLogin: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional(),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Body.parse(await req.json());
  const adminId = Number(session.adminId);
  if (!Number.isFinite(adminId))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const okOld = await verifyPassword(body.oldPassword, admin.passwordHash);
  if (!okOld) return NextResponse.json({ error: "Old password is wrong" }, { status: 400 });

  const data: any = {};
  if (body.newLogin) data.login = body.newLogin;
  if (body.newPassword) data.passwordHash = await hashPassword(body.newPassword);

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });

  await prisma.adminUser.update({ where: { id: admin.id }, data });
  return NextResponse.json({ ok: true });
}
