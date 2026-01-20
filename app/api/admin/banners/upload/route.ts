import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { requireAdmin } from "@/lib/auth/adminAuth";
import { buildUploadUrl, saveUploadFile } from "@/lib/uploads/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const extRaw = path.extname(file.name || "").slice(1);
  const ext = extRaw ? `.${extRaw}` : ".jpg";
  const fileName = `${Date.now()}-${randomUUID()}${ext}`;

  await saveUploadFile("banners", fileName, buffer);

  return NextResponse.json({ url: buildUploadUrl("banners", fileName) });
}
