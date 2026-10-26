"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import { formatInvoiceNumber, mutateDb } from "./store";
import { deleteSignature as deleteStoredSignature, encryptSignature } from "./secure";
import type {
  Course,
  CourseLevel,
  Invoice,
  InvoiceInput,
  InvoiceStatus,
  Settings,
} from "./types";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function statusFor(amountPaid: number, total: number): InvoiceStatus {
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid >= total - 0.01) return "PAID";
  return "PARTIAL";
}

function clean(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function revalidateInvoicePaths(id?: string) {
  revalidatePath("/");
  revalidatePath("/invoices");
  revalidatePath("/courses");
  revalidatePath("/settings");
  if (id) revalidatePath(`/invoices/${id}`);
}

export async function createInvoice(
  input: InvoiceInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const studentName = clean(input.studentName, 120);
  const email = clean(input.email, 160).toLowerCase();
  const phone = clean(input.phone, 30);
  const issueDate = clean(input.issueDate, 10) || new Date().toISOString().slice(0, 10);
  const dueDate = clean(input.dueDate, 10);
  const notes = clean(input.notes, 1500);
  const paymentMethod = clean(input.paymentMethod, 40) || "UPI";

  if (!studentName) return { ok: false, error: "Student name is required." };
  if (!email || !isEmail(email)) return { ok: false, error: "A valid email is required." };
  if (!phone || !isPhone(phone)) return { ok: false, error: "A valid phone number is required." };
  if (!input.courseId) return { ok: false, error: "Please select a course." };

  const actualPrice = round2(Number(input.actualPrice));
  const requestedFinal = round2(Number(input.finalPrice));

  if (!Number.isFinite(actualPrice) || actualPrice <= 0) {
    return { ok: false, error: "Course fee must be greater than zero." };
  }
  if (!Number.isFinite(requestedFinal) || requestedFinal < 0 || requestedFinal > actualPrice) {
    return { ok: false, error: "Final amount must be between zero and the actual fee." };
  }

  try {
    const result = await mutateDb((db) => {
      const course = db.courses.find((c) => c.id === input.courseId);
      if (!course) return { ok: false as const, error: "Selected course was not found." };

      const finalPrice = requestedFinal;
      const discountAmount = round2(actualPrice - finalPrice);
      const discountPercent = round2((discountAmount / actualPrice) * 100);
      const rawPaid = round2(Number(input.amountPaid));
      const amountPaid = round2(
        Math.min(finalPrice, Math.max(0, Number.isFinite(rawPaid) ? rawPaid : 0)),
      );
      const balance = round2(finalPrice - amountPaid);
      const status = statusFor(amountPaid, finalPrice);
      const year = Number(issueDate.slice(0, 4)) || new Date().getFullYear();
      const sequence = Math.max(1, Math.trunc(db.settings.nextNumber));
      const number = formatInvoiceNumber(db.settings, year, sequence);
      const now = new Date().toISOString();

      const invoice: Invoice = {
        id: crypto.randomUUID(),
        number,
        student: { name: studentName, email, phone },
        course: {
          id: course.id,
          title: course.title,
          category: course.category,
          level: course.level,
        },
        actualPrice,
        discountPercent,
        discountAmount,
        finalPrice,
        amountPaid,
        balance,
        status,
        issueDate,
        dueDate,
        paymentMethod,
        notes,
        payments:
          amountPaid > 0
            ? [
                {
                  id: crypto.randomUUID(),
                  date: issueDate,
                  amount: amountPaid,
                  method: paymentMethod,
                  note: "Initial payment",
                },
              ]
            : [],
        createdAt: now,
      };

      db.settings.nextNumber = sequence + 1;
      db.invoices.push(invoice);
      return { ok: true as const, id: invoice.id };
    });

    if (result.ok) revalidateInvoicePaths(result.id);
    return result;
  } catch {
    return { ok: false, error: "Could not save the invoice. Please try again." };
  }
}

export async function recordPayment(
  invoiceId: string,
  input: { amount: number; method: string; date: string; note?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const amount = round2(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter an amount greater than zero." };
  }

  try {
    const result = await mutateDb((db) => {
      const invoice = db.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return { ok: false as const, error: "Invoice not found." };
      if (invoice.balance <= 0) return { ok: false as const, error: "This invoice is fully paid." };

      const applied = round2(Math.min(amount, invoice.balance));
      invoice.payments.push({
        id: crypto.randomUUID(),
        date: clean(input.date, 10) || new Date().toISOString().slice(0, 10),
        amount: applied,
        method: clean(input.method, 40) || "UPI",
        note: clean(input.note, 300),
      });
      invoice.amountPaid = round2(invoice.amountPaid + applied);
      invoice.balance = round2(invoice.finalPrice - invoice.amountPaid);
      invoice.status = statusFor(invoice.amountPaid, invoice.finalPrice);
      return { ok: true as const };
    });

    if (result.ok) revalidateInvoicePaths(invoiceId);
    return result;
  } catch {
    return { ok: false, error: "Could not record the payment." };
  }
}

export async function deleteInvoice(invoiceId: string): Promise<{ ok: true }> {
  await mutateDb((db) => {
    db.invoices = db.invoices.filter((i) => i.id !== invoiceId);
  });
  revalidateInvoicePaths();
  return { ok: true };
}

export async function saveCourse(
  input: {
    id?: string;
    title: string;
    category: string;
    level: CourseLevel;
    actualPrice: number;
    discountedPrice: number;
    active: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const title = clean(input.title, 120);
  const category = clean(input.category, 80) || "General";
  const level: CourseLevel = ["Beginner", "Intermediate", "Advanced"].includes(input.level)
    ? input.level
    : "Beginner";
  const actualPrice = round2(Number(input.actualPrice));
  const discountedPrice = round2(Number(input.discountedPrice));

  if (!title) return { ok: false, error: "Course title is required." };
  if (!Number.isFinite(actualPrice) || actualPrice <= 0) {
    return { ok: false, error: "Actual price must be greater than zero." };
  }
  if (!Number.isFinite(discountedPrice) || discountedPrice < 0 || discountedPrice > actualPrice) {
    return { ok: false, error: "Discounted price must be between 0 and the actual price." };
  }

  try {
    await mutateDb((db) => {
      if (input.id) {
        const course = db.courses.find((c) => c.id === input.id);
        if (course) {
          course.title = title;
          course.category = category;
          course.level = level;
          course.actualPrice = actualPrice;
          course.discountedPrice = discountedPrice;
          course.active = Boolean(input.active);
        }
        return;
      }

      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "course";
      const id = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
      const course: Course = {
        id,
        slug,
        title,
        category,
        level,
        actualPrice,
        discountedPrice,
        active: Boolean(input.active),
      };
      db.courses.push(course);
    });
    revalidateInvoicePaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save the course." };
  }
}

export async function deleteCourse(courseId: string): Promise<{ ok: true }> {
  await mutateDb((db) => {
    db.courses = db.courses.filter((c) => c.id !== courseId);
  });
  revalidateInvoicePaths();
  return { ok: true };
}

export async function updateSettings(
  input: Partial<Settings>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const logo = clean(input.logoUrl, 4_000_000);

  if (logo && !/^(data:image\/|https?:\/\/|\/)/.test(logo)) {
    return { ok: false, error: "Logo must be an image file." };
  }

  const next: Partial<Settings> = {
    companyName: clean(input.companyName, 120),
    tagline: clean(input.tagline, 160),
    email: clean(input.email, 160),
    phone: clean(input.phone, 40),
    website: clean(input.website, 160),
    address: clean(input.address, 300),
    gstin: clean(input.gstin, 40),
    currency: clean(input.currency, 8) || "INR",
    invoicePrefix: clean(input.invoicePrefix, 12) || "INV",
    nextNumber: Math.max(1, Math.trunc(Number(input.nextNumber) || 1)),
    signatoryName: clean(input.signatoryName, 120),
    signatoryTitle: clean(input.signatoryTitle, 120),
    footerNote: clean(input.footerNote, 600),
  };

  if (!next.companyName) return { ok: false, error: "Company name is required." };
  if (next.email && !isEmail(next.email)) {
    return { ok: false, error: "Enter a valid company email." };
  }

  try {
    await mutateDb((db) => {
      Object.assign(db.settings, next);
      if (input.logoUrl !== undefined) db.settings.logoUrl = logo;
    });
    revalidateInvoicePaths();
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save settings." };
  }
}

export async function uploadSignature(
  dataUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await encryptSignature(dataUrl);
    await mutateDb((db) => {
      db.settings.signatureUrl = "";
    });
    revalidateInvoicePaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not secure the signature.",
    };
  }
}

export async function removeSignature(): Promise<{ ok: true }> {
  await deleteStoredSignature();
  await mutateDb((db) => {
    db.settings.signatureUrl = "";
  });
  revalidateInvoicePaths();
  return { ok: true };
}
