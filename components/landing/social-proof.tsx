const NAMES = [
  "Garage Martin",
  "Auto Concept Lyon",
  "Sud Trucks",
  "ProVente Auto",
  "EliteCar Paris",
];

export function SocialProof() {
  return (
    <section className="border-y border-gray-100 bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[13px] font-medium uppercase tracking-wide text-gray-500">
          Ils font confiance à DealerLink
        </p>
        <div className="relative mx-auto mt-6 max-w-5xl overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-gray-50 to-transparent" />
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm font-medium text-gray-400 sm:gap-x-6 sm:text-base">
            {NAMES.map((n, i) => (
              <span key={n} className="whitespace-nowrap">
                {n}
                {i < NAMES.length - 1 ? <span className="hidden sm:inline"> · </span> : null}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
