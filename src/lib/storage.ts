import "server-only";
import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

const MAX_MB = Number(process.env.MAX_UPLOAD_MB ?? 10);
export const MAX_UPLOAD_BYTES = MAX_MB * 1024 * 1024;

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
};

function uploadRoot() {
  return path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");
}

export class UploadError extends Error {}

export async function saveUpload(file: File, uploadedById?: string | null) {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new UploadError("empty_file");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`file_too_large:${MAX_MB}`);
  }
  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    throw new UploadError("file_type_not_allowed");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const now = new Date();
  const folder = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const storedName = path.join(folder, `${randomUUID()}${ext}`);
  const absolute = path.join(uploadRoot(), storedName);

  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, buffer, { mode: 0o640 });

  return prisma.uploadedFile.create({
    data: {
      storedName,
      originalName: file.name.slice(0, 200),
      mime: file.type,
      size: file.size,
      checksum: createHash("sha256").update(buffer).digest("hex"),
      uploadedById: uploadedById ?? null,
    },
  });
}

export async function readUpload(storedName: string) {
  const absolute = path.join(uploadRoot(), storedName);
  if (!absolute.startsWith(uploadRoot())) throw new UploadError("invalid_path");
  const buffer = await readFile(absolute);
  return buffer;
}

export async function deleteUpload(fileId: string) {
  const file = await prisma.uploadedFile.findUnique({ where: { id: fileId } });
  if (!file) return;
  const absolute = path.join(uploadRoot(), file.storedName);
  await unlink(absolute).catch(() => null);
  await prisma.uploadedFile.delete({ where: { id: fileId } }).catch(() => null);
}
