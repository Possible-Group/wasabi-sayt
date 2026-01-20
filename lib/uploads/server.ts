import { mkdir, writeFile } from "fs/promises";
import path from "path";

const baseDir = (() => {
  const custom = process.env.UPLOADS_DIR;
  const resolved = custom ? path.resolve(custom) : path.join(process.cwd(), "public", "uploads");
  return resolved.endsWith(path.sep) ? resolved : `${resolved}${path.sep}`;
})();

function resolveUploadPath(...segments: string[]) {
  const target = path.normalize(path.join(baseDir, ...segments));
  if (!target.startsWith(baseDir)) {
    throw new Error("Invalid upload path");
  }
  return target;
}

export async function saveUploadFile(subdir: string, fileName: string, buffer: Buffer) {
  const dir = resolveUploadPath(subdir);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  await writeFile(filePath, buffer);
  return filePath;
}

export function buildUploadUrl(subdir: string, fileName: string) {
  const cleanSubdir = subdir.replace(/^\/+|\/+$/g, "");
  return `/uploads/${cleanSubdir}/${fileName}`;
}

export function getUploadsBaseDir() {
  return baseDir.slice(0, -1);
}

export function resolveUploadsFilePath(parts: string[]) {
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new Error("Missing path");
  }
  return resolveUploadPath(...parts);
}
