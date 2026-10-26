import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error("Usage: node scripts/encrypt-signature.mjs <image.png|jpg>");
  process.exit(1);
}

const dataDir = path.join(process.cwd(), "data");
const sigFile = path.join(dataDir, "signature.enc");
const keyFile = path.join(dataDir, "signature.key");

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  throw new Error("Input must be a PNG, JPG or WebP image.");
}

async function key() {
  const env = process.env.SIGNATURE_SECRET?.trim();
  if (env) {
    return /^[0-9a-fA-F]{64}$/.test(env)
      ? Buffer.from(env, "hex")
      : crypto.createHash("sha256").update(env).digest();
  }
  try {
    const raw = (await fs.readFile(keyFile, "utf8")).trim();
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  } catch {
    // create below
  }
  const fresh = crypto.randomBytes(32);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(keyFile, fresh.toString("hex"), { encoding: "utf8", mode: 0o600 });
  return fresh;
}

const buffer = await fs.readFile(inputPath);
const encryptionKey = await key();
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
const tag = cipher.getAuthTag();

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(
  sigFile,
  JSON.stringify({
    v: 1,
    alg: "AES-256-GCM",
    mime: mimeFor(inputPath),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64"),
  }),
  { encoding: "utf8", mode: 0o600 },
);

console.log(`Encrypted signature written to ${sigFile}`);
console.log(
  process.env.SIGNATURE_SECRET
    ? "Key source: SIGNATURE_SECRET environment variable"
    : `Key source: ${keyFile} (keep this file private)`,
);
