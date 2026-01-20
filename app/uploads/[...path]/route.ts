import { NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";
import { resolveUploadsFilePath } from "@/lib/uploads/server";

export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
};

function guessMime(filePath: string) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return MIME_MAP[ext] || "application/octet-stream";
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  const segments = Array.isArray(params.path) ? params.path : [];
  if (!segments.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let filePath: string;
  try {
    filePath = resolveUploadsFilePath(segments);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const data = await readFile(filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "content-type": guessMime(filePath),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("uploads read error", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const res = await GET(req, context);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}
