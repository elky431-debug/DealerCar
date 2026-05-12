"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  Compass,
  Copy,
  Flame,
  Gauge,
  GitBranch,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircle,
  Percent,
  Phone,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { SourcingHint } from "@/lib/client-search-matching";
import {
  CLIENT_SEARCH_PRIORITY_LABELS,
  CLIENT_SEARCH_STATUS_LABELS,
  CLIENT_SEARCH_VEHICLE_SLOT_LABELS,
  SOURCE_FOLLOW_UP_LABELS,
  type ClientSearch,
  type ClientSearchEvent,
  type ClientSearchSourceAssignment,
  type ClientSearchVehicleRow,
  type ClientSearchVehicleSlot,
  type Profile,
  type SourcingContact,
  type VehicleWithRelations,
} from "@/lib/types";
import { CS_CARD as CARD, CS_SHELL } from "@/lib/client-search-ui";
import { cn, formatMileage, formatPrice, publicImageUrl } from "@/lib/utils";

const GAP_SECTION = "gap-5";
const PAD_INNER = "p-6";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function waHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "#";
  return `https://wa.me/${digits}`;
}

type MatchVehicle = VehicleWithRelations & {
  compatibility_score: number;
  band: "strong" | "close" | "stretch";
  is_new_listing: boolean;
};

interface MatchesPayload {
  strong: MatchVehicle[];
  close: MatchVehicle[];
  stretch: MatchVehicle[];
  hints: SourcingHint[];
  total_scanned: number;
}

interface DetailPayload {
  search: ClientSearch;
  assignments: (ClientSearchSourceAssignment & { sourcing_contacts: SourcingContact | null })[];
  shortlist: ClientSearchVehicleRow[];
  events: ClientSearchEvent[];
}

type WorkspaceTab = "list" | "market" | "pro";

export function ClientSearchDetail({ id }: { id: string }) {
  const toast = useToast();
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [matches, setMatches] = useState<MatchesPayload | null>(null);
  const [contacts, setContacts] = useState<SourcingContact[] | null>(null);
  const [allSearches, setAllSearches] = useState<ClientSearch[] | null>(null);
  const [loadDetail, setLoadDetail] = useState(true);
  const [loadMatches, setLoadMatches] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("market");
  const [listQuery, setListQuery] = useState("");

  const refreshDetail = useCallback(async () => {
    const res = await fetch(`/api/client-searches/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erreur");
    setDetail(data as DetailPayload);
  }, [id]);

  const refreshMatches = useCallback(async () => {
    const res = await fetch(`/api/client-searches/${id}/matches`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Erreur");
    setMatches(data as MatchesPayload);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dRes, cRes, sRes] = await Promise.all([
          fetch(`/api/client-searches/${id}`),
          fetch("/api/sourcing-contacts"),
          fetch("/api/client-searches"),
        ]);
        const dJson = await dRes.json();
        const cJson = await cRes.json();
        const sJson = await sRes.json();
        if (!dRes.ok) throw new Error(dJson.error ?? "Erreur");
        if (!cRes.ok) throw new Error(cJson.error ?? "Erreur");
        if (!sRes.ok) throw new Error(sJson.error ?? "Erreur");
        if (cancelled) return;
        setDetail(dJson as DetailPayload);
        setContacts(cJson.contacts as SourcingContact[]);
        setAllSearches(sJson.searches as ClientSearch[]);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoadDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshMatches();
      } catch (e) {
        if (!cancelled) toast.error("Matching", e instanceof Error ? e.message : "");
      } finally {
        if (!cancelled) setLoadMatches(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMatches, toast]);

  const shortlistByVehicle = useMemo(() => {
    const m = new Map<string, ClientSearchVehicleRow>();
    detail?.shortlist.forEach((r) => m.set(r.vehicle_id, r));
    return m;
  }, [detail?.shortlist]);

  const listSearches = useMemo(() => {
    const arr = [...(allSearches ?? [])];
    arr.sort((a, b) => {
      if (a.id === id) return -1;
      if (b.id === id) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    const q = listQuery.trim().toLowerCase();
    if (!q) return arr;
    return arr.filter(
      (s) =>
        s.client_name.toLowerCase().includes(q) ||
        `${s.brand} ${s.model}`.toLowerCase().includes(q),
    );
  }, [allSearches, id, listQuery]);

  async function patchSearch(patch: Partial<ClientSearch>) {
    const res = await fetch(`/api/client-searches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Mise à jour", data.error ?? "");
      return;
    }
    setDetail((d) => (d ? { ...d, search: data.search } : d));
    toast.success("Enregistré");
  }

  async function addVehicleSlot(vehicleId: string, slot: ClientSearchVehicleSlot) {
    const res = await fetch(`/api/client-searches/${id}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle_id: vehicleId, slot }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Shortlist", data.error ?? "");
      return;
    }
    setDetail((d) =>
      d
        ? {
            ...d,
            shortlist: [
              data.row as ClientSearchVehicleRow,
              ...d.shortlist.filter((x) => x.vehicle_id !== vehicleId),
            ],
          }
        : d,
    );
    toast.success(CLIENT_SEARCH_VEHICLE_SLOT_LABELS[slot]);
  }

  async function linkContacts(contactIds: string[]) {
    const res = await fetch(`/api/client-searches/${id}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_ids: contactIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Sources", data.error ?? "");
      return;
    }
    await refreshDetail();
    toast.success("Sources ajoutées");
  }

  if (err || (!detail && !loadDetail)) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
        {err ?? "Fiche introuvable"}
      </p>
    );
  }

  if (!detail) {
    return <DetailSkeleton />;
  }

  const { search, assignments, events } = detail;
  const totalListed =
    matches != null
      ? matches.strong.length + matches.close.length + matches.stretch.length
      : null;
  const bestScore = matches?.strong[0]?.compatibility_score ?? null;

  return (
    <div
      className={cn(
        CS_SHELL,
        "flex min-h-[calc(100dvh-3.5rem)] min-w-0 flex-col md:min-h-[calc(100dvh-1rem)]",
        "xl:min-h-[calc(100dvh-2rem)]",
      )}
    >
      {/* Tabs — mobile uniquement (&lt; lg) */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border/50 bg-background/80 px-3 py-2 backdrop-blur-xl lg:hidden">
        {(
          [
            ["list", "Recherches", Users],
            ["market", "Marché", TrendingUp],
            ["pro", "Espace pro", Building2],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setWorkspaceTab(key)}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200",
              workspaceTab === key
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          "lg:grid lg:min-h-0 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)_auto]",
          "xl:grid-cols-[320px_minmax(0,1fr)_380px] xl:grid-rows-[minmax(0,1fr)]",
        )}
      >
        {/* Colonne 1 — 320px */}
        <aside
          className={cn(
            "flex min-h-0 w-full min-w-0 shrink-0 flex-col border-border/50 bg-background/60",
            "lg:row-span-2 lg:border-r xl:row-span-1",
            workspaceTab === "list" ? "flex" : "hidden",
            "lg:flex",
          )}
        >
          <SearchListColumn
            searches={listSearches}
            activeId={id}
            query={listQuery}
            onQueryChange={setListQuery}
          />
        </aside>

        {/* Colonne 2 — flex-1 */}
        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-col overflow-hidden bg-background/30",
            "lg:col-start-2 lg:row-start-1 lg:min-h-0",
            workspaceTab === "market" ? "flex" : "hidden",
            "lg:flex",
          )}
        >
          <PremiumMainHeader
            searchId={id}
            search={search}
            loadMatches={loadMatches}
            totalListed={totalListed}
            bestScore={bestScore}
            scanned={matches?.total_scanned ?? null}
          />
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className={cn("w-full min-w-0 space-y-8 px-5 py-8 sm:px-6", GAP_SECTION)}>
              <section id="resume-section">
                <ResumeSearchSection search={search} onPatch={patchSearch} matches={matches} />
              </section>

              {loadMatches && !matches ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/80" />
                  <p className="text-sm font-medium text-foreground">Analyse du marché…</p>
                  <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
                    Matching sur votre stock et le réseau — quelques secondes.
                  </p>
                </div>
              ) : matches ? (
                <>
                  <HintsPremiumSection hints={matches.hints} />
                  <div className="space-y-10">
                    <MatchTierSection
                      variant="strong"
                      title="Correspondance forte"
                      subtitle="Alignées budget, kilométrage et profil client"
                      items={matches.strong}
                      shortlistByVehicle={shortlistByVehicle}
                      onAdd={addVehicleSlot}
                    />
                    <MatchTierSection
                      variant="close"
                      title="Suggestions proches"
                      subtitle="À valider avec le client"
                      items={matches.close}
                      shortlistByVehicle={shortlistByVehicle}
                      onAdd={addVehicleSlot}
                    />
                    <MatchTierSection
                      variant="stretch"
                      title="Pistes à creuser"
                      subtitle="Compromis ou critères à assouplir"
                      items={matches.stretch}
                      shortlistByVehicle={shortlistByVehicle}
                      onAdd={addVehicleSlot}
                    />
                    <p className="pb-8 text-center text-[13px] text-muted-foreground">
                      {matches.total_scanned} annonce{matches.total_scanned > 1 ? "s" : ""} analysée
                      {matches.total_scanned > 1 ? "s" : ""}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </main>

        {/* Colonne 3 — 380px (sous le marché en tablette lg–xl) */}
        <aside
          className={cn(
            "flex min-h-0 w-full min-w-0 shrink-0 flex-col border-border/50 bg-muted/10",
            "lg:col-start-2 lg:row-start-2 lg:max-h-[min(520px,42vh)] lg:border-t lg:border-border/50",
            "xl:col-start-3 xl:row-start-1 xl:max-h-none xl:w-[380px] xl:border-l xl:border-t-0",
            workspaceTab === "pro" ? "flex" : "hidden",
            "lg:flex",
          )}
        >
          <div className="sticky top-0 flex max-h-[calc(100dvh-8rem)] min-h-0 flex-1 flex-col overflow-hidden lg:max-h-[min(520px,42vh)] xl:max-h-none">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-8">
              <div className={cn("flex flex-col", GAP_SECTION)}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Espace pro
                </p>
                <ProWorkspacePanel
                  searchId={id}
                  search={search}
                  assignments={assignments}
                  contacts={contacts ?? []}
                  events={events}
                  onRefresh={refreshDetail}
                  onPatch={patchSearch}
                  onLink={linkContacts}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── skeleton ─── */

function DetailSkeleton() {
  return (
    <div className="flex min-h-[60vh] animate-pulse flex-col gap-4 overflow-hidden rounded-2xl border border-border/40 bg-muted/20 xl:flex-row">
      <div className="hidden w-[320px] shrink-0 flex-col gap-4 border-r border-border/40 p-6 xl:flex">
        <div className="h-8 w-3/4 rounded-lg bg-muted" />
        <div className="h-10 w-full rounded-xl bg-muted" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/80" />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-6 p-6">
        <div className="h-24 rounded-2xl bg-muted/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/60" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/70" />
          ))}
        </div>
      </div>
      <div className="hidden w-[380px] shrink-0 flex-col gap-4 border-l border-border/40 p-6 xl:flex">
        <div className="h-40 rounded-2xl bg-muted/80" />
        <div className="h-56 rounded-2xl bg-muted/60" />
      </div>
    </div>
  );
}

/* ─── colonne liste ─── */

function SearchListColumn({
  searches,
  activeId,
  query,
  onQueryChange,
}: {
  searches: ClientSearch[];
  activeId: string;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  return (
    <>
      <div className={cn("shrink-0 space-y-4 border-b border-border/40 bg-background/40 px-6 py-6 backdrop-blur-sm")}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 shrink-0 px-2" href="/recherche/clients">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              Recherches clients
            </h2>
            <p className="text-[13px] text-muted-foreground">Vue pipeline — sélectionnez une fiche</p>
          </div>
        </div>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Filtrer par client ou véhicule…"
          className="h-11 rounded-xl border-border/60 bg-background/90"
        />
      </div>
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden overscroll-contain px-6 py-6">
        {searches.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            Aucune recherche ne correspond au filtre.
          </p>
        ) : (
          searches.map((s) => {
            const active = s.id === activeId;
            const budgetA = s.budget_min != null ? formatPrice(Number(s.budget_min)) : "—";
            const budgetB = s.budget_max != null ? formatPrice(Number(s.budget_max)) : "—";
            return (
              <Link
                key={s.id}
                href={`/recherche/clients/${s.id}`}
                className={cn(
                  "block rounded-2xl border p-5 transition-all duration-200",
                  active
                    ? "border-primary/45 bg-primary/[0.07] shadow-[0_8px_28px_-16px_hsl(var(--primary)/0.45)] ring-1 ring-primary/15"
                    : cn(
                        CARD,
                        "border-border/50 bg-card/70 hover:border-primary/25 hover:bg-card",
                      ),
                )}
              >
                <div className="flex gap-4">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold",
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/90 text-muted-foreground ring-1 ring-border/50",
                    )}
                  >
                    {initialsFromName(s.client_name)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                      {s.client_name}
                    </p>
                    <p className="line-clamp-2 text-[13px] capitalize leading-snug text-muted-foreground">
                      {s.brand} {s.model}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground ring-1 ring-border/50">
                        {budgetA} – {budgetB}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold",
                          active
                            ? "bg-primary/15 text-primary"
                            : "bg-muted/80 text-muted-foreground",
                        )}
                      >
                        {CLIENT_SEARCH_STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{s.cached_match_count}</span>{" "}
                      résultat{s.cached_match_count > 1 ? "s" : ""} proche
                      {s.cached_match_count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </nav>
    </>
  );
}

/* ─── header principal (colonne centre) ─── */

function PremiumMainHeader({
  searchId,
  search,
  loadMatches,
  totalListed,
  bestScore,
  scanned,
}: {
  searchId: string;
  search: ClientSearch;
  loadMatches: boolean;
  totalListed: number | null;
  bestScore: number | null;
  scanned: number | null;
}) {
  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background/80 px-5 py-6 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl dark:bg-background/70 sm:px-6">
      <div className="flex w-full min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Fiche sourcing
          </p>
          <div className="flex flex-wrap items-center gap-3 gap-y-2">
            <h1 className="text-balance text-[1.65rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[2rem]">
              {search.client_name}
            </h1>
            {search.is_rare && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/35 bg-orange-500/10 px-3 py-1 text-[11px] font-semibold text-orange-900 dark:text-orange-100">
                <Flame className="h-3.5 w-3.5" />
                Rare
              </span>
            )}
          </div>
          <p className="max-w-2xl text-[1.05rem] font-medium capitalize leading-relaxed text-muted-foreground">
            {search.brand} {search.model}
            {search.version ? (
              <span className="font-normal text-muted-foreground/80"> · {search.version}</span>
            ) : null}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-4 lg:max-w-xl lg:items-end">
          <div className="flex w-full flex-wrap gap-3 lg:justify-end">
            <StatPill
              icon={Target}
              label="Statut"
              value={CLIENT_SEARCH_STATUS_LABELS[search.status]}
            />
            <StatPill
              icon={Percent}
              label="Meilleur match"
              value={
                loadMatches ? "…" : bestScore != null ? `${Math.round(bestScore)} %` : "—"
              }
            />
            <StatPill
              icon={Gauge}
              label="Difficulté"
              value={
                search.difficulty_score != null ? `${search.difficulty_score} / 10` : "—"
              }
            />
            <StatPill
              icon={Sparkles}
              label="Annonces listées"
              value={loadMatches ? "…" : totalListed != null ? String(totalListed) : "—"}
            />
            {scanned != null && (
              <StatPill
                icon={Compass}
                label="Scannées"
                value={String(scanned)}
                muted
              />
            )}
          </div>
          <div className="flex w-full flex-wrap gap-3 lg:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl border-border/70"
              href={`/recherche/clients/${searchId}#resume-section`}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier critères
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-xl"
              href="/recherche/clients/new"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle recherche
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[8.5rem] flex-1 items-center gap-3 rounded-2xl border border-border/55 bg-card/90 px-4 py-3 shadow-sm sm:flex-initial sm:min-w-[9.5rem]",
        muted && "opacity-90",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground ring-1 ring-border/40">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-[13px] font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* ─── résumé critères + sourcing ─── */

function ResumeSearchSection({
  search,
  onPatch,
  matches,
}: {
  search: ClientSearch;
  onPatch: (p: Partial<ClientSearch>) => void;
  matches: MatchesPayload | null;
}) {
  const [progressDraft, setProgressDraft] = useState(search.sourcing_progress);
  useEffect(() => {
    setProgressDraft(search.sourcing_progress);
  }, [search.id, search.sourcing_progress]);

  const criteria: { icon: ReactNode; label: string; value: string }[] = [];
  if (search.budget_min != null || search.budget_max != null) {
    const a = search.budget_min != null ? formatPrice(Number(search.budget_min)) : "—";
    const b = search.budget_max != null ? formatPrice(Number(search.budget_max)) : "—";
    criteria.push({
      icon: <Wallet className="h-4 w-4" />,
      label: "Budget",
      value: `${a} → ${b}`,
    });
  }
  if (search.mileage_max != null) {
    criteria.push({
      icon: <Gauge className="h-4 w-4" />,
      label: "Km max",
      value: formatMileage(search.mileage_max),
    });
  }
  if (search.year_min != null) {
    criteria.push({
      icon: <Calendar className="h-4 w-4" />,
      label: "Année min",
      value: String(search.year_min),
    });
  }
  if (search.geo_zone?.trim()) {
    criteria.push({
      icon: <MapPin className="h-4 w-4" />,
      label: "Zone",
      value: search.geo_zone.trim(),
    });
  }
  criteria.push({
    icon: <Star className="h-4 w-4" />,
    label: "Priorité",
    value: CLIENT_SEARCH_PRIORITY_LABELS[search.priority],
  });

  return (
    <div className={cn("flex flex-col", GAP_SECTION)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Résumé de la recherche</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Critères actifs et pilotage du sourcing sur un seul écran lisible.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {criteria.map((c) => (
          <div key={c.label} className={cn(CARD, PAD_INNER)}>
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 break-words text-[15px] font-semibold leading-snug text-foreground">
                  {c.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={cn(CARD, PAD_INNER)}>
          <Field label="Statut">
            <Select
              className="h-12 w-full min-w-0 rounded-xl border-border/60 bg-background"
              value={search.status}
              onChange={(e) => onPatch({ status: e.target.value as ClientSearch["status"] })}
            >
              {Object.entries(CLIENT_SEARCH_STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className={cn(CARD, PAD_INNER)}>
          <Field label="Progression sourcing">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <input
                type="range"
                min={0}
                max={100}
                value={progressDraft}
                onChange={(e) => setProgressDraft(Number(e.target.value))}
                onPointerUp={(e) => {
                  const v = Math.min(
                    100,
                    Math.max(0, Number((e.target as HTMLInputElement).value)),
                  );
                  if (v !== search.sourcing_progress) onPatch({ sourcing_progress: v });
                }}
                className="h-3 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-[hsl(var(--primary))]"
              />
              <div className="flex shrink-0 items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-12 w-[4.5rem] rounded-xl tabular-nums"
                  value={progressDraft}
                  onChange={(e) => setProgressDraft(Number(e.target.value))}
                  onBlur={() => {
                    const raw = Number(progressDraft);
                    const v = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
                    setProgressDraft(v);
                    if (v !== search.sourcing_progress) onPatch({ sourcing_progress: v });
                  }}
                />
                <span className="text-sm font-semibold text-muted-foreground">%</span>
              </div>
            </div>
          </Field>
        </div>
        <div
          className={cn(
            CARD,
            PAD_INNER,
            "border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card",
          )}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
              <Target className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-2 text-[14px] leading-relaxed">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Terrain & cache
              </p>
              {search.difficulty_score != null && (
                <p className="font-semibold text-foreground">
                  Difficulté{" "}
                  <span className="tabular-nums">{search.difficulty_score}</span>
                  <span className="font-normal text-muted-foreground">/10</span>
                </p>
              )}
              {search.eta_days_min != null && search.eta_days_max != null && (
                <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  Estimation {search.eta_days_min}–{search.eta_days_max} jours
                </p>
              )}
              <p className="text-[13px] text-muted-foreground">
                <span className="font-bold tabular-nums text-foreground">
                  {search.cached_match_count}
                </span>{" "}
                véhicules proches (cache)
                {matches && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-semibold text-foreground">
                      {matches.strong.length + matches.close.length + matches.stretch.length}
                    </span>{" "}
                    listés maintenant
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── suggestions IA ─── */

function HintsPremiumSection({ hints }: { hints: SourcingHint[] }) {
  if (!hints.length) return null;
  return (
    <section className={cn("flex flex-col", GAP_SECTION)}>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-primary/15 text-primary ring-1 ring-primary/20">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Suggestions IA</h2>
          <p className="text-[14px] text-muted-foreground">
            Pistes actionnables pour accélérer le sourcing.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {hints.map((h) => (
          <div
            key={h.title}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-primary/[0.04] to-violet-500/[0.06] p-6 pl-7 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]",
            )}
          >
            <div
              aria-hidden
              className="absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-primary to-violet-500"
            />
            <h3 className="flex items-start gap-3 text-[16px] font-semibold leading-snug tracking-tight text-foreground">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              {h.title}
            </h3>
            <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-muted-foreground">
              {h.lines.map((line, i) => (
                <li key={`${h.title}-${i}`} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── matching sections ─── */

function MatchTierSection({
  variant,
  title,
  subtitle,
  items,
  shortlistByVehicle,
  onAdd,
}: {
  variant: "strong" | "close" | "stretch";
  title: string;
  subtitle: string;
  items: MatchVehicle[];
  shortlistByVehicle: Map<string, ClientSearchVehicleRow>;
  onAdd: (vehicleId: string, slot: ClientSearchVehicleSlot) => void;
}) {
  if (!items.length) return null;
  const meta = {
    strong: {
      icon: CheckCircle2,
      chip: "bg-emerald-500/12 text-emerald-900 ring-emerald-500/25 dark:text-emerald-200",
    },
    close: {
      icon: GitBranch,
      chip: "bg-sky-500/12 text-sky-900 ring-sky-500/25 dark:text-sky-200",
    },
    stretch: {
      icon: Compass,
      chip: "bg-amber-500/12 text-amber-950 ring-amber-500/25 dark:text-amber-100",
    },
  }[variant];
  const Icon = meta.icon;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/90 ring-1 ring-border/50">
            <Icon className="h-6 w-6 text-foreground" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-4 py-1.5 text-[12px] font-bold tabular-nums ring-1",
            meta.chip,
          )}
        >
          {items.length} véhicule{items.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {items.map((v) => (
          <VehicleMatchCard
            key={v.id}
            vehicle={v}
            slot={shortlistByVehicle.get(v.id)?.slot}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}

function VehicleMatchCard({
  vehicle,
  slot,
  onAdd,
}: {
  vehicle: MatchVehicle;
  slot?: ClientSearchVehicleSlot;
  onAdd: (vehicleId: string, slot: ClientSearchVehicleSlot) => void;
}) {
  const cover = vehicle.vehicle_images?.[0];
  const profile = vehicle.profiles as Pick<Profile, "company_name" | "phone" | "location"> | null;
  const score = Math.round(vehicle.compatibility_score);
  const goodDeal = score >= 88 || vehicle.band === "strong";

  return (
    <div
      className={cn(
        "group min-w-0 overflow-hidden rounded-2xl border border-border/55 bg-card/95 shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] dark:bg-card/50",
      )}
    >
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-stretch">
        <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-black/[0.06] dark:ring-white/[0.08] md:aspect-auto md:min-h-[200px]">
          {cover ? (
            <Image
              src={publicImageUrl(cover.storage_path)}
              alt=""
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 280px"
            />
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-muted-foreground">
              Sans photo
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
          />
          {vehicle.is_new_listing && (
            <span className="absolute left-3 top-3 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-md">
              Nouveau
            </span>
          )}
          {goodDeal && (
            <span className="absolute right-3 top-3 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
              Bonne affaire
            </span>
          )}
          <span className="absolute bottom-3 left-3 rounded-lg bg-background/95 px-2.5 py-1 text-[12px] font-bold tabular-nums text-foreground shadow-sm backdrop-blur-sm dark:bg-card/95">
            {score}% match
          </span>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div className="space-y-3">
            <Link
              href={`/garage/vehicules/${vehicle.id}`}
              className="inline-flex text-[1.15rem] font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
            >
              {vehicle.brand} {vehicle.model}
            </Link>
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {formatPrice(Number(vehicle.price))}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Gauge className="h-4 w-4 shrink-0 opacity-80" />
                {formatMileage(vehicle.mileage)}
              </span>
              <span className="inline-flex items-center gap-2 break-words">
                <MapPin className="h-4 w-4 shrink-0 opacity-80" />
                {vehicle.location}
              </span>
              {profile?.company_name && (
                <span className="inline-flex min-w-0 items-center gap-2 break-words">
                  <Building2 className="h-4 w-4 shrink-0 opacity-80" />
                  {profile.company_name}
                </span>
              )}
            </div>
            {slot && (
              <p className="text-[13px] font-semibold text-primary">
                {CLIENT_SEARCH_VEHICLE_SLOT_LABELS[slot]}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 rounded-xl"
              onClick={() => onAdd(vehicle.id, "saved")}
            >
              <Star className="mr-2 h-4 w-4" />
              Shortlist
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 rounded-xl"
              onClick={() => onAdd(vehicle.id, "proposed")}
            >
              Proposé
            </Button>
            <Button variant="outline" size="sm" className="h-10 rounded-xl" href={`/garage/vehicules/${vehicle.id}`}>
              Fiche
            </Button>
            {profile?.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background px-4 text-[13px] font-semibold transition-colors hover:bg-accent"
              >
                <Phone className="h-4 w-4" />
                Appeler
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── espace pro (sources + IA + notes) ─── */

function ProWorkspacePanel({
  searchId,
  search,
  assignments,
  contacts,
  events,
  onRefresh,
  onPatch,
  onLink,
}: {
  searchId: string;
  search: ClientSearch;
  assignments: (ClientSearchSourceAssignment & { sourcing_contacts: SourcingContact | null })[];
  contacts: SourcingContact[];
  events: ClientSearchEvent[];
  onRefresh: () => Promise<void>;
  onPatch: (p: Partial<ClientSearch>) => void;
  onLink: (ids: string[]) => Promise<void>;
}) {
  const toast = useToast();
  const [pick, setPick] = useState("");
  const [aiContact, setAiContact] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [tone, setTone] = useState<"professional" | "quick" | "friendly">("friendly");
  const [aiText, setAiText] = useState("");
  const [aiSubject, setAiSubject] = useState<string | undefined>();
  const [aiLoading, setAiLoading] = useState(false);

  const assignedIds = new Set(assignments.map((a) => a.contact_id));
  const available = contacts.filter((c) => !assignedIds.has(c.id));

  async function patchAssignment(
    assignmentId: string,
    patch: Partial<ClientSearchSourceAssignment>,
  ) {
    const res = await fetch(`/api/client-searches/${searchId}/sources/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Source", data.error ?? "");
      return;
    }
    await onRefresh();
    toast.success("Source mise à jour");
  }

  async function generateAi() {
    const contact_id = aiContact;
    if (!contact_id) {
      toast.error("IA", "Choisissez un contact");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`/api/client-searches/${searchId}/ai-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_id, channel, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur IA");
      setAiText(data.message ?? "");
      setAiSubject(data.subject);
      const asn = assignments.find((a) => a.contact_id === contact_id);
      if (asn) {
        const pr = await fetch(`/api/client-searches/${searchId}/sources/${asn.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            last_contacted_at: new Date().toISOString(),
            follow_up_status: "pending",
          }),
        });
        if (pr.ok) await onRefresh();
      }
    } catch (e) {
      toast.error("IA", e instanceof Error ? e.message : "");
    } finally {
      setAiLoading(false);
    }
  }

  function openWhatsAppWithMessage(phone: string, message: string) {
    const url = `${waHref(phone)}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className={cn(CARD, PAD_INNER, "space-y-6")}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Sources professionnelles</h3>
            <p className="text-[13px] text-muted-foreground">Garages et partenaires liés à cette fiche.</p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Aucune source liée</p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Ajoutez un contact pour suivre les relances et lancer des messages IA.
            </p>
          </div>
        ) : (
          <ul className={cn("flex flex-col", GAP_SECTION)}>
            {assignments.map((a) => {
              const c = a.sourcing_contacts;
              if (!c) return null;
              const last =
                a.last_contacted_at &&
                new Date(a.last_contacted_at).toLocaleString("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });
              return (
                <li key={a.id} className={cn(CARD, "border-primary/10 bg-card/80 p-6")}>
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[16px] font-semibold leading-snug text-foreground">
                          {c.garage_name}
                        </p>
                        <p className="text-[13px] text-muted-foreground">
                          {[c.contact_name, c.city].filter(Boolean).join(" · ")}
                          {c.specialty ? ` · ${c.specialty}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted/90 px-3 py-1 text-[11px] font-semibold text-foreground ring-1 ring-border/50">
                        {SOURCE_FOLLOW_UP_LABELS[a.follow_up_status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Suivi">
                        <Select
                          className="h-11 rounded-xl"
                          value={a.follow_up_status}
                          onChange={(e) =>
                            patchAssignment(a.id, {
                              follow_up_status: e.target
                                .value as ClientSearchSourceAssignment["follow_up_status"],
                            })
                          }
                        >
                          {Object.entries(SOURCE_FOLLOW_UP_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      {last && (
                        <div className="rounded-xl border border-border/50 bg-background/60 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Dernier contact
                          </p>
                          <p className="mt-1 text-[13px] font-medium text-foreground">{last}</p>
                        </div>
                      )}
                    </div>

                    <Field label="Réponse reçue">
                      <Textarea
                        defaultValue={a.response_received ?? ""}
                        placeholder="Synthèse de la réponse du partenaire…"
                        className="min-h-[88px] rounded-xl text-[13px]"
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (a.response_received ?? "")) {
                            patchAssignment(a.id, { response_received: v || null });
                          }
                        }}
                      />
                    </Field>

                    <div className="flex flex-wrap gap-2">
                      {c.phone && (
                        <>
                          <Button variant="outline" size="sm" className="h-10 rounded-xl" href={`tel:${c.phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            Appeler
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl"
                            onClick={() => window.open(waHref(c.phone!), "_blank", "noopener,noreferrer")}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            WhatsApp
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {available.length > 0 && (
          <div className={cn("space-y-4 border-t border-border/40 pt-6")}>
            <Field label="Ajouter depuis le carnet">
              <Select value={pick} onChange={(e) => setPick(e.target.value)} className="h-11 rounded-xl">
                <option value="">Choisir un contact…</option>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.garage_name}
                    {c.city ? ` — ${c.city}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              type="button"
              className="h-10 w-full rounded-xl"
              disabled={!pick}
              onClick={() => {
                if (pick) onLink([pick]).then(() => setPick(""));
              }}
            >
              Lier la source
            </Button>
          </div>
        )}

        <AddContactInline searchId={searchId} onCreated={onRefresh} />
      </div>

      <div
        className={cn(
          CARD,
          PAD_INNER,
          "space-y-6 border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] via-card to-card",
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-700 ring-1 ring-violet-500/25 dark:text-violet-300">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Message IA</h3>
            <p className="text-[13px] text-muted-foreground">
              Générez un texte pour {search.brand} {search.model}.
            </p>
          </div>
        </div>

        <Field label="Contact cible">
          <Select
            value={aiContact}
            onChange={(e) => setAiContact(e.target.value)}
            className="h-11 rounded-xl"
          >
            <option value="">Choisir…</option>
            {assignments.map((a) => {
              const c = a.sourcing_contacts;
              if (!c) return null;
              return (
                <option key={a.id} value={c.id}>
                  {c.garage_name}
                </option>
              );
            })}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Canal">
            <Select
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
              className="h-11 rounded-xl"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </Select>
          </Field>
          <Field label="Style">
            <Select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="h-11 rounded-xl">
              <option value="professional">Professionnel</option>
              <option value="quick">Rapide</option>
              <option value="friendly">Amical</option>
            </Select>
          </Field>
        </div>

        <Button
          type="button"
          className="h-11 w-full rounded-xl"
          disabled={aiLoading}
          onClick={() => void generateAi()}
        >
          {aiLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
          Générer avec l’IA
        </Button>

        {aiSubject && (
          <p className="rounded-xl border border-border/50 bg-background/60 px-4 py-3 text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">Objet :</span> {aiSubject}
          </p>
        )}

        <div className="space-y-3 rounded-2xl border border-border/50 bg-background/70 p-4 ring-1 ring-black/[0.03] dark:ring-white/[0.05]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Aperçu message
          </p>
          <Textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Le texte généré apparaîtra ici — vous pouvez l’éditer avant envoi."
            className="min-h-[140px] resize-y rounded-xl border-0 bg-transparent text-[14px] leading-relaxed shadow-none focus-visible:ring-1"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 rounded-xl"
              disabled={!aiText}
              onClick={() => {
                void navigator.clipboard.writeText(aiText);
                toast.success("Copié");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copier
            </Button>
            {(() => {
              const asn = assignments.find((a) => a.contact_id === aiContact);
              const phone = asn?.sourcing_contacts?.phone;
              if (!phone || !aiText) return null;
              return (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl"
                  onClick={() => openWhatsAppWithMessage(phone, aiText)}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              );
            })()}
          </div>
        </div>
      </div>

      <div className={cn(CARD, PAD_INNER, "space-y-4")}>
        <h3 className="text-[16px] font-semibold text-foreground">Notes internes</h3>
        <p className="text-[13px] text-muted-foreground">Mémo terrain — non visible par le client.</p>
        <Textarea
          key={search.updated_at}
          defaultValue={search.internal_notes ?? ""}
          placeholder="Ex. client exige boîte auto, dispo le samedi…"
          className="min-h-[120px] rounded-xl text-[14px]"
          onBlur={async (e) => {
            const v = e.target.value.trim();
            if (v === (search.internal_notes ?? "")) return;
            await onPatch({ internal_notes: v || null });
            await onRefresh();
          }}
        />
      </div>

      <div className={cn(CARD, PAD_INNER, "space-y-4")}>
        <h3 className="text-[16px] font-semibold text-foreground">Historique</h3>
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1 text-[13px]">
          {events.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 py-8 text-center text-muted-foreground">
              Aucun événement pour l’instant.
            </li>
          ) : (
            events.map((ev) => (
              <li
                key={ev.id}
                className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <span className="font-medium capitalize text-foreground">
                  {ev.event_type.replace(/_/g, " ")}
                </span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  {new Date(ev.created_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}

function AddContactInline({
  searchId,
  onCreated,
}: {
  searchId: string;
  onCreated: () => Promise<void>;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fetch("/api/sourcing-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garage_name: String(fd.get("garage_name") ?? "").trim(),
          contact_name: String(fd.get("contact_name") ?? "").trim() || null,
          phone: String(fd.get("phone") ?? "").trim() || null,
          city: String(fd.get("city") ?? "").trim() || null,
          specialty: String(fd.get("specialty") ?? "").trim() || null,
          search_id: searchId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Contact créé et lié");
      setOpen(false);
      e.currentTarget.reset();
      await onCreated();
    } catch (err) {
      toast.error("Contact", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 w-full rounded-xl border-dashed"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Nouveau contact + lier
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("space-y-4 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6")}
    >
      <Field label="Garage" required>
        <Input name="garage_name" required placeholder="Garage Premium Auto" className="h-11 rounded-xl" />
      </Field>
      <Field label="Contact">
        <Input name="contact_name" placeholder="Prénom" className="h-11 rounded-xl" />
      </Field>
      <Field label="Téléphone">
        <Input name="phone" type="tel" className="h-11 rounded-xl" />
      </Field>
      <Field label="Ville">
        <Input name="city" placeholder="Paris" className="h-11 rounded-xl" />
      </Field>
      <Field label="Spécialité">
        <Input name="specialty" placeholder="BMW / Mercedes" className="h-11 rounded-xl" />
      </Field>
      <div className="flex gap-3">
        <Button type="submit" className="h-11 rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </div>
    </form>
  );
}
