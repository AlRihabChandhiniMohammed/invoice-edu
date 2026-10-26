import { del, get, put } from "@vercel/blob";

const PRIVATE_ACCESS = "private" as const;

export function isBlobStorageEnabled(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

export async function readBlobText(pathname: string): Promise<string | null> {
  const result = await get(pathname, {
    access: PRIVATE_ACCESS,
    useCache: false,
  });
  if (!result) return null;
  return new Response(result.stream).text();
}

export async function writeBlobText(
  pathname: string,
  text: string,
  contentType = "application/json",
): Promise<void> {
  await put(pathname, text, {
    access: PRIVATE_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    cacheControlMaxAge: 60,
  });
}

export async function deleteBlob(pathname: string): Promise<void> {
  await del(pathname);
}
