import type { Metadata } from "next";
import { CtaFinal } from "@/components/landing/cta-final";
import { FeaturesGarage } from "@/components/landing/features-garage";
import { FeaturesReseau } from "@/components/landing/features-reseau";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { LandingShell } from "@/components/landing/landing-shell";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { SocialProof } from "@/components/landing/social-proof";
import { Testimonials } from "@/components/landing/testimonials";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerAuth } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "DealerLink — La plateforme des marchands automobiles professionnels",
  description:
    "Gérez votre stock, vos dépôts-vente et vos documents. Trouvez des véhicules entre professionnels avant leur publication publique.",
  keywords: [
    "marchands automobiles",
    "réseau B2B",
    "gestion stock auto",
    "dépôt-vente",
    "négoce automobile",
  ],
  openGraph: {
    title: "DealerLink — Marchands automobiles professionnels",
    description: "Le réseau privé des marchands automobiles professionnels.",
    type: "website",
  },
};

export default async function HomePage() {
  let authenticated = false;
  if (isSupabaseConfigured()) {
    const { user } = await getServerAuth();
    authenticated = !!user;
  }

  return (
    <LandingShell>
      <Navbar authenticated={authenticated} />
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <FeaturesGarage />
      <FeaturesReseau />
      <Testimonials />
      <Pricing />
      <CtaFinal />
      <Footer />
    </LandingShell>
  );
}
