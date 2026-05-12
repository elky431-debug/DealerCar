import type { Metadata } from "next";
import { CtaFinal } from "@/components/landing/cta-final";
import { FeaturesGarage } from "@/components/landing/features-garage";
import { FeaturesReseau } from "@/components/landing/features-reseau";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { ProblemSolution } from "@/components/landing/problem-solution";
import { SocialProof } from "@/components/landing/social-proof";
import { Testimonials } from "@/components/landing/testimonials";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerAuth } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "DealerLink — La plateforme B2B des marchands automobiles",
  description:
    "Gérez votre stock, vos dépôts-vente et vos documents. Rejoignez le réseau privé de 38 marchands professionnels pour trouver des véhicules avant leur publication publique.",
  keywords: [
    "marchands automobiles",
    "réseau B2B",
    "gestion stock auto",
    "dépôt-vente",
    "négoce automobile",
  ],
  openGraph: {
    title: "DealerLink — La plateforme B2B des marchands automobiles",
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
    <main className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
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
    </main>
  );
}
