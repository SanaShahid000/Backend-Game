import { Storage } from '@google-cloud/storage';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

let cachedStorage: Storage | null = null;

type ServiceAccountKey = {
  type?: string;
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function readServiceAccountKeyFromFile(filePath: string): ServiceAccountKey {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid service-account JSON');
  }
  return parsed as ServiceAccountKey;
}

function validateServiceAccountKey(key: ServiceAccountKey, filePath: string) {
  const privateKey = key.private_key;
  const clientEmail = key.client_email;
  const keyType = key.type;

  if (keyType && keyType !== 'service_account') {
    throw new Error(
      `Invalid key type in ${filePath}. Expected "service_account".`,
    );
  }

  if (!clientEmail || typeof clientEmail !== 'string') {
    throw new Error(
      `Missing "client_email" in ${filePath}. Use a real service-account key JSON downloaded from Google Cloud.`,
    );
  }

  if (!privateKey || typeof privateKey !== 'string') {
    throw new Error(
      `Missing "private_key" in ${filePath}. Use a real service-account key JSON downloaded from Google Cloud.`,
    );
  }

  const looksLikePem =
    privateKey.includes('BEGIN PRIVATE KEY') &&
    privateKey.includes('END PRIVATE KEY');

  if (!looksLikePem) {
    throw new Error(
      `Invalid "private_key" format in ${filePath}. It must be a PEM key (-----BEGIN PRIVATE KEY----- ...). Do not use placeholders.`,
    );
  }

  try {
    crypto.createPrivateKey(privateKey);
  } catch {
    throw new Error(
      `Invalid "private_key" in ${filePath}. Download a real service-account key JSON from Google Cloud (do not paste placeholders / backticks).`,
    );
  }
}

function getStorage(): Storage {
  if (cachedStorage) {
    return cachedStorage;
  }

  const keyFilenameRaw =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    process.env.GOOGLE_CLOUD_KEY_FILE ??
    path.join(process.cwd(), 'config', 'google-cloud-key.json');

  const keyFilename = path.isAbsolute(keyFilenameRaw)
    ? keyFilenameRaw
    : path.join(process.cwd(), keyFilenameRaw);

  if (!fs.existsSync(keyFilename)) {
    throw new Error(
      `Google Cloud key file not found: ${keyFilename}. Put your service-account JSON there, or set GOOGLE_APPLICATION_CREDENTIALS / GOOGLE_CLOUD_KEY_FILE to the correct path.`,
    );
  }

  const key = readServiceAccountKeyFromFile(keyFilename);
  validateServiceAccountKey(key, keyFilename);

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  cachedStorage = new Storage({
    keyFilename,
    ...(projectId ? { projectId } : {}),
  });
  return cachedStorage;
}

function getBucketName(): string {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not set');
  }
  return bucketName;
}

function getBucket() {
  return getStorage().bucket(getBucketName());
}

export interface UploadResult {
  fileName: string;
  publicUrl: string;
  gsUrl: string;
  signedUrl?: string;
}

/**
 * Upload file to Google Cloud Storage
 * @param file - File buffer or stream
 * @param fileName - Name for the file in storage
 * @param folder - Optional folder path (e.g., 'brokers', 'profiles')
 * @returns Promise with upload result
 */
export async function uploadToGCS(
  file: Buffer | Express.Multer.File,
  fileName: string,
  folder?: string,
): Promise<UploadResult> {
  try {
    const bucketName = getBucketName();
    const bucket = getBucket();
    const fullFileName = folder ? `${folder}/${fileName}` : fileName;
    const fileBuffer = Buffer.isBuffer(file) ? file : file.buffer;
    const fileRef = bucket.file(fullFileName);

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: getContentType(fileName),
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fullFileName}`;
    const gsUrl = `gs://${bucketName}/${fullFileName}`;

    let signedUrl: string | undefined;
    try {
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      signedUrl = url;
    } catch {
      signedUrl = undefined;
    }

    return {
      fileName: fullFileName,
      publicUrl,
      gsUrl,
      signedUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to upload file: ${message}`);
  }
}

/**
 * Delete file from Google Cloud Storage
 * @param fileName - Full file name/path in storage
 */
export async function deleteFromGCS(fileName: string): Promise<void> {
  try {
    await getBucket().file(fileName).delete();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete file: ${message}`);
  }
}

/**
 * Get content type based on file extension
 * @param fileName - File name with extension
 * @returns Content type string
 */
function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();

  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx':
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.xlsx':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  };

  return contentTypes[ext] ?? 'application/octet-stream';
}

/**
 * Generate unique file name with timestamp
 * @param originalName - Original file name
 * @returns Unique file name
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);

  return `${nameWithoutExt}_${timestamp}_${randomString}${ext}`;
}
