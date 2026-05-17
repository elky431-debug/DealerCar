import { cn } from "@/lib/utils";

/** Accent marque DealerLink (teal) — couleur via token `brand` */
export function BrandText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("text-brand", className)}>{children}</span>;
}
