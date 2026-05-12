import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Car, Network, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadProjectContextLink } from "@/components/download-project-context-link";
import { getServerAuth } from "@/lib/supabase/server";

export default async function HomePage() {
  const { user } = await getServerAuth();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-4 w-4" />
          </span>
          DealerLink
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Connexion
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Créer un compte</Button>
          </Link>
        </nav>
      </header>

      <main className="container py-12 sm:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Réseau marchands · Stock · Dépôt-vente
          </span>
          <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Le réseau qui remplace Excel et WhatsApp pour les marchands auto.
          </h1>
          <p className="mt-5 text-balance text-lg text-muted-foreground">
            Centralisez votre stock, gérez vos dépôts-ventes et trouvez des véhicules
            chez d'autres marchands en quelques secondes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Démarrer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                J'ai déjà un compte
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Car className="h-5 w-5" />}
            title="Gestion interne"
            text="Centralisez tout votre stock et vos dépôts-ventes. Statuts, photos, commissions — tout est suivi."
          />
          <FeatureCard
            icon={<Network className="h-5 w-5" />}
            title="Réseau marchand"
            text="Rendez vos véhicules visibles aux autres marchands en 1 clic. Vendez plus vite."
          />
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Recherche express"
            text="Trouvez le véhicule parfait dans le réseau en moins de 10 secondes."
          />
        </section>
      </main>

      <footer className="container flex flex-col items-center gap-4 py-10 text-center">
        <DownloadProjectContextLink />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} DealerLink — MVP
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
