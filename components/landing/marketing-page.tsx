import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Network,
  Search,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#parcours", label: "Comment ça marche" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingLanding() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,hsl(var(--primary)/0.14),transparent)]" />
        <div className="absolute left-[max(0%,calc(50%-38rem))] top-28 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.09]" />
        <div className="absolute right-[max(0%,calc(50%-36rem))] top-[420px] h-80 w-80 rounded-full bg-[hsl(252_65%_58%/0.07)] blur-3xl dark:bg-[hsl(252_65%_58%/0.11)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
        <div className="container flex h-14 items-center justify-between gap-4 sm:h-16">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Car className="h-4 w-4" aria-hidden />
            </span>
            <span className="hidden text-[15px] sm:inline">DealerLink</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Sections">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-md shadow-foreground/10">
                Essai gratuit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative container py-16 sm:py-24 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div className="animate-in">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  <Sparkles className="mr-1 h-3 w-3" aria-hidden />
                  Réseau marchands · Stock · Dépôt-vente
                </Badge>
              </div>
              <h1 className="display-font mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Pilotez votre activité auto{" "}
                <span className="bg-gradient-to-br from-primary via-primary to-[hsl(252_72%_52%)] bg-clip-text text-transparent dark:to-[hsl(252_65%_62%)]">
                  sans disperser l&apos;info
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Centralisez stock et dépôts-ventes, ouvrez vos véhicules au réseau et trouvez la bonne affaire en
                quelques secondes — tout ce qui vivait dans Excel et WhatsApp tient dans un seul espace.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/register" className="sm:w-auto">
                  <Button size="lg" className="w-full gap-2 shadow-lg shadow-primary/25 sm:w-auto">
                    Créer mon espace <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/login" className="sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    J&apos;ai déjà un compte
                  </Button>
                </Link>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  Gratuit pour démarrer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  Données sécurisées (RLS Supabase)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  Interface pensée terrain
                </li>
              </ul>
            </div>

            <HeroDashboardPreview />
          </div>
        </section>

        <section className="border-y border-border/80 bg-muted/30 py-10 dark:bg-muted/20">
          <div className="container">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Conçu pour les pros du véhicule d&apos;occasion
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70 grayscale sm:gap-x-14">
              <span className="text-sm font-semibold tracking-tight">Marchands indépendants</span>
              <span className="text-sm font-semibold tracking-tight">Centres multi-marques</span>
              <span className="text-sm font-semibold tracking-tight">Dépôt-vente</span>
              <span className="text-sm font-semibold tracking-tight">Réseaux affiliés</span>
            </div>
          </div>
        </section>

        <section className="container py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-3">
            <StatCard value="< 10 s" label="Pour filtrer le réseau" hint="Recherche multi-critères instantanée." />
            <StatCard value="24 h" label="Vue stock à jour" hint="Statuts, prix et visibilité synchronisés." />
            <StatCard value="100 %" label="Traçabilité" hint="Historique ventes, docs et leads au même endroit." />
          </div>
        </section>

        <section id="fonctionnalites" className="scroll-mt-24 container pb-16 pt-4 sm:pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="font-medium">
              Fonctionnalités
            </Badge>
            <h2 className="display-font mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Une plateforme, trois leviers de croissance
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
              Gardez la main sur votre garage tout en profitant du réseau : partage ciblé, recherche rapide et suivi
              commercial sans fichiers éparpillés.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
            <BentoCard
              className="lg:col-span-2"
              icon={<Car className="h-5 w-5" />}
              title="Stock & dépôt-vente maîtrisés"
              description="Véhicules, statuts, marges, commissions et documents — une vision claire pour votre équipe et vos mandants."
              footer={
                <ul className="mt-4 flex flex-wrap gap-2">
                  <MiniTag>Statuts</MiniTag>
                  <MiniTag>Photos</MiniTag>
                  <MiniTag>Frais</MiniTag>
                  <MiniTag>Clients mandants</MiniTag>
                </ul>
              }
            />
            <BentoCard
              className="lg:row-span-2"
              icon={<Network className="h-5 w-5" />}
              title="Réseau marchand"
              description="Passez un véhicule en visibilité réseau en un geste. Les autres marchands voient uniquement ce que vous choisissez de montrer."
              accent
              footer={
                <div className="mt-6 rounded-xl border border-border/80 bg-muted/40 p-4 text-[13px] leading-relaxed text-muted-foreground dark:bg-muted/25">
                  <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                    <Zap className="h-4 w-4 text-primary" aria-hidden />
                    Partage intelligent
                  </div>
                  Privé par défaut — vous décidez quand passer en réseau.
                </div>
              }
            />
            <BentoCard
              icon={<Search className="h-5 w-5" />}
              title="Recherche express"
              description="Filtrez par budget, kilométrage, motorisation ou localisation pour sourcer plus vite que sur les groupes."
            />
            <BentoCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Pilotage & docs"
              description="Suivez les leads, les ventes et vos pièces administratives sans quitter l&apos;app."
              footer={
                <div className="mt-4 flex items-start gap-3 rounded-lg bg-primary/[0.06] p-3 dark:bg-primary/[0.1]">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <p className="text-[13px] leading-snug text-muted-foreground">
                    Cartes grises, mandats et exports — tout centralisé pour votre conformité.
                  </p>
                </div>
              }
            />
          </div>
        </section>

        <section id="parcours" className="scroll-mt-24 border-t border-border/60 bg-muted/25 py-16 dark:bg-muted/15 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="display-font text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Opérationnel en trois étapes
              </h2>
              <p className="mt-4 text-muted-foreground sm:text-lg">
                Pas de déploiement lourd : vous créez votre espace, importez vos véhicules et activez le réseau quand
                vous êtes prêt.
              </p>
            </div>
            <ol className="mx-auto mt-14 grid max-w-5xl gap-10 md:grid-cols-3 md:gap-6">
              <StepCard
                step={1}
                title="Créez votre compte"
                text="Accédez à votre tableau de bord et invitez votre équipe si besoin."
                icon={<Users className="h-5 w-5" />}
              />
              <StepCard
                step={2}
                title="Centralisez votre parc"
                text="Ajoutez vos véhicules, photos et documents — dépôt-vente inclus."
                icon={<Car className="h-5 w-5" />}
              />
              <StepCard
                step={3}
                title="Ouvrez le réseau"
                text="Rendez vos annonces visibles aux marchands partenaires et recherchez les leurs."
                icon={<Network className="h-5 w-5" />}
              />
            </ol>
          </div>
        </section>

        <section className="container py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_380px] lg:items-center lg:gap-14">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-5 w-5 shrink-0" aria-hidden />
                <span className="text-sm font-medium uppercase tracking-wider">Témoignage</span>
              </div>
              <blockquote className="display-font mt-6 text-balance text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                « On arrête de chercher les infos dans cinq conversations différentes. Le stock vit enfin au même
                endroit que les opportunités réseau. »
              </blockquote>
              <p className="mt-6 text-sm font-medium text-muted-foreground">
                — Responsable parc, réseau multi-sites (beta privée)
              </p>
            </div>
            <Card className="surface elevate-hover overflow-hidden border-primary/15 shadow-xl shadow-primary/[0.06]">
              <CardContent className="space-y-4 p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <Shield className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">Sécurité & confidentialité</p>
                    <p className="text-sm text-muted-foreground">Auth moderne et isolation des données par compte.</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    Politiques Row Level Security sur les données sensibles.
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    Visibilité réseau strictly opt-in véhicule par véhicule.
                  </li>
                  <li className="flex gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Sauvegardes et disponibilité gérées par notre hébergeur cloud.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-t border-border/60 bg-muted/20 py-16 dark:bg-muted/10 sm:py-20">
          <div className="container max-w-3xl">
            <h2 className="display-font text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Questions fréquentes
            </h2>
            <div className="mt-10 space-y-3">
              <FaqItem
                question="DealerLink remplace-t-il mon DMS ?"
                answer="DealerLink se concentre sur le stock visible, le dépôt-vente, le partage réseau et la recherche marchand. Il complète votre outil métier plutôt qu'il ne remplace un DMS historique complet."
              />
              <FaqItem
                question="Qui voit mes véhicules sur le réseau ?"
                answer="Seuls les véhicules que vous passez explicitement en visibilité réseau et disponibles sont visibles par les autres marchands connectés. Le reste reste privé à votre compte."
              />
              <FaqItem
                question="Puis-je essayer sans carte bancaire ?"
                answer="Oui — créez un compte pour explorer l'interface. Les fonctionnalités sensibles (stockage images, réseau) suivent les limites du projet Supabase associé à votre espace."
              />
            </div>
          </div>
        </section>

        <section className="container pb-20 pt-4 sm:pb-28">
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-background to-[hsl(252_40%_96%/0.5)] px-8 py-14 shadow-inner shadow-primary/[0.04] dark:from-primary/[0.12] dark:via-background dark:to-[hsl(252_25%_12%/0.6)] sm:px-14 sm:py-16">
            <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="display-font text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Prêt à synchroniser votre activité ?
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">
                Rejoignez les marchands qui centralisent leur stock et accélèrent les ventes réseau avec DealerLink.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full gap-2 shadow-lg shadow-primary/30 sm:w-auto">
                    Commencer maintenant <ArrowRight className="h-4 w-4" aria-hidden />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="w-full border border-border/80 bg-background/80 sm:w-auto">
                    Connexion
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 bg-muted/30 py-12 dark:bg-muted/15">
        <div className="container grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Car className="h-4 w-4" aria-hidden />
              </span>
              DealerLink
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              La boîte à outils des marchands auto pour stock, dépôt-vente et sourcing réseau — sans chaos documentaire.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produit</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#fonctionnalites" className="text-muted-foreground hover:text-foreground">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <Link href="/register" className="text-muted-foreground hover:text-foreground">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-foreground">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Légal</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>MVP — conditions générales à venir</li>
              <li>© {new Date().getFullYear()} DealerLink</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroDashboardPreview() {
  return (
    <div className="relative animate-in lg:justify-self-end" style={{ animationDelay: "80ms" }}>
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-tr from-primary/12 via-transparent to-[hsl(252_65%_58%/0.08)] blur-sm dark:from-primary/18" />
      <Card className="relative overflow-hidden border-border/70 shadow-2xl shadow-foreground/[0.07]">
        <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3 dark:bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[13px] font-medium">Parc — vue jour</span>
          </div>
          <Badge variant="secondary" className="font-normal">
            12 véhicules
          </Badge>
        </div>
        <CardContent className="space-y-0 p-0">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-border/50 bg-muted/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground dark:bg-muted/15">
            <span>Véhicule</span>
            <span className="hidden sm:inline">Statut</span>
            <span className="text-right">Visibilité</span>
          </div>
          {[
            { name: "Peugeot 308 SW — BlueHDi 130", status: "Dispo", vis: "Réseau", tone: "success" as const },
            { name: "Renault Austral — techno esprit", status: "Réservé", vis: "Privé", tone: "warning" as const },
            { name: "BMW Série 3 — mandant M. Dupont", status: "Dispo", vis: "Privé", tone: "success" as const },
          ].map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border/40 px-4 py-3 text-[13px] last:border-0"
            >
              <span className="truncate font-medium">{row.name}</span>
              <Badge variant={row.tone === "success" ? "success" : "warning"} className="hidden font-normal sm:inline-flex">
                {row.status}
              </Badge>
              <span className="text-right text-muted-foreground">{row.vis}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border/60 bg-primary/[0.04] px-4 py-3 dark:bg-primary/[0.07]">
            <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <Search className="h-4 w-4 text-primary" aria-hidden />
              Recherche réseau
            </span>
            <span className="text-[13px] text-muted-foreground">42 résultats · filtres actifs</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ value, label, hint }: { value: string; label: string; hint: string }) {
  return (
    <Card className="surface elevate-hover text-center">
      <CardContent className="p-8">
        <p className="tabular display-font text-4xl font-bold tracking-tight text-primary sm:text-5xl">{value}</p>
        <p className="mt-2 font-semibold">{label}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function BentoCard({
  icon,
  title,
  description,
  footer,
  accent,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  footer?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "elevate-hover flex flex-col overflow-hidden border-border/70",
        accent && "border-primary/25 bg-gradient-to-b from-primary/[0.05] to-card dark:from-primary/[0.08]",
        className,
      )}
    >
      <CardContent className="flex flex-1 flex-col p-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">{icon}</span>
        <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {footer}
      </CardContent>
    </Card>
  );
}

function MiniTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-border/70 bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

function StepCard({
  step,
  title,
  text,
  icon,
}: {
  step: number;
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="tabular text-[11px] font-bold uppercase tracking-wider text-primary">Étape {step}</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        </div>
      </div>
    </li>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group surface elevate-hover rounded-2xl border border-border/60 bg-card px-5 py-1 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium leading-snug">
        {question}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-transform duration-200 group-open:rotate-180">
          <ChevronIcon />
        </span>
      </summary>
      <p className="border-t border-border/60 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </details>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
