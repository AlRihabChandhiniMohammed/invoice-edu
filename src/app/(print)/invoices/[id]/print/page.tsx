import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { PrintButton } from "@/components/invoices/print-button";
import { getSignatureDataUrl } from "@/lib/secure";
import { getInvoice, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PrintInvoicePage({
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

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 print:max-w-none print:px-0">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/invoices/${invoice.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink-700"
        >
          <ArrowLeft className="size-3.5" />
          Back to invoice
        </Link>
        <PrintButton size="sm" />
      </div>
      <InvoiceDocument invoice={invoice} settings={viewSettings} />
      <p className="no-print mt-4 text-center text-[11px] text-slate-400">
        Use your browser print dialog to save this invoice as a PDF.
      </p>
    </div>
  );
}
