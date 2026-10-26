import { promises as fs } from "node:fs";
import path from "node:path";
import { COURSE_SEED } from "./courses-seed";
import type { Database, Invoice, Settings } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export const DEFAULT_SETTINGS: Settings = {
  companyName: "EduAltTech",
  tagline: "A product by Setsuzoku",
  email: "edualtstudy@gmail.com",
  phone: "",
  website: "edualttech.com",
  address: "Kakinada, Andhra Pradesh, India",
  gstin: "",
  currency: "INR",
  invoicePrefix: "EAT",
  nextNumber: 1,
  signatoryName: "Ranadeep Vinukonda",
  signatoryTitle: "Co-Founder",
  signatureUrl: "",
  logoUrl: "/logo.png",
  footerNote:
    "Thank you for choosing EduAltTech. For any questions about this invoice, reach out to us.",
};

function freshDb(): Database {
  return {
    settings: { ...DEFAULT_SETTINGS },
    courses: COURSE_SEED.map((c) => ({ ...c })),
    invoices: [],
  };
}

async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Database>;
    const db: Database = {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      courses: parsed.courses?.length ? parsed.courses : freshDb().courses,
      invoices: parsed.invoices ?? [],
    };
    return db;
  } catch {
    const db = freshDb();
    await writeDb(db);
    return db;
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

let queue: Promise<unknown> = Promise.resolve();

export function mutateDb<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = await readDb();
    const result = await mutator(db);
    await writeDb(db);
    return result;
  };
  const next = queue.then(run, run);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export const getDb = readDb;

export async function getSettings(): Promise<Settings> {
  return (await readDb()).settings;
}

export async function getCourses() {
  return (await readDb()).courses;
}

export async function getInvoices(): Promise<Invoice[]> {
  const { invoices } = await readDb();
  return [...invoices].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const { invoices } = await readDb();
  return invoices.find((invoice) => invoice.id === id);
}

export function formatInvoiceNumber(
  settings: Settings,
  year: number,
  sequence: number,
): string {
  const prefix = (settings.invoicePrefix || "INV").trim().toUpperCase();
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}
