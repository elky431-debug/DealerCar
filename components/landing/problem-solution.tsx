import { Check, X } from "lucide-react";
import { BrandText } from "@/components/landing/brand-text";

const CARDS = [
  {
    icon: "📋",
    title: (
      <>
        Votre stock, enfin <BrandText>organisé</BrandText>
      </>
    ),
    before: "Fichiers Excel éparpillés, statuts flous, documents introuvables",
    after: "Toutes les fiches, documents, photos et vidéos au même endroit",
  },
  {
    icon: "🤝",
    title: (
      <>
        Le <BrandText>réseau</BrandText> que vous n&apos;aviez pas
      </>
    ),
    before: "Échanges informels par SMS, WhatsApp, bouche à oreille",
    after: "Une plateforme structurée pour trouver et partager des véhicules entre pros",
  },
  {
    icon: "📊",
    title: (
      <>
        Pilotez votre <BrandText>rentabilité</BrandText>
      </>
    ),
    before: "Marges calculées à la main, frais oubliés, coût de revient flou",
    after: "Frais, prix d'achat, prix de vente — marge nette calculée automatiquement",
  },
];

export function ProblemSolution() {
  return (
    <section className="bg-white/50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 md:text-[36px]">
          Fini les tableaux <BrandText>Excel</BrandText> et les groupes <BrandText>WhatsApp</BrandText>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-landing-muted">
          DealerLink centralise tout ce dont un marchand a besoin au quotidien.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <div
              key={i}
              className="landing-card-surface flex flex-col p-6 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D99330]/10 text-2xl">
                {c.icon}
              </span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{c.title}</h3>
              <p className="mt-4 flex gap-2.5 rounded-lg border border-gray-100 bg-gray-50/80 p-3 text-sm leading-relaxed text-gray-600">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" strokeWidth={2.5} aria-hidden />
                <span>{c.before}</span>
              </p>
              <p className="mt-2 flex gap-2.5 rounded-lg border border-gray-100 bg-white p-3 text-sm leading-relaxed text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D99330]" strokeWidth={2.5} aria-hidden />
                <span>{c.after}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

