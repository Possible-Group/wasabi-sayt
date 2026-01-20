import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { setAdminSession } from "@/lib/auth/adminAuth";
import { rateLimit } from "@/lib/auth/rateLimit";

const Body = z.object({
  login: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`admin_login:${ip}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });

  const json = await req.json();
  const body = Body.parse(json);

  const admin = await prisma.adminUser.findUnique({ where: { login: body.login } });
  if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await verifyPassword(body.password, admin.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await setAdminSession({ adminId: String(admin.id), login: admin.login });
  return NextResponse.json({ ok: true });
}
