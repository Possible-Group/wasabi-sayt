import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { normalizePhone } from "@/lib/poster/posterClients";
import { sendEskizSms } from "@/lib/sms/eskiz";

export type SmsOtpPurpose = "register" | "reset_password";

type OtpRecord = {
  phoneNormalized: string;
  purpose: SmsOtpPurpose;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  resendAvailableAt: number;
  createdAt: number;
};

type SendOtpResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "INVALID_PHONE"
        | "RATE_LIMIT"
        | "SMS_SEND_FAILED"
        | "SMS_NOT_CONFIGURED"
        | "SMS_TEMPLATE_NOT_APPROVED";
      retryAfterSec?: number;
      detail?: string;
      status?: number;
    };

type VerifyOtpResult =
  | { ok: true }
  | { ok: false; error: "INVALID_PHONE" | "INVALID_CODE" | "CODE_EXPIRED" | "CODE_NOT_FOUND" | "TOO_MANY_ATTEMPTS" };

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SECRET = String(process.env.CLIENT_OTP_SECRET || process.env.CLIENT_JWT_SECRET || "wasabi-otp-secret");

function settingKey(purpose: SmsOtpPurpose, phoneNormalized: string) {
  return `client_sms_otp:${purpose}:${phoneNormalized}`;
}

function hashCode(purpose: SmsOtpPurpose, phoneNormalized: string, code: string) {
  return createHash("sha256")
    .update(`${OTP_SECRET}:${purpose}:${phoneNormalized}:${code}`)
    .digest("hex");
}

function parseRecord(raw: string): OtpRecord | null {
  try {
    const value = JSON.parse(raw) as Partial<OtpRecord>;
    if (!value || typeof value !== "object") return null;
    if (!value.phoneNormalized || !value.purpose || !value.codeHash) return null;
    if (!value.expiresAt || !value.resendAvailableAt || value.attempts === undefined) return null;
    return {
      phoneNormalized: String(value.phoneNormalized),
      purpose: value.purpose as SmsOtpPurpose,
      codeHash: String(value.codeHash),
      expiresAt: Number(value.expiresAt),
      attempts: Number(value.attempts),
      resendAvailableAt: Number(value.resendAvailableAt),
      createdAt: Number(value.createdAt || Date.now()),
    };
  } catch {
    return null;
  }
}

async function getRecord(purpose: SmsOtpPurpose, phoneNormalized: string) {
  const row = await prisma.botSetting.findUnique({
    where: { key: settingKey(purpose, phoneNormalized) },
  });
  if (!row) return null;
  return parseRecord(row.value);
}

async function saveRecord(record: OtpRecord) {
  await prisma.botSetting.upsert({
    where: { key: settingKey(record.purpose, record.phoneNormalized) },
    update: { value: JSON.stringify(record) },
    create: {
      key: settingKey(record.purpose, record.phoneNormalized),
      value: JSON.stringify(record),
    },
  });
}

async function deleteRecord(purpose: SmsOtpPurpose, phoneNormalized: string) {
  await prisma.botSetting
    .delete({
      where: { key: settingKey(purpose, phoneNormalized) },
    })
    .catch(() => null);
}

function buildSmsText(purpose: SmsOtpPurpose, code: string, locale: "ru" | "uz") {
  // Keep SMS ASCII-only to avoid provider-side encoding issues.
  if (locale === "uz") {
    if (purpose === "register") {
      return `Wasabi: registratsiya kodi ${code}. Kod 5 daqiqa amal qiladi.`;
    }
    return `Wasabi: parolni tiklash kodi ${code}. Kod 5 daqiqa amal qiladi.`;
  }
  if (purpose === "register") {
    return `Wasabi: kod registratsii ${code}. Kod deystvuet 5 minut.`;
  }
  return `Wasabi: kod sbrosa parolya ${code}. Kod deystvuet 5 minut.`;
}

export async function sendClientSmsOtp(params: {
  purpose: SmsOtpPurpose;
  phone: string;
  locale?: "ru" | "uz";
}): Promise<SendOtpResult> {
  const phoneNormalized = normalizePhone(params.phone || "");
  if (!phoneNormalized || phoneNormalized.length < 9) {
    return { ok: false, error: "INVALID_PHONE" };
  }

  const now = Date.now();
  const existing = await getRecord(params.purpose, phoneNormalized);
  if (existing && existing.resendAvailableAt > now) {
    return {
      ok: false,
      error: "RATE_LIMIT",
      retryAfterSec: Math.ceil((existing.resendAvailableAt - now) / 1000),
    };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const record: OtpRecord = {
    phoneNormalized,
    purpose: params.purpose,
    codeHash: hashCode(params.purpose, phoneNormalized, code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    resendAvailableAt: now + OTP_RESEND_MS,
    createdAt: now,
  };

  await saveRecord(record);

  const locale = params.locale === "uz" ? "uz" : "ru";
  const smsResult = await sendEskizSms({
    mobilePhone: phoneNormalized,
    message: buildSmsText(params.purpose, code, locale),
  });

  if (!smsResult.ok) {
    await deleteRecord(params.purpose, phoneNormalized);
    if (smsResult.skipped) return { ok: false, error: "SMS_NOT_CONFIGURED" };
    const detail = String(smsResult.error || "").trim();
    const lower = detail.toLowerCase();
    if (
      lower.includes("модераци") ||
      lower.includes("my.eskiz.uz") ||
      lower.includes("шаблон") ||
      lower.includes("template")
    ) {
      return {
        ok: false,
        error: "SMS_TEMPLATE_NOT_APPROVED",
        detail: detail || undefined,
        status: smsResult.status,
      };
    }
    return {
      ok: false,
      error: "SMS_SEND_FAILED",
      detail: detail || undefined,
      status: smsResult.status,
    };
  }

  return { ok: true };
}

export async function verifyClientSmsOtp(params: {
  purpose: SmsOtpPurpose;
  phone: string;
  code: string;
}): Promise<VerifyOtpResult> {
  const phoneNormalized = normalizePhone(params.phone || "");
  if (!phoneNormalized || phoneNormalized.length < 9) {
    return { ok: false, error: "INVALID_PHONE" };
  }

  const code = String(params.code || "").trim();
  if (!/^\d{4,8}$/.test(code)) {
    return { ok: false, error: "INVALID_CODE" };
  }

  const record = await getRecord(params.purpose, phoneNormalized);
  if (!record) return { ok: false, error: "CODE_NOT_FOUND" };

  const now = Date.now();
  if (record.expiresAt <= now) {
    await deleteRecord(params.purpose, phoneNormalized);
    return { ok: false, error: "CODE_EXPIRED" };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await deleteRecord(params.purpose, phoneNormalized);
    return { ok: false, error: "TOO_MANY_ATTEMPTS" };
  }

  const expectedHash = hashCode(params.purpose, phoneNormalized, code);
  if (expectedHash !== record.codeHash) {
    const nextAttempts = record.attempts + 1;
    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      await deleteRecord(params.purpose, phoneNormalized);
      return { ok: false, error: "TOO_MANY_ATTEMPTS" };
    }
    await saveRecord({ ...record, attempts: nextAttempts });
    return { ok: false, error: "INVALID_CODE" };
  }

  await deleteRecord(params.purpose, phoneNormalized);
  return { ok: true };
}
