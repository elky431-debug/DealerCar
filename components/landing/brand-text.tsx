import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Accent orange DealerLink (#D99330) — couleur explicite pour fiabilité Tailwind */
export function BrandText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-[#D99330]", className)}>{children}</span>;
}
