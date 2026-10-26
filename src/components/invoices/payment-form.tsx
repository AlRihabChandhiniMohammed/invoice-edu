"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { recordPayment } from "@/lib/actions";
import { PAYMENT_METHODS, todayISO } from "@/lib/format";

export function PaymentForm({
  invoiceId,
  balance,
  currency,
}: {
  invoiceId: string;
  balance: number;
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setError("");
    setDone(false);
    startTransition(async () => {
      const result = await recordPayment(invoiceId, { amount: parsed, method, date, note });
      if (result.ok) {
        setDone(true);
        setAmount(String(Math.max(0, balance - Math.min(parsed, balance))));
        setNote("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5 px-5 py-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </div>
      )}
      {done && (
        <div className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          Payment recorded.
        </div>
      )}

      <Field label={`Amount (${currency})`} htmlFor="payAmount">
        <Input
          id="payAmount"
          type="number"
          min="0.01"
          max={balance}
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Method" htmlFor="payMethod">
          <Select id="payMethod" value={method} onChange={(event) => setMethod(event.target.value)}>
            {PAYMENT_METHODS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="payDate">
          <Input
            id="payDate"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
      </div>
      <Field label="Note" htmlFor="payNote" hint="Optional reference or remark">
        <Input
          id="payNote"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. UPI ref 4821"
        />
      </Field>
      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? "Recording..." : "Record payment"}
      </Button>
    </form>
  );
}
