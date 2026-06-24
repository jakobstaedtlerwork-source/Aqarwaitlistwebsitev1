import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuid } from "uuid";

const useS3 = !!(process.env.S3_BUCKET && process.env.S3_REGION);

const s3 = useS3
  ? new S3Client({
      region: process.env.S3_REGION!,
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          }
        : undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
    })
  : null;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadFile(
  file: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ fileKey: string; fileName: string }> {
  const sanitized = sanitizeFileName(originalName);
  const fileKey = `${uuid()}-${sanitized}`;

  if (s3 && process.env.S3_BUCKET) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
        Body: file,
        ContentType: mimeType,
      })
    );
  } else {
    const uploadDir = join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, fileKey), file);
  }

  return { fileKey, fileName: sanitized };
}

export async function getFileUrl(fileKey: string): Promise<string> {
  if (s3 && process.env.S3_BUCKET) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: fileKey,
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  }
  return `/api/documents/${encodeURIComponent(fileKey)}/download`;
}

export async function getFileBuffer(fileKey: string): Promise<Buffer | null> {
  if (s3 && process.env.S3_BUCKET) {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: fileKey,
      })
    );
    const bytes = await result.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  }
  const { readFile } = await import("fs/promises");
  const filePath = join(process.cwd(), "uploads", fileKey);
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10); // 10MB
