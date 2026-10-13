import { getSupabaseAdmin } from "./admin";

export type StorageBucket = "products" | "categories" | "avatars";

export interface UploadOptions {
  bucket?: StorageBucket;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Uploads a file (Buffer, Blob, or Uint8Array) to Supabase Storage and returns its public CDN URL.
 */
export async function uploadToStorage(
  filePath: string,
  fileBody: Buffer | Uint8Array | Blob,
  options?: UploadOptions
): Promise<{ url: string; path: string }> {
  const bucket = options?.bucket || "products";
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBody, {
      contentType: options?.contentType || "image/jpeg",
      cacheControl: options?.cacheControl || "3600",
      upsert: options?.upsert ?? true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase storage bucket '${bucket}': ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

/**
 * Generates a public URL for an asset in Supabase Storage.
 */
export function getStoragePublicUrl(path: string, bucket: StorageBucket = "products"): string {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage.
 */
export async function deleteFromStorage(
  paths: string[],
  bucket: StorageBucket = "products"
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    throw new Error(`Failed to delete from Supabase storage: ${error.message}`);
  }
}
