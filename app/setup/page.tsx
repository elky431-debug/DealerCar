import Link from "next/link";
import { Car, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function SetupPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <header className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Car className="h-4 w-4" />
          </span>
          DealerLink
        </Link>
      </header>

      <main className="container flex max-w-2xl flex-col gap-6 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Supabase requise</CardTitle>
            <CardDescription>
              {configured
                ? "Les variables d'environnement sont détectées. Redémarrez le serveur de dev si vous venez de les ajouter."
                : "L'application a besoin de l'URL et de la clé anon de votre projet Supabase pour démarrer."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                Créez un projet sur{" "}
                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  app.supabase.com
                </a>
                .
              </li>
              <li>
                Copiez{" "}
                <a
                  href="https://supabase.com/dashboard/project/_/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  l&apos;URL et la clé <code className="text-xs">anon</code>
                  <ExternalLink className="h-3 w-3" />
                </a>
                .
              </li>
              <li>
                À la racine du projet, créez <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code>{" "}
                à partir de l&apos;exemple :
                <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs">
                  cp .env.example .env.local
                </pre>
              </li>
              <li>
                Renseignez au minimum :
                <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...`}
                </pre>
              </li>
              <li>
                Dans Supabase → SQL Editor, exécutez{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">supabase/schema.sql</code>, puis relancez{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">npm run dev</code>.
              </li>
            </ol>

            {configured ? (
              <Link href="/">
                <Button className="w-full sm:w-auto">Continuer vers l&apos;accueil</Button>
              </Link>
            ) : (
              <p className="text-muted-foreground">
                Une fois <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code> rempli, redémarrez le
                serveur — cette page disparaîtra automatiquement.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
