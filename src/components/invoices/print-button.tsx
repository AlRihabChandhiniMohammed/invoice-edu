"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Button onClick={() => window.print()} size={size}>
      <Printer className="size-4" />
      Print / Save as PDF
    </Button>
  );
}
