import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/adminAuth";

export async function GET() {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ admin: null });
  return NextResponse.json({ admin: s });
}
