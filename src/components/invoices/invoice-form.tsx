"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CircleAlert, GraduationCap, Info, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { createInvoice } from "@/lib/actions";
import { formatMoney, PAYMENT_METHODS, todayISO } from "@/lib/format";
import type { Course, InvoiceStatus, Settings } from "@/lib/types";

type PaymentChoice = "UNPAID" | "PARTIAL" | "PAID";

const PAYMENT_CHOICES: { value: PaymentChoice; title: string; hint: string }[] = [
  { value: "UNPAID", title: "Unpaid", hint: "No payment received yet" },
  { value: "PARTIAL", title: "Partially paid", hint: "Advance received, balance due" },
  { value: "PAID", title: "Paid in full", hint: "Full amount received" },
];

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function InvoiceForm({
  courses,
  settings,
}: {
  courses: Course[];
  settings: Settings;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const activeCourses = useMemo(() => courses.filter((course) => course.active), [courses]);
  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const course of activeCourses) {
      const list = map.get(course.category) ?? [];
      list.push(course);
      map.set(course.category, list);
    }
    return [...map.entries()];
  }, [activeCourses]);

  const first = activeCourses[0];

  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courseId, setCourseId] = useState(first?.id ?? "");
  const [actualPrice, setActualPrice] = useState(first ? String(first.actualPrice) : "");
  const [finalPrice, setFinalPrice] = useState(first ? String(first.discountedPrice) : "");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("UNPAID");
  const [amountPaid, setAmountPaid] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const selectedCourse = activeCourses.find((course) => course.id === courseId);

  const actual = round2(toNumber(actualPrice));
  const final = round2(toNumber(finalPrice));
  const discountAmount = round2(Math.max(0, actual - final));
  const discountPercent = actual > 0 ? round2((discountAmount / actual) * 100) : 0;

  const paid = useMemo(() => {
    if (paymentChoice === "PAID") return final;
    if (paymentChoice === "UNPAID") return 0;
    return round2(Math.min(final, Math.max(0, toNumber(amountPaid))));
  }, [paymentChoice, final, amountPaid]);

  const balance = round2(Math.max(0, final - paid));
  const status: InvoiceStatus = paid <= 0 ? "UNPAID" : paid >= final ? "PAID" : "PARTIAL";

  function selectCourse(id: string) {
    setCourseId(id);
    const course = activeCourses.find((item) => item.id === id);
    if (course) {
      setActualPrice(String(course.actualPrice));
      setFinalPrice(String(course.discountedPrice));
    }
  }

  function choosePayment(choice: PaymentChoice) {
    setPaymentChoice(choice);
    if (choice === "UNPAID") setAmountPaid("0");
    if (choice === "PAID") setAmountPaid(String(final));
    if (choice === "PARTIAL" && toNumber(amountPaid) <= 0) {
      setAmountPaid(String(round2(final / 2)));
    }
  }

  function validate(): string {
    if (!studentName.trim()) return "Enter the student's full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
    if (!courseId) return "Select a course.";
    if (actual <= 0) return "Actual course fee must be greater than zero.";
    if (final < 0 || final > actual) return "Final amount must be between zero and the actual fee.";
    if (!issueDate) return "Choose an issue date.";
    if (dueDate && dueDate < issueDate) return "Due date cannot be before the issue date.";
    if (paymentChoice === "PARTIAL" && (paid <= 0 || paid >= final)) {
      return "For a partial payment, enter an amount above zero and below the total.";
    }
    return "";
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createInvoice({
        studentName,
        email,
        phone,
        courseId,
        actualPrice: actual,
        finalPrice: final,
        amountPaid: paid,
        issueDate,
        dueDate,
        paymentMethod,
        notes,
      });
      if (result.ok) {
        router.push(`/invoices/${result.id}`);
      } else {
        setError(result.error);
      }
    });
  }

  if (activeCourses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <GraduationCap className="mx-auto size-8 text-brand-600" />
        <h2 className="mt-3 font-display text-lg font-bold text-ink-700">No active courses</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add at least one course with its actual and discounted fee before creating an invoice.
        </p>
        <div className="mt-5">
          <ButtonLink href="/courses" size="sm">
            Manage courses
          </ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <Card className="p-5 sm:p-6">
          <SectionHeading
            step="01"
            title="Student details"
            description="Who is this invoice for? The receipt is emailed to this address."
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required className="sm:col-span-2">
              <Input
                id="name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="e.g. Ananya Sharma"
                autoComplete="off"
              />
            </Field>
            <Field label="Email address" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@email.com"
                autoComplete="off"
              />
            </Field>
            <Field label="Phone number" htmlFor="phone" required>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                autoComplete="off"
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            step="02"
            title="Course & fees"
            description="Choose a course to fill its actual and discounted fee automatically."
          />
          <div className="mt-5 space-y-4">
            <Field label="Course" htmlFor="course" required>
              <Select id="course" value={courseId} onChange={(event) => selectCourse(event.target.value)}>
                {grouped.map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} · {course.level}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>

            {selectedCourse && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <Badge tone="ink">{selectedCourse.category}</Badge>
                <Badge tone="neutral">{selectedCourse.level}</Badge>
                <span className="text-slate-400">·</span>
                <span>
                  Catalogue: {formatMoney(selectedCourse.actualPrice, settings.currency)} actual,{" "}
                  {formatMoney(selectedCourse.discountedPrice, settings.currency)} final
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={`Actual course fee (${settings.currency})`}
                htmlFor="actualPrice"
                required
              >
                <Input
                  id="actualPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualPrice}
                  onChange={(event) => setActualPrice(event.target.value)}
                />
              </Field>
              <Field
                label={`Final discounted fee (${settings.currency})`}
                htmlFor="finalPrice"
                required
                hint="Amount the student actually pays"
              >
                <Input
                  id="finalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={finalPrice}
                  onChange={(event) => setFinalPrice(event.target.value)}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-brand-800">
                <Sparkles className="size-4 text-brand-600" />
                <span className="font-medium">
                  {discountPercent > 0 ? `${discountPercent}% off` : "No discount applied"}
                </span>
              </div>
              <div className="text-xs text-brand-700">
                Student saves{" "}
                <span className="font-semibold">{formatMoney(discountAmount, settings.currency)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeading
            step="03"
            title="Payment"
            description="Record what has been received. The balance updates automatically."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {PAYMENT_CHOICES.map((choice) => {
              const active = paymentChoice === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => choosePayment(choice.value)}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/15"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink-700">{choice.title}</span>
                    {active && <CheckCircle2 className="size-4 text-brand-600" />}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-500">{choice.hint}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label={`Amount paid (${settings.currency})`}
              htmlFor="amountPaid"
              hint={
                paymentChoice === "PARTIAL"
                  ? "Enter the amount received so far"
                  : paymentChoice === "PAID"
                    ? "Full amount marked as received"
                    : "Nothing received yet"
              }
            >
              <Input
                id="amountPaid"
                type="number"
                min="0"
                max={final}
                step="0.01"
                value={paymentChoice === "UNPAID" ? "0" : paymentChoice === "PAID" ? String(final) : amountPaid}
                disabled={paymentChoice !== "PARTIAL"}
                onChange={(event) => setAmountPaid(event.target.value)}
              />
            </Field>
            <Field label="Payment method" htmlFor="method" hint="Used for the initial receipt entry">
              <Select
                id="method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                disabled={paid <= 0}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Issue date" htmlFor="issueDate" required>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
              />
            </Field>
            <Field label="Due date" htmlFor="dueDate" hint="Optional, shown on the invoice">
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Notes" htmlFor="notes" hint="Optional message shown at the bottom of the invoice">
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. Weekend batch starting 2 November."
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Invoice summary
            </p>
            <p className="mt-1 font-display text-base font-bold text-ink-700">
              {studentName.trim() || "New student"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {selectedCourse?.title ?? "No course selected"}
            </p>
          </div>

          <div className="space-y-3 px-5 py-4 text-sm">
            <Row label="Actual fee" value={formatMoney(actual, settings.currency)} />
            <Row
              label={`Discount${discountPercent > 0 ? ` (${discountPercent}%)` : ""}`}
              value={`- ${formatMoney(discountAmount, settings.currency)}`}
              muted={discountAmount === 0}
            />
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-semibold text-ink-700">Total payable</span>
              <span className="font-display text-lg font-bold text-ink-700">
                {formatMoney(final, settings.currency)}
              </span>
            </div>
            <Row label="Amount paid" value={formatMoney(paid, settings.currency)} />
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
              <span className="text-xs font-semibold text-amber-800">Balance due</span>
              <span className="font-display text-base font-bold text-amber-800">
                {formatMoney(balance, settings.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">Status</span>
              <StatusBadge status={status} />
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 px-5 py-4">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating invoice..." : "Create invoice"}
            </Button>
            <ButtonLink href="/invoices" variant="secondary" className="w-full" size="md">
              Cancel
            </ButtonLink>
          </div>

          <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <p>
              Invoice number is generated automatically. The co-founder signature appears on the
              printed invoice.{" "}
              <Link href="/settings" className="font-semibold text-brand-700 hover:underline">
                Manage signature
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </form>
  );
}

function SectionHeading({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-mono text-[11px] font-bold text-brand-700">
        {step}
      </span>
      <div>
        <h2 className="font-display text-base font-bold text-ink-700">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={muted ? "text-sm text-slate-400" : "text-sm font-medium text-ink-700"}>
        {value}
      </span>
    </div>
  );
}
