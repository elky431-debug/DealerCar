const CARDS = [
  {
    icon: "📋",
    title: "Votre stock, enfin organisé",
    before: "Fichiers Excel éparpillés, statuts flous, documents introuvables",
    after: "Toutes les fiches, documents, photos et vidéos au même endroit",
  },
  {
    icon: "🤝",
    title: "Le réseau que vous n'aviez pas",
    before: "Échanges informels par SMS, WhatsApp, bouche à oreille",
    after: "Une plateforme structurée pour trouver et partager des véhicules entre pros",
  },
  {
    icon: "📊",
    title: "Pilotez votre rentabilité",
    before: "Marges calculées à la main, frais oubliés, coût de revient flou",
    after: "Frais, prix d'achat, prix de vente — marge nette calculée automatiquement",
  },
];

export function ProblemSolution() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 md:text-[36px]">
          Fini les tableaux Excel et les groupes WhatsApp
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[#6B7280]">
          DealerLink centralise tout ce dont un marchand a besoin au quotidien.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">{c.icon}</span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{c.title}</h3>
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-800">{c.before}</p>
              <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-800">{c.after}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
