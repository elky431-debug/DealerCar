import Link from "next/link";

export function CtaFinal() {
  return (
    <section className="bg-gray-900 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold leading-tight text-white md:text-5xl md:leading-tight">
          Rejoignez le réseau des marchands pros
        </h2>
        <p className="mt-6 text-lg text-gray-300 md:text-xl">
          38 marchands utilisent déjà DealerLink. Plus le réseau grandit, plus il a de valeur.
        </p>
        <Link
          href="/register"
          className="mt-10 inline-block rounded-[10px] bg-white px-8 py-4 text-base font-semibold text-gray-900 transition-colors duration-150 hover:bg-gray-100"
        >
          Créer mon compte gratuitement
        </Link>
        <p className="mt-6 text-sm text-gray-400">14 jours d&apos;essai · Aucune carte requise · Résiliation libre</p>
      </div>
    </section>
  );
}
