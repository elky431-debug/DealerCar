"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  defaults: { status?: string; type?: string; visibility?: string; q?: string };
}

const STATUS_OPTIONS = [
  { value: "", label: "Tous statuts" },
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Réservé" },
  { value: "sold", label: "Vendu" },
];
const TYPE_OPTIONS = [
  { value: "", label: "Tous types" },
  { value: "stock", label: "Stock" },
  { value: "depot", label: "Dépôt" },
];
const VISIBILITY_OPTIONS = [
  { value: "", label: "Toute visibilité" },
  { value: "private", label: "Privé" },
  { value: "network", label: "Réseau" },
];

export function VehicleListFilters({ defaults }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaults.q ?? "");
  const [status, setStatus] = useState(defaults.status ?? "");
  const [type, setType] = useState(defaults.type ?? "");
  const [visibility, setVisibility] = useState(defaults.visibility ?? "");

  function apply(
    next?: Partial<{ q: string; status: string; type: string; visibility: string }>,
    e?: React.FormEvent,
  ) {
    e?.preventDefault();
    const params = new URLSearchParams();
    const Q = next?.q ?? q;
    const S = next?.status ?? status;
    const T = next?.type ?? type;
    const V = next?.visibility ?? visibility;
    if (Q) params.set("q", Q);
    if (S) params.set("status", S);
    if (T) params.set("type", T);
    if (V) params.set("visibility", V);
    router.push(`/garage/vehicules${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function reset() {
    setQ("");
    setStatus("");
    setType("");
    setVisibility("");
    router.push("/garage/vehicules");
  }

  const hasFilters = q || status || type || visibility;
  const activeCount = [status, type, visibility].filter(Boolean).length;

  return (
    <form onSubmit={(e) => apply(undefined, e)} className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-xl border-border/70 bg-card pl-11 pr-4 text-[15px] shadow-sm transition-shadow focus-visible:shadow-md"
          placeholder="Rechercher une marque, un modèle…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          value={status}
          onChange={(v) => {
            setStatus(v);
            apply({ status: v });
          }}
          options={STATUS_OPTIONS}
        />
        <FilterChip
          value={type}
          onChange={(v) => {
            setType(v);
            apply({ type: v });
          }}
          options={TYPE_OPTIONS}
        />
        <FilterChip
          value={visibility}
          onChange={(v) => {
            setVisibility(v);
            apply({ visibility: v });
          }}
          options={VISIBILITY_OPTIONS}
        />

        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <X className="h-3.5 w-3.5" /> Effacer
              {activeCount > 0 && (
                <span className="ml-0.5 rounded-full bg-muted px-1.5 text-[10px] font-semibold">
                  {activeCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function FilterChip({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = Boolean(value);
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <label
      className={cn(
        "relative inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-all",
        active
          ? "dl-chip-on border shadow-sm"
          : "border-border/70 bg-card text-foreground hover:border-foreground/40",
      )}
    >
      <span>{current.label}</span>
      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
