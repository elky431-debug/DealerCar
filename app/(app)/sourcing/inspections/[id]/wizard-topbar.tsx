"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INSPECTION_STEPS,
  INSPECTION_STEPS_COUNT,
} from "@/lib/inspection-steps";
import type { InspectionStepState } from "@/lib/types";

interface Props {
  title: string;
  currentIdx: number;
  stepsState: Record<string, InspectionStepState>;
  onNavigate: (idx: number) => void;
  savingState: "idle" | "saving" | "saved";
  completedCount: number;
}

/**
 * Barre supérieure minimaliste du wizard "focus mode".
 *
 *  ← Retour | Titre inspection | • • • • • • • • • • | Étape 4/10 [v]
 *
 * Le picker (chevron) ouvre un menu compact avec toutes les étapes,
 * cliquables pour sauter directement. C'est le SEUL endroit où l'on
 * voit toutes les étapes, conformément à la demande UX.
 */
export function WizardTopBar({
  title,
  currentIdx,
  stepsState,
  onNavigate,
  savingState,
  completedCount,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b page-header-bar">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        {/* Retour */}
        <Link
          href="/sourcing/inspections"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {/* Titre inspection */}
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Consultation pré-achat
          </p>
          <p className="-mt-0.5 truncate text-[14px] font-semibold tracking-tight text-foreground">
            {title}
          </p>
        </div>

        {/* Dots de progression (desktop) */}
        <div
          aria-hidden
          className="mx-auto hidden items-center gap-1 lg:flex"
        >
          {INSPECTION_STEPS.map((s, i) => {
            const done = Boolean(stepsState[s.id]?.done);
            const isCurrent = i === currentIdx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onNavigate(i)}
                aria-label={`Aller à l'étape ${s.number} : ${s.title}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  isCurrent
                    ? "w-6 bg-foreground"
                    : done
                    ? "w-1.5 bg-success"
                    : "w-1.5 bg-foreground/20 hover:bg-foreground/40",
                )}
              />
            );
          })}
        </div>

        <SaveIndicator state={savingState} />

        {/* Picker step */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-[12.5px] font-medium tabular-nums text-foreground transition-colors hover:bg-foreground/[0.05]",
              menuOpen && "bg-foreground/[0.05]",
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="text-muted-foreground">Étape</span>
            <span>
              {currentIdx + 1}
              <span className="text-muted-foreground/70">
                /{INSPECTION_STEPS_COUNT}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen && (
            <StepPicker
              currentIdx={currentIdx}
              stepsState={stepsState}
              onSelect={(i) => {
                setMenuOpen(false);
                onNavigate(i);
              }}
              onClose={() => setMenuOpen(false)}
              completedCount={completedCount}
            />
          )}
        </div>
      </div>

      {/* Mini progress bar mobile (en plus des dots desktop) */}
      <div
        aria-hidden
        className="h-0.5 w-full bg-muted lg:hidden"
      >
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{
            width: `${((currentIdx + 1) / INSPECTION_STEPS_COUNT) * 100}%`,
          }}
        />
      </div>
    </header>
  );
}

/* ─────────────────── Step picker dropdown ─────────────────── */

function StepPicker({
  currentIdx,
  stepsState,
  onSelect,
  onClose,
  completedCount,
}: {
  currentIdx: number;
  stepsState: Record<string, InspectionStepState>;
  onSelect: (idx: number) => void;
  onClose: () => void;
  completedCount: number;
}) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-[calc(100%+8px)] z-40 w-[300px] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl ring-1 ring-foreground/5 animate-in"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Toutes les étapes
          </p>
          <p className="text-[13px] font-semibold tracking-tight">
            {completedCount}/{INSPECTION_STEPS_COUNT} validées
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ol className="max-h-[60vh] overflow-y-auto p-1.5">
        {INSPECTION_STEPS.map((s, i) => {
          const done = Boolean(stepsState[s.id]?.done);
          const isCurrent = i === currentIdx;
          return (
            <li key={s.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => onSelect(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  isCurrent
                    ? "bg-foreground/[0.07] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ring-1 ring-inset",
                    done
                      ? "bg-success text-success-foreground ring-success"
                      : isCurrent
                      ? "bg-primary text-white ring-primary"
                      : "bg-background text-muted-foreground ring-border",
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.number.replace(" bis", "ᵇ")
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
                    {s.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {s.subtitle}
                  </span>
                </span>
                {s.optional && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    Opt.
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" }) {
  if (state === "idle") return null;
  return (
    <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:inline-flex">
      {state === "saving" ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" /> Sauvegarde…
        </>
      ) : (
        <>
          <Check className="h-3 w-3 text-success" /> Enregistré
        </>
      )}
    </span>
  );
}
