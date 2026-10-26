import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const SIG_FILE = path.join(DATA_DIR, "signature.enc");
const KEY_FILE = path.join(DATA_DIR, "signature.key");

const MAX_BYTES = 2_000_000;
const MIME_RE = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=\s]+)$/;

function keyFromEnv(): Buffer | null {
  const raw = process.env.SIGNATURE_SECRET?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw).digest();
}

async function getKey(create: boolean): Promise<Buffer> {
  const envKey = keyFromEnv();
  if (envKey) return envKey;

  try {
    const raw = (await fs.readFile(KEY_FILE, "utf8")).trim();
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  } catch {
    // no key file yet
  }

  if (!create) throw new Error("Signature key not found.");
  const key = crypto.randomBytes(32);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(KEY_FILE, key.toString("hex"), { encoding: "utf8", mode: 0o600 });
  return key;
}

export async function encryptSignature(dataUrl: string): Promise<void> {
  const match = MIME_RE.exec(dataUrl.trim());
  if (!match) throw new Error("Signature must be a PNG, JPG or WebP image.");

  const mime = match[1].replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (buffer.length < 100) throw new Error("That image looks empty.");
  if (buffer.length > MAX_BYTES) throw new Error("Signature image must be under 2 MB.");

  const key = await getKey(true);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload = JSON.stringify({
    v: 1,
    alg: "AES-256-GCM",
    mime,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${SIG_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, payload, { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, SIG_FILE);
}

export async function getSignatureDataUrl(): Promise<string> {
  try {
    const raw = await fs.readFile(SIG_FILE, "utf8");
    const payload = JSON.parse(raw) as {
      mime?: string;
      iv?: string;
      tag?: string;
      data?: string;
    };
    if (!payload.iv || !payload.tag || !payload.data) return "";
    const key = await getKey(false);
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(payload.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, "base64")),
      decipher.final(),
    ]);
    const mime = payload.mime === "image/jpg" ? "image/jpeg" : payload.mime || "image/png";
    return `data:${mime};base64,${decrypted.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function hasEncryptedSignature(): Promise<boolean> {
  try {
    await fs.access(SIG_FILE);
    return true;
  } catch {
    return false;
  }
}

export async function deleteSignature(): Promise<void> {
  await fs.rm(SIG_FILE, { force: true });
}
