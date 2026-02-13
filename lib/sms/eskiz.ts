import "server-only";

type EskizState = {
  token: string | null;
};

type EskizResponse = {
  message?: string;
  data?: {
    token?: string;
    id?: string | number;
  };
  id?: string | number;
  [key: string]: unknown;
};

export type SendEskizSmsInput = {
  mobilePhone: string;
  message: string;
  callbackUrl?: string;
  userSmsId?: string;
};

export type SendEskizSmsResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  requestId?: string;
};

const ESKIZ_BASE_URL = (process.env.ESKIZ_BASE_URL || "https://notify.eskiz.uz").replace(/\/$/, "");
const ESKIZ_EMAIL = String(process.env.ESKIZ_EMAIL || "").trim();
const ESKIZ_PASSWORD = String(process.env.ESKIZ_PASSWORD || "").trim();
const ESKIZ_FROM = String(process.env.ESKIZ_FROM || "4546").trim();
const ESKIZ_CALLBACK_URL = String(process.env.ESKIZ_CALLBACK_URL || "").trim();
const ESKIZ_ENABLED = String(process.env.ESKIZ_ENABLED || "0").trim() === "1";

const eskizState: EskizState = ((globalThis as any).__eskizState ||= { token: null });

function isConfigured() {
  return ESKIZ_ENABLED && Boolean(ESKIZ_EMAIL && ESKIZ_PASSWORD && ESKIZ_FROM);
}

function normalizeUzPhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 12 && digits.startsWith("998")) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return `998${digits.slice(1)}`;
  if (digits.length === 9) return `998${digits}`;
  return "";
}

function extractToken(payload: unknown) {
  const data = payload as EskizResponse | null;
  const token = data?.data?.token;
  if (typeof token === "string" && token.trim()) return token.trim();
  return "";
}

async function parseJsonSafe(res: Response) {
  const text = await res.text().catch(() => "");
  if (!text) return {} as EskizResponse;
  try {
    return JSON.parse(text) as EskizResponse;
  } catch {
    return { message: text };
  }
}

async function loginEskiz() {
  const form = new FormData();
  form.set("email", ESKIZ_EMAIL);
  form.set("password", ESKIZ_PASSWORD);

  const res = await fetch(`${ESKIZ_BASE_URL}/api/auth/login`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  const json = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(`ESKIZ_LOGIN_FAILED:${res.status}`);
  }

  const token = extractToken(json);
  if (!token) throw new Error("ESKIZ_LOGIN_TOKEN_EMPTY");
  eskizState.token = token;
  return token;
}

async function refreshEskizToken(currentToken: string) {
  const res = await fetch(`${ESKIZ_BASE_URL}/api/auth/refresh`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${currentToken}` },
    cache: "no-store",
  });
  const json = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(`ESKIZ_REFRESH_FAILED:${res.status}`);
  }
  const token = extractToken(json);
  if (!token) throw new Error("ESKIZ_REFRESH_TOKEN_EMPTY");
  eskizState.token = token;
  return token;
}

async function sendWithToken(
  token: string,
  input: SendEskizSmsInput
): Promise<{ res: Response; data: EskizResponse }> {
  const form = new FormData();
  form.set("mobile_phone", normalizeUzPhone(input.mobilePhone));
  form.set("message", input.message);
  form.set("from", ESKIZ_FROM);
  const callbackUrl = input.callbackUrl || ESKIZ_CALLBACK_URL;
  if (callbackUrl) form.set("callback_url", callbackUrl);
  if (input.userSmsId) form.set("user_sms_id", input.userSmsId);

  const res = await fetch(`${ESKIZ_BASE_URL}/api/message/sms/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });
  const data = await parseJsonSafe(res);
  return { res, data };
}

export async function sendEskizSms(input: SendEskizSmsInput): Promise<SendEskizSmsResult> {
  if (!isConfigured()) {
    return { ok: false, skipped: true, error: "ESKIZ_NOT_CONFIGURED" };
  }

  const phone = normalizeUzPhone(input.mobilePhone);
  if (!phone) {
    return { ok: false, error: "INVALID_PHONE" };
  }

  const message = String(input.message || "").trim();
  if (!message) {
    return { ok: false, error: "EMPTY_MESSAGE" };
  }

  let token = eskizState.token;
  if (!token) {
    token = await loginEskiz();
  }

  let firstTry = await sendWithToken(token, { ...input, mobilePhone: phone });
  if (firstTry.res.status === 401) {
    try {
      token = await refreshEskizToken(token);
    } catch {
      token = await loginEskiz();
    }
    firstTry = await sendWithToken(token, { ...input, mobilePhone: phone });
  }

  if (!firstTry.res.ok) {
    return {
      ok: false,
      status: firstTry.res.status,
      error:
        typeof firstTry.data?.message === "string" && firstTry.data.message
          ? firstTry.data.message
          : "ESKIZ_SEND_FAILED",
    };
  }

  const requestId = String(firstTry.data?.id ?? firstTry.data?.data?.id ?? "").trim();
  return { ok: true, requestId: requestId || undefined };
}
