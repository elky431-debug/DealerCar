"use client";

import { useState } from "react";
import {
  Search,
  ExternalLink,
  Globe,
  Loader2,
  AlertTriangle,
  Gauge,
  Calendar,
  Fuel,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type {
  MarketListing,
  MarketSource,
} from "@/lib/carapis";

type SourceOption = MarketSource;

interface FormState {
  source: SourceOption;
  brand: string;
  model: string;
  country: string;
  yearFrom: string;
  yearTo: string;
  priceMax: string;
  mileageMax: string;
  fuelType: string;
}

const SOURCE_OPTIONS: { value: SourceOption; label: string; hint: string }[] = [
  { value: "autoscout24", label: "AutoScout24", hint: "Europe (FR, DE, IT, ES…)" },
  { value: "mobile.de", label: "Mobile.de", hint: "Allemagne" },
];

const COUNTRY_OPTIONS = [
  { value: "FR", label: "France" },
  { value: "DE", label: "Allemagne" },
  { value: "IT", label: "Italie" },
  { value: "ES", label: "Espagne" },
  { value: "BE", label: "Belgique" },
  { value: "NL", label: "Pays-Bas" },
  { value: "PT", label: "Portugal" },
  { value: "AT", label: "Autriche" },
];

const FUEL_OPTIONS = [
  { value: "", label: "Tous carburants" },
  { value: "diesel", label: "Diesel" },
  { value: "gasoline", label: "Essence" },
  { value: "hybrid", label: "Hybride" },
  { value: "electric", label: "Électrique" },
  { value: "plug_in_hybrid", label: "Hybride rechargeable" },
];

const DEFAULTS: FormState = {
  source: "autoscout24",
  brand: "",
  model: "",
  country: "FR",
  yearFrom: "",
  yearTo: "",
  priceMax: "",
  mileageMax: "",
  fuelType: "",
};

export function MarketSearch() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [results, setResults] = useState<MarketListing[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/market-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: form.source,
          brand: form.brand || undefined,
          model: form.model || undefined,
          country: form.source === "autoscout24" ? form.country : undefined,
          yearFrom: form.yearFrom || undefined,
          yearTo: form.yearTo || undefined,
          priceMax: form.priceMax || undefined,
          mileageMax: form.mileageMax || undefined,
          fuelType: form.fuelType || undefined,
          limit: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Erreur lors de la recherche");
      }
      setResults(data.listings ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm(DEFAULTS);
    setResults(null);
    setError(null);
    setTotal(0);
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] sm:p-6"
      >
        {/* Source picker (segmented) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Globe className="h-4 w-4" />
            Source des annonces
          </div>
          <div className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1">
            {SOURCE_OPTIONS.map((opt) => {
              const active = form.source === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("source", opt.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12.5px] font-medium tracking-tight transition-all",
                    active
                      ? "bg-card text-foreground shadow-[0_2px_8px_-2px_hsl(var(--foreground)/0.18)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title={opt.hint}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Marque" htmlFor="brand">
            <Input
              id="brand"
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="BMW"
            />
          </Field>
          <Field label="Modèle" htmlFor="model">
            <Input
              id="model"
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="Série 3"
            />
          </Field>

          {form.source === "autoscout24" && (
            <Field label="Pays" htmlFor="country">
              <Select
                id="country"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Carburant" htmlFor="fuel">
            <Select
              id="fuel"
              value={form.fuelType}
              onChange={(e) => set("fuelType", e.target.value)}
            >
              {FUEL_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Année min." htmlFor="yearFrom">
            <Input
              id="yearFrom"
              type="number"
              inputMode="numeric"
              value={form.yearFrom}
              onChange={(e) => set("yearFrom", e.target.value)}
              placeholder="2020"
            />
          </Field>
          <Field label="Année max." htmlFor="yearTo">
            <Input
              id="yearTo"
              type="number"
              inputMode="numeric"
              value={form.yearTo}
              onChange={(e) => set("yearTo", e.target.value)}
              placeholder="2024"
            />
          </Field>
          <Field label="Prix max. (€)" htmlFor="priceMax">
            <Input
              id="priceMax"
              type="number"
              inputMode="numeric"
              value={form.priceMax}
              onChange={(e) => set("priceMax", e.target.value)}
              placeholder="35000"
            />
          </Field>
          <Field label="Km max." htmlFor="mileageMax">
            <Input
              id="mileageMax"
              type="number"
              inputMode="numeric"
              value={form.mileageMax}
              onChange={(e) => set("mileageMax", e.target.value)}
              placeholder="80000"
            />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={reset} disabled={loading}>
            Réinitialiser
          </Button>
          <Button type="submit" loading={loading}>
            <Search className="h-4 w-4" />
            Rechercher
          </Button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/[0.06] p-4 text-[13px] text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p className="font-medium">La recherche a échoué.</p>
            <p className="text-destructive/80">{error}</p>
            {error.toLowerCase().includes("404") && (
              <p className="rounded-md bg-destructive/10 px-2.5 py-2 text-[12px] leading-relaxed text-destructive/90">
                <strong>Indice :</strong> l&apos;API Carapis renvoie 404 sur tous
                les endpoints connus. Soit ta clé n&apos;est pas activée pour
                l&apos;accès API (juste pour le catalogue web), soit Carapis a
                changé d&apos;URL. Vérifie ton dashboard{" "}
                <a
                  href="https://my.carapis.com/private/api-keys/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  my.carapis.com
                </a>{" "}
                ou contacte-moi pour basculer sur un autre fournisseur.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card px-6 py-16 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Recherche d&apos;annonces en cours…
        </div>
      )}

      {/* Results */}
      {!loading && results !== null && results.length === 0 && !error && (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Aucune annonce trouvée"
          description="Essayez d'élargir vos critères : changez de source, retirez le pays ou augmentez la fourchette de prix."
        />
      )}

      {!loading && results !== null && results.length > 0 && (
        <>
          <p className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground tabular">
              {results.length}
            </span>{" "}
            résultat{results.length > 1 ? "s" : ""} affiché
            {results.length > 1 ? "s" : ""}
            {total > results.length && (
              <>
                {" "}
                sur{" "}
                <span className="tabular text-foreground/70">{total.toLocaleString("fr-FR")}</span>
              </>
            )}
            {" · source "}
            <span className="text-foreground">
              {SOURCE_OPTIONS.find((s) => s.value === form.source)?.label}
            </span>
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((l) => (
              <ListingCard key={`${l.source}-${l.id}`} listing={l} />
            ))}
          </div>
        </>
      )}

      {/* Initial empty state (before any search) */}
      {!loading && results === null && !error && (
        <EmptyState
          icon={<Globe className="h-5 w-5" />}
          title="Lancez votre première recherche"
          description="Renseignez au moins une marque ou un modèle, puis cliquez sur Rechercher pour interroger la base d'annonces."
        />
      )}
    </div>
  );
}

/* ---------- Listing card ---------- */

function ListingCard({ listing }: { listing: MarketListing }) {
  const price =
    typeof listing.priceEur === "number"
      ? new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(listing.priceEur)
      : "Prix sur demande";

  const km =
    typeof listing.mileageKm === "number"
      ? `${listing.mileageKm.toLocaleString("fr-FR")} km`
      : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.06]">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-foreground shadow-sm ring-1 ring-inset ring-foreground/10 backdrop-blur-md">
          {sourceLabel(listing.source)}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight">
          {listing.title || `${listing.brand ?? ""} ${listing.model ?? ""}`.trim() || "Annonce"}
        </h3>

        <p className="text-[20px] font-semibold tabular tracking-tight text-foreground">
          {price}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-y-1 text-[12px] text-muted-foreground">
          {listing.year && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {listing.year}
            </span>
          )}
          {km && (
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" />
              {km}
            </span>
          )}
          {listing.fuelType && (
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5" />
              {prettyFuel(listing.fuelType)}
            </span>
          )}
          {(listing.city || listing.country) && (
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {[listing.city, listing.country].filter(Boolean).join(", ")}
              </span>
            </span>
          )}
        </div>

        {listing.url && (
          <a
            href={listing.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-background py-2 text-[12.5px] font-medium tracking-tight text-foreground transition-colors hover:border-foreground/40 hover:bg-muted"
          >
            Voir l&apos;annonce
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function sourceLabel(s: MarketSource): string {
  return s === "mobile.de" ? "Mobile.de" : "AutoScout24";
}

function prettyFuel(s: string): string {
  const k = s.toLowerCase();
  if (k.includes("diesel")) return "Diesel";
  if (k.includes("electric") || k.includes("elektro")) return "Électrique";
  if (k.includes("plug")) return "Hybride rech.";
  if (k.includes("hybrid")) return "Hybride";
  if (k.includes("petrol") || k.includes("gasoline") || k.includes("benzin"))
    return "Essence";
  return s;
}
