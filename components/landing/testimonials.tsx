const QUOTES = [
  {
    text: "J'ai arrêté Excel le jour où j'ai essayé DealerLink. La gestion des dépôts avec les infos client directement sur la fiche, c'est un gain de temps énorme.",
    author: "Thomas R., négociant, Lyon",
    initials: "TR",
  },
  {
    text: "Le réseau c'est vraiment différent de WhatsApp. Je trouve des véhicules que je n'aurais jamais vus autrement, avec les coordonnées directes du vendeur.",
    author: "Marc D., garage indépendant, Grenoble",
    initials: "MD",
  },
  {
    text: "L'IA qui lit la carte grise m'économise 5 minutes par véhicule. Sur 30 véhicules par mois, ça compte.",
    author: "Sophie L., revendeuse, Annecy",
    initials: "SL",
  },
];

export function Testimonials() {
  return (
    <section className="bg-gray-900 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-white md:text-[32px]">Ce que disent nos marchands</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <blockquote
              key={q.initials}
              className="flex flex-col rounded-xl border border-white/20 bg-white/10 p-6 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:p-6"
            >
              <p className="text-sm leading-relaxed text-white/95">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                  {q.initials}
                </span>
                <div>
                  <cite className="not-italic text-sm font-medium text-white/90">— {q.author}</cite>
                  <p className="mt-1 text-amber-200" aria-label="5 sur 5">
                    ⭐⭐⭐⭐⭐
                  </p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
