import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPosterClient,
  findPosterClientByPhone,
  getPosterClientById,
  normalizePhone,
  normalizePosterClient,
} from "@/lib/poster/posterClients";
import { setClientSession } from "@/lib/auth/clientAuth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";

const Body = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  birthday: z.string().optional().or(z.literal("")),
  password: z.string().min(1),
});

function normalizeBirthday(value?: string | null) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T].*)?$/);
  const dot = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s.*)?$/);
  const dash = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s.*)?$/);
  const slash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2})(?:\s.*)?$/);

  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (dot) {
    year = Number(dot[3]);
    month = Number(dot[2]);
    day = Number(dot[1]);
  } else if (dash) {
    year = Number(dash[3]);
    month = Number(dash[2]);
    day = Number(dash[1]);
  } else if (slash) {
    year = Number(slash[1]);
    month = Number(slash[2]);
    day = Number(slash[3]);
  } else {
    return null;
  }

  if (!year || !month || !day) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getPosterBirthday(client: Record<string, any>) {
  return client?.birthday ?? client?.birthdate ?? client?.birth_date ?? null;
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }
  const body = parsed.data;
  const birthday = body.birthday?.trim() || undefined;
  const normalizedBirthday = normalizeBirthday(body.birthday);
  const phone = body.phone.trim();
  const phoneNormalized = normalizePhone(phone);
  if (!phoneNormalized || phoneNormalized.length < 6) {
    return NextResponse.json({ error: "INVALID_PHONE" }, { status: 400 });
  }
  const password = body.password.trim();
  if (password.length < 8) {
    return NextResponse.json({ error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  }

  const existingByPhone = await prisma.clientUser.findUnique({
    where: { phoneNormalized },
  });
  if (existingByPhone) {
    return NextResponse.json({ error: "CLIENT_ALREADY_REGISTERED" }, { status: 409 });
  }

  let client = await findPosterClientByPhone(phone);
  let posterWasExisting = Boolean(client);
  let created = false;

  let createError: string | null = null;
  if (!client) {
    try {
      client = await createPosterClient({ name: body.name, phone, birthday });
      created = Boolean(client);
      posterWasExisting = false;
    } catch (error) {
      createError = error instanceof Error ? error.message : String(error);
    }
  }

  if (!client) {
    if (phoneNormalized && phoneNormalized !== phone) {
      client = await findPosterClientByPhone(phoneNormalized);
      created = false;
      posterWasExisting = Boolean(client);
    }
  }

  if (!client) {
    return NextResponse.json(
      { error: "CLIENT_CREATE_FAILED", detail: createError || "Poster create failed" },
      { status: 502 }
    );
  }

  if (posterWasExisting) {
    const posterBirthday = normalizeBirthday(getPosterBirthday(client));
    if (posterBirthday) {
      if (!normalizedBirthday) {
        return NextResponse.json({ error: "BIRTHDAY_REQUIRED" }, { status: 400 });
      }
      if (normalizedBirthday !== posterBirthday) {
        return NextResponse.json({ error: "BIRTHDAY_MISMATCH" }, { status: 403 });
      }
    }
  }

  const normalized = normalizePosterClient(client);
  if (!normalized) {
    return NextResponse.json({ error: "CLIENT_CREATE_FAILED" }, { status: 500 });
  }

  const fresh = await getPosterClientById(normalized.id);
  const freshNormalized = fresh ? normalizePosterClient(fresh) : null;
  const finalClient = freshNormalized || normalized;

  const existingByPoster = await prisma.clientUser.findUnique({
    where: { posterClientId: finalClient.id },
  });
  if (existingByPoster) {
    return NextResponse.json({ error: "CLIENT_ALREADY_REGISTERED" }, { status: 409 });
  }

  try {
    const passwordHash = await hashPassword(password);
    await prisma.clientUser.create({
      data: {
        posterClientId: finalClient.id,
        phone: finalClient.phone || phone,
        phoneNormalized,
        passwordHash,
      },
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (code === "P2002") {
      return NextResponse.json({ error: "CLIENT_ALREADY_REGISTERED" }, { status: 409 });
    }
    return NextResponse.json({ error: "CLIENT_SAVE_FAILED" }, { status: 500 });
  }

  await setClientSession({
    clientId: finalClient.id,
    phone: finalClient.phone || phone,
    name: finalClient.name || body.name,
  });

  return NextResponse.json({ client: finalClient, created });
}
