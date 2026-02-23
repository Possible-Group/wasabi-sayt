import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.CLIENT_COOKIE_NAME || "wasabi_client_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 30;
const COOKIE_DOMAIN = String(process.env.CLIENT_COOKIE_DOMAIN || "").trim();

export type ClientTokenPayload = {
  sub: string;
  phone?: string;
  name?: string;
};

export type ClientSession = {
  clientId: string;
  phone?: string;
  name?: string;
};

function getClientSecret() {
  const secret = process.env.CLIENT_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("Missing CLIENT_JWT_SECRET");
  return secret;
}

export function signClientToken(payload: ClientTokenPayload) {
  const secret = getClientSecret();
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

export async function setClientCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SEC,
    expires: new Date(Date.now() + SESSION_TTL_SEC * 1000),
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  });
}

export async function clearClientCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    maxAge: 0,
  });
}

export function getClientTokenFromRequest(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value;
}

export function verifyClientToken(token: string): ClientTokenPayload | null {
  try {
    const secret = getClientSecret();
    return jwt.verify(token, secret) as ClientTokenPayload;
  } catch {
    return null;
  }
}

export async function setClientSession(session: ClientSession) {
  const token = signClientToken({
    sub: session.clientId,
    phone: session.phone,
    name: session.name,
  });
  await setClientCookie(token);
}

export async function getClientSession(): Promise<ClientSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyClientToken(token);
  if (!payload) return null;
  return {
    clientId: payload.sub,
    phone: payload.phone,
    name: payload.name,
  };
}

export async function clearClientSession() {
  await clearClientCookie();
}
