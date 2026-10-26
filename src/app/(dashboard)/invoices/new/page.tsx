import { ArrowLeft } from "lucide-react";
import { ButtonLink, PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const { courses, settings } = await getDb();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Invoices"
        title="Create invoice"
        description="Add the student, pick a course and record the payment. Totals and balance update as you type."
        actions={
          <ButtonLink href="/invoices" variant="secondary">
            <ArrowLeft className="size-4" />
            All invoices
          </ButtonLink>
        }
      />
      <InvoiceForm courses={courses} settings={settings} />
    </div>
  );
}
