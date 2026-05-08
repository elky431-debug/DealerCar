import Link from "next/link";
import { Car } from "lucide-react";
import { SupabaseSetupNotice } from "@/components/supabase-setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(80%_80%_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]"
      />
      <header className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground shadow-[0_4px_12px_-2px_hsl(var(--primary)/0.45)]">
            <Car className="h-[18px] w-[18px]" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
          </span>
          DealerLink
        </Link>
      </header>
      <main className="container flex items-start justify-center py-8 sm:py-16">
        <div className="w-full max-w-md">
          {isSupabaseConfigured() ? children : <SupabaseSetupNotice />}
        </div>
      </main>
    </div>
  );
}
