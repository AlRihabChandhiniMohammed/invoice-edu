import { Plus } from "lucide-react";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const { invoices, settings } = await getDb();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Invoices"
        title="All invoices"
        description="Every enrolment invoice with payment status, collected amount and balance due."
        actions={
          <ButtonLink href="/invoices/new">
            <Plus className="size-4" />
            New invoice
          </ButtonLink>
        }
      />
      <Card className="overflow-hidden">
        <InvoiceList invoices={invoices} currency={settings.currency} />
      </Card>
    </div>
  );
}
