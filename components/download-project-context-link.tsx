import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

const HREF = "/api/docs/contexte-projet";

/** Lien / bouton pour télécharger le dossier contexte projet (Markdown). */
export function DownloadProjectContextLink({
  variant = "button",
  className,
}: {
  variant?: "button" | "text";
  className?: string;
}) {
  if (variant === "text") {
    return (
      <a
        href={HREF}
        download
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline",
          className,
        )}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        Télécharger la doc projet
      </a>
    );
  }

  return (
    <a
      href={HREF}
      download
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60",
        className,
      )}
    >
      <Download className="h-4 w-4 shrink-0" />
      Télécharger la doc projet
    </a>
  );
}
