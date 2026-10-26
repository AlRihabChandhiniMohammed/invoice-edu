import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return <AppShell companyName={settings.companyName}>{children}</AppShell>;
}
