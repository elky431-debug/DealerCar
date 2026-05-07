"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InspectionStep } from "@/lib/inspection-steps";

interface Props {
  step: InspectionStep;
  done: boolean;
}

/**
 * Hero plein largeur d'une étape du wizard d'inspection.
 *
 * Composition :
 *  - Illustration de fond (image PDF) avec ratio 21:9 desktop / 4:3 mobile
 *  - Dégradé sombre dans le bas pour la lisibilité du texte en surimpression
 *  - Numéro d'étape géant + titre + sous-titre
 *  - Badge "Validée" en haut à droite si l'étape est complétée
 *
 * Si pas d'image : fallback typographique élégant sur fond gradient.
 */
export function StepHero({ step, done }: Props) {
  const hasImage = Boolean(step.image);

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-border/60 bg-foreground shadow-[0_8px_32px_-12px_hsl(var(--foreground)/0.25)]">
      {/* Image de fond */}
      {hasImage ? (
        <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
          <Image
            src={step.image!}
            alt={step.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover object-center"
          />
          {/* Vignette : sombre en bas pour le texte */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10"
          />
          {/* Léger glow chaud à droite (deco) */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background:
                "radial-gradient(60% 60% at 100% 0%, rgba(255,180,80,0.4), transparent 60%)",
            }}
          />
        </div>
      ) : (
        <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-foreground via-foreground to-foreground/80 sm:aspect-[21/9]">
          {/* Pattern décoratif */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>
      )}

      {/* Badge done */}
      {done && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-success/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-success-foreground shadow-lg backdrop-blur ring-1 ring-success-foreground/20">
          <Check className="h-3 w-3" /> Validée
        </span>
      )}

      {/* Contenu : numéro géant + titre */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <div className="flex items-end gap-4 sm:gap-6">
          <span
            aria-hidden
            className={cn(
              "display-font select-none text-[64px] font-bold leading-[0.85] tracking-tight text-white/95 sm:text-[88px]",
              "drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]",
            )}
          >
            {step.number}
          </span>
          <div className="min-w-0 flex-1 pb-1.5 sm:pb-2.5">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-white/65">
              Étape {step.number}
            </p>
            <h2 className="display-font mt-1 text-[22px] font-semibold leading-tight tracking-tight text-white sm:text-[28px]">
              {step.title}
            </h2>
            <p className="mt-1 text-[13px] text-white/75 sm:text-[14px]">
              {step.subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
