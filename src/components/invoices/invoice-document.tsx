import { StatusBadge } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import type { Invoice, Settings } from "@/lib/types";

export function InvoiceDocument({
  invoice,
  settings,
}: {
  invoice: Invoice;
  settings: Settings;
}) {
  const currency = settings.currency;

  return (
    <article className="print-sheet relative mx-auto w-full max-w-[820px] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-elev2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/setsuzoku-logo.png"
          alt=""
          className="w-[62%] max-w-[430px] opacity-[0.09]"
        />
      </div>

      <div className="relative z-10 p-8 sm:p-10">
        <div className="mb-7 flex items-center justify-end gap-3 border-b border-slate-100 pb-5">
          <div className="text-right">
            <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-slate-400">
              A product by
            </p>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-sz-navy">
              Setsuzoku
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/setsuzoku-logo.png" alt="Setsuzoku" className="h-11 w-auto" />
        </div>

        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-start gap-3.5">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName}
                  className="size-12 rounded-xl object-contain ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white">
                  {settings.companyName.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="font-display text-lg font-bold leading-tight text-sz-navy">
                  {settings.companyName}
                </p>
                {settings.tagline && (
                  <p className="text-[11px] font-medium text-sz-teal">{settings.tagline}</p>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-0.5 text-[11px] leading-relaxed text-slate-500">
              {settings.address && <p>{settings.address}</p>}
              <p>{[settings.email, settings.phone].filter(Boolean).join(" · ")}</p>
              {settings.website && <p>{settings.website}</p>}
              {settings.gstin && <p>GSTIN: {settings.gstin}</p>}
            </div>
          </div>

          <div className="sm:min-w-[190px] sm:text-right">
            <p className="font-display text-[26px] font-bold uppercase leading-none tracking-[0.18em] text-sz-navy">
              Invoice
            </p>
            <p className="mt-1.5 font-mono text-sm font-semibold text-sz-blue">
              {invoice.number}
            </p>
            <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
              <p>
                <span className="text-slate-400">Issued:</span> {formatDate(invoice.issueDate)}
              </p>
              {invoice.status !== "PAID" && (
                <p>
                  <span className="text-slate-400">Due:</span>{" "}
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "On receipt"}
                </p>
              )}
              <p className="flex items-center gap-1.5 sm:justify-end">
                <span className="text-slate-400">Status:</span>
                <StatusBadge status={invoice.status} />
              </p>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-5 rounded-xl border-l-[3px] border-sz-teal bg-sz-mist px-5 py-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sz-teal">
              Billed to
            </p>
            <p className="mt-1.5 text-sm font-semibold text-sz-navy">{invoice.student.name}</p>
            {invoice.student.email && (
              <p className="text-[11px] text-slate-500">{invoice.student.email}</p>
            )}
            {invoice.student.phone && (
              <p className="text-[11px] text-slate-500">{invoice.student.phone}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sz-teal">
              Course
            </p>
            <p className="mt-1.5 font-display text-base font-bold leading-snug text-sz-navy">
              {invoice.course.title}
            </p>
            <p className="text-[11px] text-slate-500">
              {invoice.course.category} · {invoice.course.level}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Payment method:{" "}
              <span className="font-medium text-slate-600">{invoice.paymentMethod}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-sz-navy text-white">
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                  Description
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.12em]">
                  Actual
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.12em]">
                  Discount
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-[0.12em]">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-sz-navy">{invoice.course.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {invoice.course.category} · {invoice.course.level}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-right text-sm text-slate-600">
                  {formatMoney(invoice.actualPrice, currency)}
                </td>
                <td className="px-4 py-3.5 text-right text-sm text-slate-600">
                  {invoice.discountAmount > 0
                    ? `−${formatMoney(invoice.discountAmount, currency)}`
                    : "—"}
                  {invoice.discountPercent > 0 && (
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({invoice.discountPercent}%)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right text-sm font-semibold text-sz-navy">
                  {formatMoney(invoice.finalPrice, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-[46%]">
            {invoice.notes ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Notes
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-slate-500">
                  {invoice.notes}
                </p>
              </>
            ) : null}
            <p className="mt-4 text-[10px] leading-relaxed text-slate-400">{settings.footerNote}</p>
          </div>

          <div className="w-full sm:max-w-[280px]">
            <div className="space-y-2 text-sm">
              <DocRow label="Subtotal" value={formatMoney(invoice.actualPrice, currency)} />
              <DocRow
                label="Discount"
                value={
                  invoice.discountAmount > 0
                    ? `−${formatMoney(invoice.discountAmount, currency)}`
                    : "—"
                }
              />
              <div className="flex items-center justify-between border-t border-slate-300 pt-2.5">
                <span className="font-display text-sm font-bold text-sz-navy">Total payable</span>
                <span className="font-display text-xl font-bold text-sz-navy">
                  {formatMoney(invoice.finalPrice, currency)}
                </span>
              </div>
              <DocRow label="Amount paid" value={formatMoney(invoice.amountPaid, currency)} />
              {invoice.balance > 0 ? (
                <div className="flex items-center justify-between rounded-lg bg-sz-mint px-3 py-2">
                  <span className="text-xs font-semibold text-sz-teal">Balance due</span>
                  <span className="font-display text-sm font-bold text-sz-teal">
                    {formatMoney(invoice.balance, currency)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-xs text-slate-500">Balance due</span>
                  <span className="text-xs font-semibold text-sz-teal">
                    {formatMoney(invoice.balance, currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-slate-100 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/setsuzoku-logo.png" alt="" className="h-6 w-auto opacity-60" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                A product by Setsuzoku
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            {settings.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.signatureUrl}
                alt={`${settings.signatoryName || "Authorised signatory"} signature`}
                className="mb-1 h-12 w-auto object-contain sm:ml-auto"
              />
            ) : (
              <div className="mb-1 h-12" />
            )}
            <div className="w-56 border-t border-slate-300 pt-1.5 sm:ml-auto">
              <p className="text-xs font-semibold text-sz-navy">
                {settings.signatoryName || "Authorised signatory"}
              </p>
              <p className="text-[10px] text-sz-teal">
                {settings.signatoryTitle || "Co-Founder"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-1.5">
        <span className="h-full flex-1 bg-sz-navy" />
        <span className="h-full flex-1 bg-sz-blue" />
        <span className="h-full flex-1 bg-sz-teal" />
      </div>
    </article>
  );
}

function DocRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}
