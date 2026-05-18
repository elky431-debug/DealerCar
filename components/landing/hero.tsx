import Link from "next/link";
import { Check } from "lucide-react";
import { BrandText } from "@/components/landing/brand-text";

function DashboardMockup() {
  return (
    <div className="landing-card-surface overflow-hidden">
      <div className="flex h-12 items-center border-b border-gray-100 bg-gray-50/90 px-4">
        <span className="text-xs font-medium text-gray-500">
          DealerLink — <BrandText>Dashboard</BrandText>
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {[
            { l: "VÉHICULES", v: "24" },
            { l: "DISPONIBLES", v: "18" },
            { l: "RÉSERVÉS", v: "4" },
            { l: "CA MOIS", v: "128k €" },
          ].map((c) => (
            <div key={c.l} className="rounded-xl border border-gray-100 bg-gray-50/90 p-3 sm:p-4">
              <p className="text-[10px] font-semibold tracking-wide text-gray-500">{c.l}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-brand sm:text-2xl">{c.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3">
          <p className="text-[11px] font-semibold text-gray-500">
            Activité <BrandText>(7 j)</BrandText>
          </p>
          <svg viewBox="0 0 200 48" className="mt-2 h-12 w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="landing-chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 38 L30 32 L55 28 L80 22 L105 26 L130 14 L155 18 L180 10 L200 6 L200 48 L0 48 Z"
              fill="url(#landing-chart-fill)"
            />
            <path
              d="M0 38 L30 32 L55 28 L80 22 L105 26 L130 14 L155 18 L180 10 L200 6"
              fill="none"
              stroke="#0d9488"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { n: "Peugeot 308 SW", p: "16 500 €", s: "Dispo" },
            { n: "Renault Austral", p: "28 900 €", s: "Réseau" },
          ].map((row) => (
            <div
              key={row.n}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-base" aria-hidden>
                  🚗
                </span>
                <span className="truncate font-medium text-gray-900">{row.n}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-brand">{row.p}</span>
              <span className="landing-tag-green">{row.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function div({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pb-24 md:pt-12">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="lg:col-span-7">
          <div className="landing-badge-dark">
            <span className="text-emerald-400" aria-hidden>
              ●
            </span>
            <span>
              Réseau actif · <BrandText className="font-semibold">38 marchands</BrandText>
            </span>
          </div>

          <h1 className="mt-7 text-[2.5rem] font-bold leading-[1.08] tracking-[-0.03em] text-gray-900 sm:text-[3.25rem] lg:text-[3.5rem]">
            La plateforme des
            <br />
            marchands automobiles
            <br />
            <BrandText>professionnels</BrandText>
          </h1>

          <p className="mt-6 max-w-[520px] text-lg leading-relaxed text-landing-muted">
            Gérez votre stock, vos dépôts-vente et vos documents. Trouvez des véhicules{" "}
            <BrandText className="font-medium">entre professionnels</BrandText> avant leur publication publique.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/register" className="landing-cta-primary">
              Commencer gratuitement →
            </Link>
            <a
              href="#fonctionnalites"
              className="text-center text-[15px] font-medium text-brand underline-offset-4 transition-colors hover:text-brand-dark hover:underline sm:text-left"
            >
              Voir une démo ↓
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-2.5 text-[13px] text-gray-500 sm:flex-row sm:flex-wrap sm:gap-x-7">
            {["Sans carte bancaire", "14 jours d'essai", "Résiliation libre"].map((label) => (
              <li key={label} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 lg:pl-2">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
