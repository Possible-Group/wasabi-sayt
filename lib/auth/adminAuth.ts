import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || "wasabi_admin_session";

export type AdminTokenPayload = {
  sub: string; // admin id
  login: string;
};

export type AdminSession = {
  adminId: string;
  login: string;
};

export function signAdminToken(payload: AdminTokenPayload) {
  const secret = process.env.ADMIN_JWT_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export async function setAdminCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function getAdminTokenFromRequest(req: NextRequest) {
  return req.cookies.get(COOKIE_NAME)?.value;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const secret = process.env.ADMIN_JWT_SECRET!;
    return jwt.verify(token, secret) as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function setAdminSession(session: AdminSession) {
  const token = signAdminToken({ sub: session.adminId, login: session.login });
  await setAdminCookie(token);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload) return null;
  return { adminId: payload.sub, login: payload.login };
}

export async function clearAdminSession() {
  await clearAdminCookie();
}

export async function requireAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}
