import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { z } from "zod";

const Keys = [
  "work_start",
  "work_end",
  "package_fee",
  "delivery_fee",
  "contact_phone",
  "contact_phone_2",
  "contact_phone_3",
  "contact_phone_4",
  "contact_address_ru",
  "contact_address_uz",
  "social_instagram",
  "social_telegram",
  "social_facebook",
  "lang_ru_enabled",
  "lang_uz_enabled",
  "site_enabled"
] as const;

const Body = z.object({
  key: z.enum(Keys),
  value: z.string(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await prisma.botSetting.findMany();
  const map: Record<string, string> = {};
  for (const it of list) map[it.key] = it.value;
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = Body.parse(await req.json());

  await prisma.botSetting.upsert({
    where: { key: body.key },
    create: { key: body.key, value: body.value },
    update: { value: body.value },
  });

  return NextResponse.json({ ok: true });
}
