"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Menu,
  Plus,
  ReceiptText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/courses", label: "Courses & fees", icon: GraduationCap },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-slate-200">
        <Image src="/logo.png" alt="EduAltTech" width={40} height={40} priority />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-bold tracking-tight text-ink-700">
          EduAltTech
        </span>
        <span className="block text-[11px] font-medium text-slate-500">Invoice studio</span>
      </span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-brand-50 font-semibold text-brand-700"
                : "font-medium text-slate-600 hover:bg-slate-50 hover:text-ink-700",
            )}
          >
            <Icon
              className={cn(
                "size-[18px]",
                active ? "text-brand-600" : "text-slate-400 group-hover:text-ink-500",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  companyName,
}: {
  children: React.ReactNode;
  companyName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 pb-5 pt-6">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>
          <NavLinks pathname={pathname} />
          <div className="mt-4 px-1">
            <ButtonLink href="/invoices/new" size="sm" className="w-full">
              <Plus className="size-4" />
              New invoice
            </ButtonLink>
          </div>
        </div>
        <div className="p-3">
          <div className="rounded-2xl bg-ink-700 p-4 text-white">
            <p className="font-display text-sm font-semibold">{companyName}</p>
            <p className="mt-0.5 text-[11px] text-ink-200">A product by Setsuzoku</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-ink-300">
              Invoicing workspace
            </p>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-elev3">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <Brand onNavigate={() => setOpen(false)} />
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
              <div className="mt-4 px-1">
                <ButtonLink
                  href="/invoices/new"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  <Plus className="size-4" />
                  New invoice
                </ButtonLink>
              </div>
            </div>
            <div className="border-t border-slate-100 p-4 text-[11px] text-slate-500">
              {companyName} · A product by Setsuzoku
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              >
                <Menu className="size-5" />
              </button>
              <Link href="/" className="font-display text-sm font-bold text-ink-700">
                EduAltTech
              </Link>
            </div>
            <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
              <span className="size-1.5 rounded-full bg-brand-500" />
              All changes are saved locally on this device
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                aria-label="Settings"
                className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink-700 sm:block"
              >
                <Settings className="size-[18px]" />
              </Link>
              <ButtonLink href="/invoices/new" size="sm">
                <Plus className="size-4" />
                New invoice
              </ButtonLink>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-1 border-t border-slate-200 pt-5 text-[11px] text-slate-400 sm:flex-row sm:items-center">
            <p>
              © {year} EduAltTech · A product by Setsuzoku
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
              Invoice studio
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
