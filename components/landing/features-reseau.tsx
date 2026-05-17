const FEAT = [
  {
    icon: "🔍",
    title: "Recherche avancée",
    desc: "Filtrez par marque, prix, localisation, type. Résultats en temps réel sur les véhicules disponibles du réseau.",
  },
  {
    icon: "📍",
    title: "Coordonnées directes",
    desc: "Chaque annonce affiche le nom, la ville et le contact du marchand vendeur. Un appel suffit.",
  },
  {
    icon: "❤️",
    title: "Favoris & alertes",
    desc: "Sauvegardez les véhicules qui vous intéressent. Soyez alerté si leur statut change.",
  },
];

function ReseauSearchMockup() {
  const cards = [
    { e: "🚙", n: "BMW X3 xDrive", km: "62 000 km", p: "32 500 €", m: "Garage Martin" },
    { e: "🚗", n: "Audi A4 Avant", km: "118 000 km", p: "14 200 €", m: "Sud Trucks" },
    { e: "🚘", n: "Mercedes GLC", km: "45 000 km", p: "41 900 €", m: "EliteCar Paris" },
    { e: "🚙", n: "Volvo XC60", km: "89 000 km", p: "26 000 €", m: "ProVente Auto" },
  ];
  return (
    <div className="landing-card-surface p-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
        Rechercher un véhicule sur le réseau…
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.n} className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-xs">
            <div className="text-lg">{c.e}</div>
            <p className="mt-1 font-semibold text-gray-900">{c.n}</p>
            <p className="text-gray-500">{c.km}</p>
            <p className="mt-1 font-bold text-gray-900">{c.p}</p>
            <span className="mt-1 inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">
              {c.m}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeaturesReseau() {
  return (
    <section id="reseau" className="scroll-mt-24 landing-section-alt py-20">
      <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <ReseauSearchMockup />
        </div>
        <div>
          <span className="inline-flex rounded-full bg-landing-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-landing-brand">
            Réseau inter-marchands
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-[40px]">
            Accédez aux véhicules avant tout le monde
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-landing-muted">
            DealerLink n&apos;est pas un agrégateur d&apos;annonces publiques. C&apos;est un réseau privé B2B où les
            professionnels partagent leurs véhicules entre eux, avant publication sur Leboncoin ou La Centrale.
          </p>
          <ul className="mt-10 space-y-6">
            {FEAT.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
            <div>
              <p className="text-3xl font-bold tabular-nums text-landing-brand md:text-4xl">247</p>
              <p className="mt-1 text-[13px] text-gray-500">véhicules disponibles</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-landing-brand md:text-4xl">38</p>
              <p className="mt-1 text-[13px] text-gray-500">marchands actifs</p>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums text-landing-brand md:text-4xl">&lt;24h</p>
              <p className="mt-1 text-[13px] text-gray-500">délai moyen de réponse</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
