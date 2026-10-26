"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, FileText, Search } from "lucide-react";
import { ButtonLink, EmptyState, Input, Select, StatusBadge, TableWrap, Td, Th } from "@/components/ui";
import { formatDate, formatMoney, STATUS_META } from "@/lib/format";
import type { Invoice, InvoiceStatus } from "@/lib/types";

type Filter = "ALL" | InvoiceStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "All invoices" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partially paid" },
  { value: "UNPAID", label: "Unpaid" },
];

export function InvoiceList({
  invoices,
  currency,
}: {
  invoices: Invoice[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      if (filter !== "ALL" && invoice.status !== filter) return false;
      if (!term) return true;
      return [
        invoice.number,
        invoice.student.name,
        invoice.student.email,
        invoice.student.phone,
        invoice.course.title,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [invoices, query, filter]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search invoice, student, course..."
            className="pl-10"
            aria-label="Search invoices"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="w-full sm:w-44"
            aria-label="Filter by status"
          >
            {FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <span className="hidden shrink-0 rounded-lg bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-500 sm:block">
            {filtered.length} of {invoices.length}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title={invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
          description={
            invoices.length === 0
              ? "Create your first invoice to start tracking enrolments and payments."
              : "Try a different search term or payment status."
          }
          action={
            invoices.length === 0 ? (
              <ButtonLink href="/invoices/new" size="sm">
                Create invoice
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <TableWrap>
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <Th>Invoice</Th>
                <Th>Student</Th>
                <Th>Course</Th>
                <Th>Issued</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Paid</Th>
                <Th className="text-right">Balance</Th>
                <Th>Status</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="group hover:bg-slate-50/70">
                  <Td>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-mono text-xs font-semibold text-ink-700 group-hover:text-brand-700"
                    >
                      {invoice.number}
                    </Link>
                  </Td>
                  <Td>
                    <p className="font-medium text-ink-700">{invoice.student.name}</p>
                    <p className="text-[11px] text-slate-400">{invoice.student.phone}</p>
                  </Td>
                  <Td className="max-w-[220px]">
                    <p className="truncate">{invoice.course.title}</p>
                    <p className="text-[11px] text-slate-400">{invoice.course.category}</p>
                  </Td>
                  <Td className="text-slate-500">{formatDate(invoice.issueDate)}</Td>
                  <Td className="text-right font-semibold text-ink-700">
                    {formatMoney(invoice.finalPrice, currency)}
                  </Td>
                  <Td className="text-right text-brand-700">
                    {formatMoney(invoice.amountPaid, currency)}
                  </Td>
                  <Td
                    className={`text-right font-medium ${
                      invoice.balance > 0 ? "text-amber-600" : "text-slate-400"
                    }`}
                  >
                    {formatMoney(invoice.balance, currency)}
                  </Td>
                  <Td>
                    <StatusBadge status={invoice.status} />
                  </Td>
                  <Td className="text-right">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      aria-label={`Open ${invoice.number}`}
                      className="inline-flex rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-700"
                    >
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500">
        <span>{STATUS_META.PAID.label}: {invoices.filter((i) => i.status === "PAID").length}</span>
        <span>{STATUS_META.PARTIAL.label}: {invoices.filter((i) => i.status === "PARTIAL").length}</span>
        <span>{STATUS_META.UNPAID.label}: {invoices.filter((i) => i.status === "UNPAID").length}</span>
      </div>
    </div>
  );
}
