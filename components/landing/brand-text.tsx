import { cn } from "@/lib/utils";

/** Accent brand DealerLink (teal) — plus d'orange */
export function BrandAccent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("text-brand", className)}>{children}</span>;
}

/** @deprecated Alias — préférer BrandAccent */
export function BrandText({ className, children }: { className?: string; children: React.ReactNode }) {
  return <BrandAccent className={className}>{children}</BrandAccent>;
}
