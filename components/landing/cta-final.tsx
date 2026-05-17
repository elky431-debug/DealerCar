import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="border-t border-gray-200/80 bg-white/80 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl md:leading-tight">
          Rejoignez le réseau des{" "}
          <span className="text-landing-brand">marchands pros</span>
        </h2>
        <p className="mt-6 text-lg text-landing-muted md:text-xl">
          38 marchands utilisent déjà DealerLink. Plus le réseau grandit, plus il a de valeur.
        </p>
        <Link href="/register" className="landing-cta-primary mt-10 px-8 py-4 text-base">
          Créer mon compte gratuitement
        </Link>
        <p className="mt-6 text-sm text-gray-500">14 jours d&apos;essai · Aucune carte requise · Résiliation libre</p>
      </div>
    </section>
  );
}
