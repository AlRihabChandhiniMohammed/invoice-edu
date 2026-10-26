"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { deleteInvoice } from "@/lib/actions";

export function DeleteInvoiceButton({ invoiceId, number }: { invoiceId: string; number: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button variant="secondary" onClick={() => setArmed(true)}>
        <Trash2 className="size-4" />
        Delete
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5">
      <span className="text-xs font-medium text-red-700">Delete {number}?</span>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await deleteInvoice(invoiceId);
            router.push("/invoices");
          });
        }}
      >
        {pending ? "Deleting..." : "Confirm"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setArmed(false)}>
        Cancel
      </Button>
    </div>
  );
}
