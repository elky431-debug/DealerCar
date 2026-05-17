"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ListChecks,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InspectionStep } from "@/lib/inspection-steps";
import type { InspectionStepState } from "@/lib/types";

interface Props {
  title: string;
  steps: InspectionStep[];
  currentIdx: number;
  stepsState: Record<string, InspectionStepState>;
  onNavigate: (idx: number) => void;
  savingState: "idle" | "saving" | "saved";
  completedCount: number;
  onEditSteps: () => void;
}

export function WizardTopBar({
  title,
  steps,
  currentIdx,
  stepsState,
  onNavigate,
  savingState,
  completedCount,
  onEditSteps,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stepsCount = steps.length;

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
        <Link
          href="/sourcing/inspections"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Consultation pré-achat
          </p>
          <p className="-mt-0.5 truncate text-[14px] font-semibold tracking-tight text-foreground">
            {title}
          </p>
        </div>

        <div aria-hidden className="mx-auto hidden items-center gap-1 lg:flex">
          {steps.map((s, i) => {
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

        <button
          type="button"
          onClick={onEditSteps}
          className="hidden items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground sm:inline-flex"
        >
          <ListChecks className="h-3.5 w-3.5" />
          Étapes
        </button>

        <SaveIndicator state={savingState} />

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
              {stepsCount > 0 ? currentIdx + 1 : 0}
              <span className="text-muted-foreground/70">/{stepsCount}</span>
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen && stepsCount > 0 && (
            <StepPicker
              steps={steps}
              currentIdx={currentIdx}
              stepsState={stepsState}
              onSelect={(i) => {
                setMenuOpen(false);
                onNavigate(i);
              }}
              onClose={() => setMenuOpen(false)}
              completedCount={completedCount}
              onEditSteps={() => {
                setMenuOpen(false);
                onEditSteps();
              }}
            />
          )}
        </div>
      </div>

      <div aria-hidden className="h-0.5 w-full bg-muted lg:hidden">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{
            width: stepsCount
              ? `${((currentIdx + 1) / stepsCount) * 100}%`
              : "0%",
          }}
        />
      </div>
    </header>
  );
}

function StepPicker({
  steps,
  currentIdx,
  stepsState,
  onSelect,
  onClose,
  completedCount,
  onEditSteps,
}: {
  steps: InspectionStep[];
  currentIdx: number;
  stepsState: Record<string, InspectionStepState>;
  onSelect: (idx: number) => void;
  onClose: () => void;
  completedCount: number;
  onEditSteps: () => void;
}) {
  const stepsCount = steps.length;

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
            {completedCount}/{stepsCount} validées
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

      <ol className="max-h-[50vh] overflow-y-auto p-1.5">
        {steps.map((s, i) => {
          const done = Boolean(stepsState[s.id]?.done);
          const isCurrent = i === currentIdx;
          const isCustom = s.id.startsWith("custom_");
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
                        ? "bg-gray-900 text-white ring-gray-900/20"
                        : "bg-background text-muted-foreground ring-border",
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    s.number
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
                    {s.title}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {s.subtitle}
                    {isCustom && (
                      <span className="text-[#b07824]"> · Perso.</span>
                    )}
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

      <div className="border-t border-border/60 p-2">
        <button
          type="button"
          onClick={onEditSteps}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-foreground/[0.05]"
        >
          <ListChecks className="h-4 w-4" />
          Personnaliser les étapes
        </button>
      </div>
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
