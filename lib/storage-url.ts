import { BASE_URL_IMAGES } from "@/lib/constants";

/** Stored path → URL for display (S3 / Liara or legacy local public uploads) */
export function resolveStorageUrl(
  path: string | null | undefined
): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/uploads/")) return path;
  if (path.startsWith("/")) return BASE_URL_IMAGES + path;
  return path;
}

export function storagePathToS3Key(path: string): string {
  return path.startsWith("/") ? path.slice(1) : path;
}

export function isS3StoragePath(path: string): boolean {
  return path.startsWith("/images/");
}

/** Full avatar URL for API responses (BASE_URL_IMAGES + stored path) */
export function avatarApiUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  return BASE_URL_IMAGES + stored;
}
