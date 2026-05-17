import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Enveloppe visuelle partagée — fond maille + typo SaaS claire */
export function LandingShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("landing-saas min-h-screen bg-landing-bg font-sans text-gray-900 antialiased", className)}>
      {children}
    </div>
  );
}
