import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SupabaseSetupNotice() {
  return (
    <Card className="border-warning/35 bg-warning/[0.07] dark:bg-warning/[0.06]">
      <CardHeader className="space-y-1">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg">Configuration Supabase requise</CardTitle>
            <CardDescription className="text-muted-foreground">
              Les clés d&apos;API publiques ne sont pas définies : la connexion et l&apos;inscription sont
              indisponibles tant que le fichier local n&apos;est pas renseigné.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            À la racine du projet, copiez le modèle&nbsp;:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-foreground">cp .env.example .env.local</code>
          </li>
          <li>
            Sur{" "}
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              className="font-medium text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase → Project Settings → API
            </a>
            , copiez l&apos;URL du projet et la clé <strong className="font-medium text-foreground">anon</strong> dans{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-foreground">.env.local</code>
            .
          </li>
          <li>
            Redémarrez le serveur de développement (<code className="text-foreground">Ctrl+C</code> puis{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] text-foreground">npm run dev</code>).
          </li>
        </ol>
        <p className="border-t border-border/60 pt-4">
          <Link href="/" className="font-medium text-primary hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
