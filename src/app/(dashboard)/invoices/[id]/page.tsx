import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, Printer, ReceiptText, User } from "lucide-react";
import { ButtonLink, Card, StatusBadge } from "@/components/ui";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { PaymentForm } from "@/components/invoices/payment-form";
import { DeleteInvoiceButton } from "@/components/invoices/delete-invoice-button";
import { formatDate, formatMoney } from "@/lib/format";
import { getSignatureDataUrl } from "@/lib/secure";
import { getInvoice, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, settings, signature] = await Promise.all([
    getInvoice(id),
    getSettings(),
    getSignatureDataUrl(),
  ]);
  if (!invoice) notFound();

  const viewSettings = signature ? { ...settings, signatureUrl: signature } : settings;
  const currency = settings.currency;
  const progress =
    invoice.finalPrice > 0
      ? Math.min(100, Math.round((invoice.amountPaid / invoice.finalPrice) * 100))
      : 100;
  const history = [...invoice.payments].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/invoices"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink-700"
          >
            <ArrowLeft className="size-3.5" />
            All invoices
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-700 sm:text-3xl">
              {invoice.number}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Issued to <span className="font-medium text-slate-700">{invoice.student.name}</span> for{" "}
            {invoice.course.title} · {formatDate(invoice.issueDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ButtonLink href={`/invoices/${invoice.id}/print`} variant="secondary">
            <Printer className="size-4" />
            Print / PDF
          </ButtonLink>
          <DeleteInvoiceButton invoiceId={invoice.id} number={invoice.number} />
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <InvoiceDocument invoice={invoice} settings={viewSettings} />

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink-700">Payment summary</h2>
              <CreditCard className="size-4 text-slate-400" />
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <SummaryRow label="Total payable" value={formatMoney(invoice.finalPrice, currency)} />
              <SummaryRow
                label="Paid"
                value={formatMoney(invoice.amountPaid, currency)}
                tone="brand"
              />
              <SummaryRow
                label="Balance due"
                value={formatMoney(invoice.balance, currency)}
                tone={invoice.balance > 0 ? "amber" : "muted"}
              />
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Collected</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>

          {invoice.balance > 0 && (
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-display text-base font-bold text-ink-700">Record payment</h2>
                <p className="text-xs text-slate-500">
                  {formatMoney(invoice.balance, currency)} outstanding
                </p>
              </div>
              <PaymentForm
                invoiceId={invoice.id}
                balance={invoice.balance}
                currency={currency}
              />
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink-700">Student</h2>
              <User className="size-4 text-slate-400" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink-700">{invoice.student.name}</p>
            {invoice.student.email && (
              <p className="text-xs text-slate-500">{invoice.student.email}</p>
            )}
            {invoice.student.phone && (
              <p className="text-xs text-slate-500">{invoice.student.phone}</p>
            )}
            <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <p className="font-medium text-slate-600">{invoice.course.title}</p>
              <p>
                {invoice.course.category} · {invoice.course.level}
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-display text-base font-bold text-ink-700">Payment history</h2>
              <ReceiptText className="size-4 text-slate-400" />
            </div>
            {history.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-500">No payments recorded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((payment) => (
                  <li key={payment.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-700">
                        {formatMoney(payment.amount, currency)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {payment.method} · {formatDate(payment.date)}
                      </p>
                      {payment.note && (
                        <p className="text-[11px] text-slate-400">{payment.note}</p>
                      )}
                    </div>
                    <span className="mt-0.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      Received
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "brand" | "amber" | "muted";
}) {
  const tones = {
    default: "text-ink-700",
    brand: "text-brand-700",
    amber: "text-amber-600",
    muted: "text-slate-400",
  } as const;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${tones[tone]}`}>{value}</span>
    </div>
  );
}
