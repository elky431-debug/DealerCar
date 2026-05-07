import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        La page que vous cherchez n'existe pas ou n'est plus disponible.
      </p>
      <Link href="/dashboard">
        <Button>Retour au dashboard</Button>
      </Link>
    </div>
  );
}
