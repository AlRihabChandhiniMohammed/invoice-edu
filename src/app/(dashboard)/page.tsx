import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
  TableWrap,
  Td,
  Th,
} from "@/components/ui";
import { formatDate, formatMoney, STATUS_META } from "@/lib/format";
import { getDb } from "@/lib/store";
import type { InvoiceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STAT_STYLES = {
  brand: "bg-brand-50 text-brand-600",
  ink: "bg-ink-100 text-ink-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-500",
} as const;

const STATUS_BAR = {
  PAID: "bg-brand-500",
  PARTIAL: "bg-amber-400",
  UNPAID: "bg-red-400",
} as const;

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: keyof typeof STAT_STYLES;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-700">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${STAT_STYLES[tone]}`}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const { invoices, settings, courses } = await getDb();
  const currency = settings.currency;

  const totalBilled = invoices.reduce((sum, i) => sum + i.finalPrice, 0);
  const totalCollected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstanding = invoices.reduce((sum, i) => sum + i.balance, 0);

  const counts: Record<InvoiceStatus, number> = { PAID: 0, PARTIAL: 0, UNPAID: 0 };
  for (const invoice of invoices) counts[invoice.status] += 1;
  const maxCount = Math.max(1, ...Object.values(counts));

  const recent = [...invoices]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  const byCourse = new Map<string, { title: string; billed: number; count: number }>();
  for (const invoice of invoices) {
    const entry = byCourse.get(invoice.course.id) ?? {
      title: invoice.course.title,
      billed: 0,
      count: 0,
    };
    entry.billed += invoice.finalPrice;
    entry.count += 1;
    byCourse.set(invoice.course.id, entry);
  }
  const topCourses = [...byCourse.values()].sort((a, b) => b.billed - a.billed).slice(0, 5);
  const topCourseMax = Math.max(1, ...topCourses.map((c) => c.billed));

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Overview"
        title="Billing dashboard"
        description={`Track enrolments, payments and outstanding fees for ${settings.companyName}.`}
        actions={
          <ButtonLink href="/invoices/new">
            <Plus className="size-4" />
            Create invoice
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total billed"
          value={formatMoney(totalBilled, currency)}
          hint={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"} issued`}
          icon={<ReceiptText className="size-5" />}
          tone="brand"
        />
        <StatCard
          label="Collected"
          value={formatMoney(totalCollected, currency)}
          hint={totalBilled > 0 ? `${Math.round((totalCollected / totalBilled) * 100)}% of billed` : "No payments yet"}
          icon={<Wallet className="size-5" />}
          tone="ink"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding, currency)}
          hint={`${counts.UNPAID + counts.PARTIAL} invoice${counts.UNPAID + counts.PARTIAL === 1 ? "" : "s"} awaiting payment`}
          icon={<Clock className="size-5" />}
          tone="amber"
        />
        <StatCard
          label="Active courses"
          value={String(courses.filter((c) => c.active).length)}
          hint={`${courses.length} courses in catalogue`}
          icon={<GraduationCap className="size-5" />}
          tone="slate"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
            <div>
              <h2 className="font-display text-base font-bold text-ink-700">Recent invoices</h2>
              <p className="text-xs text-slate-500">Latest enrolments and their payment status</p>
            </div>
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
            >
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No invoices yet"
              description="Create your first invoice to start tracking payments and balances."
              action={
                <ButtonLink href="/invoices/new" size="sm">
                  <Plus className="size-4" />
                  Create invoice
                </ButtonLink>
              }
            />
          ) : (
            <TableWrap>
              <table className="w-full">
                <thead className="border-y border-slate-100 bg-slate-50/60">
                  <tr>
                    <Th>Invoice</Th>
                    <Th>Student</Th>
                    <Th>Course</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((invoice) => (
                    <tr key={invoice.id} className="group hover:bg-slate-50/70">
                      <Td>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-mono text-xs font-semibold text-ink-700 group-hover:text-brand-700"
                        >
                          {invoice.number}
                        </Link>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatDate(invoice.issueDate)}
                        </p>
                      </Td>
                      <Td>
                        <p className="font-medium text-ink-700">{invoice.student.name}</p>
                        <p className="text-[11px] text-slate-400">{invoice.student.email}</p>
                      </Td>
                      <Td className="max-w-[190px]">
                        <p className="truncate">{invoice.course.title}</p>
                        <p className="text-[11px] text-slate-400">{invoice.course.level}</p>
                      </Td>
                      <Td className="text-right">
                        <p className="font-semibold text-ink-700">
                          {formatMoney(invoice.finalPrice, currency)}
                        </p>
                        {invoice.balance > 0 ? (
                          <p className="text-[11px] text-amber-600">
                            {formatMoney(invoice.balance, currency)} due
                          </p>
                        ) : (
                          <p className="text-[11px] text-brand-600">Settled</p>
                        )}
                      </Td>
                      <Td>
                        <StatusBadge status={invoice.status} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-ink-700">Payment status</h2>
            <p className="text-xs text-slate-500">Split of all issued invoices</p>
            <div className="mt-4 space-y-4">
              {(Object.keys(counts) as InvoiceStatus[]).map((status) => (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">
                      {STATUS_META[status].label}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{counts[status]}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${STATUS_BAR[status]}`}
                      style={{ width: `${(counts[status] / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-ink-700">Top courses</h2>
            <p className="text-xs text-slate-500">By billed value</p>
            {topCourses.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No course sales yet.</p>
            ) : (
              <div className="mt-4 space-y-3.5">
                {topCourses.map((course) => (
                  <div key={course.title}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-slate-700">{course.title}</span>
                      <span className="shrink-0 font-mono text-[11px] text-slate-500">
                        {formatMoney(course.billed, currency)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-ink-500"
                        style={{ width: `${(course.billed / topCourseMax) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
