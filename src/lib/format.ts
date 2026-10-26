import type { InvoiceStatus } from "./types";

export function formatMoney(value: number, currency = "INR"): string {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatCompactMoney(value: number, currency = "INR"): string {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: amount >= 100000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
}

export function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export const STATUS_META: Record<
  InvoiceStatus,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  PAID: { label: "Paid", tone: "success" },
  PARTIAL: { label: "Partially paid", tone: "warning" },
  UNPAID: { label: "Unpaid", tone: "danger" },
};

export const PAYMENT_METHODS = [
  "UPI",
  "Card",
  "Cash",
  "Bank transfer",
  "Razorpay",
  "Other",
] as const;
