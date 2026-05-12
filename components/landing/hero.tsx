import Link from "next/link";
import { Check } from "lucide-react";

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
      <div className="flex h-[52px] items-center gap-3 border-b border-gray-100 bg-gray-50 px-4">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs font-medium text-gray-500">DealerLink — Dashboard</span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { l: "Véhicules", v: "24" },
            { l: "Disponibles", v: "18" },
            { l: "Réservés", v: "4" },
            { l: "CA mois", v: "128k €" },
          ].map((c) => (
            <div key={c.l} className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{c.l}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{c.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-3">
          <p className="text-[11px] font-semibold text-gray-500">Activité (7 j)</p>
          <svg viewBox="0 0 200 48" className="mt-2 h-12 w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 38 L30 32 L55 28 L80 22 L105 26 L130 14 L155 18 L180 10 L200 6 L200 48 L0 48 Z"
              fill="url(#g)"
            />
            <path
              d="M0 38 L30 32 L55 28 L80 22 L105 26 L130 14 L155 18 L180 10 L200 6"
              fill="none"
              stroke="#22c55e"
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
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-lg" aria-hidden>
                  🚗
                </span>
                <span className="truncate font-medium text-gray-900">{row.n}</span>
              </span>
              <span className="shrink-0 font-semibold text-gray-900">{row.p}</span>
              <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
                {row.s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="border-b border-gray-100 bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-[20px] border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-gray-900">Réseau</span>
            <span className="text-gray-600">Déjà 38 marchands actifs</span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-[-0.5px] text-gray-900 md:text-[52px]">
            La plateforme des
            <br />
            marchands automobiles{" "}
            <span className="text-black">professionnels</span>
          </h1>

          <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-[#6B7280]">
            Gérez votre stock, vos dépôts-vente et vos documents. Trouvez des véhicules entre professionnels avant
            leur publication publique.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-[10px] bg-gray-900 px-6 py-3 text-base font-medium text-white transition-colors duration-150 hover:bg-black"
            >
              Commencer gratuitement →
            </Link>
            <a
              href="#fonctionnalites"
              className="text-center text-base font-medium text-gray-500 underline-offset-4 transition-colors hover:text-gray-900 hover:underline sm:text-left"
            >
              Voir une démo ↓
            </a>
          </div>

          <ul className="mt-8 flex flex-col gap-2 text-[13px] text-gray-500 sm:flex-row sm:flex-wrap sm:gap-x-6">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
              Sans carte bancaire
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
              14 jours d&apos;essai
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
              Résiliation libre
            </li>
          </ul>
        </div>

        <div className="lg:col-span-5">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
