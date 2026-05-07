"use client";

import { ExternalLink, ShoppingCart, Search } from "lucide-react";
import type { InspectionStep } from "@/lib/inspection-steps";
import type { InspectionStepState } from "@/lib/types";

interface Props {
  step: InspectionStep;
  state: InspectionStepState;
}

/**
 * Étape pneus : helper rapide pour estimer le prix d'un train de pneus
 * via Allopneu, à partir de la référence saisie dans le bloc Form.
 */
export function StepAiTires({ state }: Props) {
  const ref = (state.data?.tire_ref as string) ?? "";

  const allopneuUrl = ref
    ? `https://www.allopneus.com/recherche?q=${encodeURIComponent(ref)}`
    : "https://www.allopneus.com";

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
        <ShoppingCart className="h-4 w-4 text-foreground" />
        Estimer le coût d&apos;un train de pneus
      </h3>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {ref ? (
          <>
            Recherche sur Allopneu pour la référence{" "}
            <span className="font-semibold text-foreground">{ref}</span>.
          </>
        ) : (
          <>Saisissez la référence sur le flanc du pneu (ci-dessus) pour activer la recherche.</>
        )}
      </p>

      <a
        href={allopneuUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors hover:bg-foreground/[0.05]"
      >
        {ref ? (
          <>
            <Search className="h-3.5 w-3.5" />
            Voir les prix sur Allopneu
          </>
        ) : (
          <>
            <ExternalLink className="h-3.5 w-3.5" />
            Ouvrir Allopneu
          </>
        )}
      </a>
    </section>
  );
}
