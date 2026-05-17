import { BrandText } from "@/components/landing/brand-text";

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
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-gray-900 md:text-[32px]">
          Ce que disent nos <BrandText>marchands</BrandText>
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <blockquote key={q.initials} className="landing-card-surface flex flex-col p-6 md:p-6">
              <p className="text-sm leading-relaxed text-gray-700">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-landing-brand/15 text-sm font-bold text-landing-brand">
                  {q.initials}
                </span>
                <div>
                  <cite className="not-italic text-sm font-medium text-gray-900">— {q.author}</cite>
                  <p className="mt-1 text-amber-500" aria-label="5 sur 5">
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
