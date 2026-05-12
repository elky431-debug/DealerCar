import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo DealerLink (fichier dans `public/dealerlink-logo.png`) — landing & pied de page. */
export function LandingLogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/dealerlink-logo.png"
      alt="DealerLink"
      width={96}
      height={96}
      className={cn("h-8 w-8 shrink-0 object-contain", className)}
      priority
    />
  );
}
