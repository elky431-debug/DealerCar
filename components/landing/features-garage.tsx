const ITEMS = [
  {
    icon: "🚗",
    title: "Stock & dépôt-vente",
    desc: "Gérez chaque véhicule avec statut, type, visibilité et historique complet.",
  },
  {
    icon: "📁",
    title: "Documents & médias",
    desc: "Carte grise, contrôle technique, vidéos avant/après réparation — tout attaché à la fiche.",
  },
  {
    icon: "💰",
    title: "Frais & marges",
    desc: "Listez chaque coût engagé. La marge nette se calcule automatiquement.",
  },
  {
    icon: "👥",
    title: "Clients intéressés",
    desc: "Suivez chaque prospect : contacté → relance → offre faite → vendu.",
  },
  {
    icon: "🧾",
    title: "Historique des ventes",
    desc: "CA, marge, véhicules vendus — une vue financière claire sur votre activité.",
  },
  {
    icon: "✨",
    title: "IA intégrée",
    desc: "Estimation des réparations par photo, lecture OCR de la carte grise, assistant intelligent.",
  },
];

function VehicleSheetMockup() {
  return (
    <div className="landing-card-surface overflow-hidden">
      <div className="border-b border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Peugeot 308 SW · 2021 · 42 000 km</h3>
          <span className="landing-tag-green">Disponible</span>
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">Réseau</span>
        </div>
        <div className="mt-3 flex gap-2 text-[11px] font-semibold text-gray-500">
          <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-800">Documents</span>
          <span className="rounded-md px-2 py-1">Frais</span>
          <span className="rounded-md px-2 py-1">Clients intéressés</span>
        </div>
      </div>
      <ul className="divide-y divide-gray-100 p-2">
        {[
          ["📄", "Carte grise — recto.pdf"],
          ["📄", "CT valide.pdf"],
          ["🎬", "Vidéo avant réparation.mp4"],
        ].map(([ic, name]) => (
          <li key={name} className="flex items-center gap-3 px-2 py-2.5 text-sm">
            <span className="text-lg">{ic}</span>
            <span className="min-w-0 flex-1 truncate text-gray-700">{name}</span>
            <span className="shrink-0 text-emerald-600" aria-label="OK">
              ✓
            </span>
          </li>
        ))}
      </ul>
      <div className="border-t border-gray-100 p-4">
        <p className="text-xs text-gray-500">Prix affiché</p>
        <p className="text-2xl font-bold text-gray-900">16 500 €</p>
      </div>
    </div>
  );
}

export function FeaturesGarage() {
  return (
    <section id="fonctionnalites" className="scroll-mt-24 bg-white/50 py-20">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="max-lg:order-last">
          <VehicleSheetMockup />
        </div>
        <div className="max-lg:order-first">
          <span className="inline-flex rounded-full bg-landing-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-landing-brand">
            Mon garage
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Tout votre garage dans une seule interface
          </h2>
          <ul className="mt-10 space-y-5">
            {ITEMS.map((it) => (
              <li key={it.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
                  {it.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{it.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-landing-muted">{it.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
