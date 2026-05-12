"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronRight,
  Plus,
  Search,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { CS_CARD, CS_EYEBROW } from "@/lib/client-search-ui";
import {
  CLIENT_SEARCH_PRIORITY_LABELS,
  CLIENT_SEARCH_STATUS_LABELS,
  type ClientSearch,
} from "@/lib/types";
import { cn, formatPrice, formatMileage } from "@/lib/utils";

type SortKey = "recent" | "client" | "progress";

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function ClientsSearchesList() {
  const [items, setItems] = useState<ClientSearch[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/client-searches");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur");
        if (!cancelled) setItems(data.searches as ClientSearch[]);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    let list = q
      ? items.filter(
          (s) =>
            s.client_name.toLowerCase().includes(q) ||
            s.brand.toLowerCase().includes(q) ||
            s.model.toLowerCase().includes(q) ||
            (s.geo_zone?.toLowerCase().includes(q) ?? false),
        )
      : [...items];

    list.sort((a, b) => {
      if (sort === "recent")
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sort === "client") return a.client_name.localeCompare(b.client_name, "fr");
      return b.sourcing_progress - a.sourcing_progress;
    });
    return list;
  }, [items, query, sort]);

  const activeCount = useMemo(
    () => (items ?? []).filter((s) => s.status === "active").length,
    [items],
  );

  if (err) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
        {err}
      </p>
    );
  }

  if (items === null) {
    return <ListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          CS_CARD,
          "flex flex-col items-center justify-center border-dashed bg-muted/20 px-8 py-20 text-center",
        )}
      >
        <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
          <UserRoundSearch className="h-8 w-8" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Aucune recherche pour l’instant</h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Créez une fiche pour chaque demande client : critères, shortlist, sources et messages IA dans un
          mini-CRM sourcing.
        </p>
        <Button size="lg" className="mt-8 h-12 rounded-xl px-8" href="/recherche/clients/new">
          <Plus className="mr-2 h-5 w-5" />
          Nouvelle recherche
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          CS_CARD,
          "flex flex-col gap-4 p-5 shadow-none sm:flex-row sm:items-center sm:justify-between sm:p-6",
        )}
      >
        <div className="min-w-0 space-y-1">
          <p className={CS_EYEBROW}>Pipeline</p>
          <p className="text-[15px] text-foreground">
            <span className="font-semibold tabular-nums">{items.length}</span> fiche{items.length > 1 ? "s" : ""}{" "}
            ·{" "}
            <span className="font-semibold tabular-nums text-primary">{activeCount}</span> active
            {activeCount > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client, une marque, un modèle…"
              className="h-11 rounded-xl border-border/60 bg-background/90 pl-10"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ArrowUpDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 w-full min-w-[10.5rem] rounded-xl sm:w-auto"
            >
              <option value="recent">Plus récentes</option>
              <option value="client">Client (A–Z)</option>
              <option value="progress">Progression sourcing</option>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun résultat pour « {query} ».
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((s) => (
            <li key={s.id}>
              <SearchRowCard search={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchRowCard({ search: s }: { search: ClientSearch }) {
  const budgetA = s.budget_min != null ? formatPrice(Number(s.budget_min)) : null;
  const budgetB = s.budget_max != null ? formatPrice(Number(s.budget_max)) : null;
  const budgetLabel =
    budgetA && budgetB ? `${budgetA} – ${budgetB}` : budgetA ?? budgetB ?? null;

  return (
    <Link href={`/recherche/clients/${s.id}`} className="group block">
      <div
        className={cn(
          CS_CARD,
          "flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6",
          "hover:border-primary/35 hover:shadow-[0_12px_40px_-20px_hsl(var(--primary)/0.35)]",
        )}
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 to-primary text-[15px] font-bold text-primary-foreground shadow-md ring-1 ring-primary/20">
          {initials(s.client_name)}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2 gap-y-1">
            <h2 className="text-[17px] font-semibold tracking-tight text-foreground group-hover:text-primary">
              {s.client_name}
            </h2>
            <StatusDot status={s.status} />
            {s.is_rare && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                Rare
              </span>
            )}
          </div>
          <p className="text-[15px] capitalize leading-snug text-muted-foreground">
            {s.brand} {s.model}
            {s.version ? ` · ${s.version}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="rounded-lg bg-muted/80 px-2.5 py-1 font-medium text-foreground ring-1 ring-border/50">
              {CLIENT_SEARCH_PRIORITY_LABELS[s.priority]}
            </span>
            {budgetLabel && (
              <span className="rounded-lg bg-background/90 px-2.5 py-1 font-semibold tabular-nums ring-1 ring-border/50">
                {budgetLabel}
              </span>
            )}
            {s.mileage_max != null && (
              <span className="text-muted-foreground">≤ {formatMileage(s.mileage_max)}</span>
            )}
            {s.difficulty_score != null && (
              <span className="text-muted-foreground">Diff. {s.difficulty_score}/10</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:w-44 sm:items-end">
          <div className="w-full space-y-1.5 sm:w-full">
            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>Sourcing</span>
              <span className="tabular-nums text-foreground">{s.sourcing_progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${s.sourcing_progress}%` }}
              />
            </div>
          </div>
          <div className="flex w-full items-center justify-between gap-3 sm:flex-col sm:items-end">
            <p className="text-[13px] text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{s.cached_match_count}</span> match
              {s.cached_match_count > 1 ? "es" : ""}
            </p>
            {s.eta_days_min != null && s.eta_days_max != null && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                {s.eta_days_min}–{s.eta_days_max} j
              </p>
            )}
          </div>
        </div>

        <ChevronRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
      </div>
    </Link>
  );
}

function StatusDot({ status }: { status: ClientSearch["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        status === "active" && "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
        status === "vehicle_found" && "bg-sky-500/15 text-sky-800 dark:text-sky-200",
        status === "negotiating" && "bg-violet-500/15 text-violet-800 dark:text-violet-200",
        status === "completed" && "bg-muted text-muted-foreground",
        status === "abandoned" && "bg-destructive/12 text-destructive",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {CLIENT_SEARCH_STATUS_LABELS[status]}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse rounded-2xl bg-muted/60" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
      ))}
    </div>
  );
}
