import { BrandText } from "@/components/landing/brand-text";

const NAMES = [
  "Garage Martin",
  "Auto Concept Lyon",
  "Sud Trucks",
  "ProVente Auto",
  "EliteCar Paris",
];

export function SocialProof() {
  return (
    <section className="landing-section-alt py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[13px] font-medium uppercase tracking-wide text-gray-500">
          Ils font confiance à <BrandText className="normal-case">DealerLink</BrandText>
        </p>
        <p className="mx-auto mt-6 flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-sm font-medium text-gray-400 sm:gap-x-6 sm:text-base">
          {NAMES.map((n, i) => (
            <span key={n} className="whitespace-nowrap">
              {n}
              {i < NAMES.length - 1 ? <span className="hidden sm:inline"> · </span> : null}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
