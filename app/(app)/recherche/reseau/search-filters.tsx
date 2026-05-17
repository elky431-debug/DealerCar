"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  defaults: {
    q?: string;
    min?: string;
    max?: string;
    location?: string;
    type?: string;
  };
}

export function SearchFilters({ defaults }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(defaults.q ?? "");
  const [min, setMin] = useState(defaults.min ?? "");
  const [max, setMax] = useState(defaults.max ?? "");
  const [location, setLocation] = useState(defaults.location ?? "");
  const [type, setType] = useState(defaults.type ?? "");

  useEffect(() => {
    const handle = setTimeout(() => apply(), 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, min, max, location, type]);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (location) params.set("location", location);
    if (type) params.set("type", type);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/recherche/reseau${qs ? `?${qs}` : ""}`);
    });
  }

  function reset() {
    setQ("");
    setMin("");
    setMax("");
    setLocation("");
    setType("");
    router.push("/recherche/reseau");
  }

  const hasFilters = q || min || max || location || type;

  return (
    <form onSubmit={apply} className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-xl border-border/70 bg-card pl-11 pr-4 text-[15px] shadow-sm transition-shadow focus-visible:shadow-md"
          placeholder="Rechercher une marque, un modèle dans le réseau…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NumChip label="Prix min" value={min} onChange={setMin} suffix="€" />
        <NumChip label="Prix max" value={max} onChange={setMax} suffix="€" />
        <TextChip label="Ville" value={location} onChange={setLocation} placeholder="Lyon, 69…" />
        <SelectChip
          value={type}
          onChange={setType}
          options={[
            { value: "", label: "Tous types" },
            { value: "stock", label: "Stock" },
            { value: "depot", label: "Dépôt" },
          ]}
        />

        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={reset} className="ml-auto">
            <X className="h-3.5 w-3.5" /> Effacer
          </Button>
        )}
      </div>
    </form>
  );
}

function NumChip({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  const active = Boolean(value);
  return (
    <label
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        active ? "dl-chip-on border" : "dl-chip-off border",
      )}
    >
      <span className={cn(active ? "text-white/70" : "text-muted-foreground")}>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={cn(
          "w-16 bg-transparent tabular outline-none placeholder:text-current/40",
          active ? "text-white placeholder:text-white/40" : "text-foreground",
        )}
      />
      {suffix && <span className={cn(active ? "text-white/70" : "text-muted-foreground")}>{suffix}</span>}
    </label>
  );
}

function TextChip({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const active = Boolean(value);
  return (
    <label
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        active ? "dl-chip-on border" : "dl-chip-off border",
      )}
    >
      <span className={cn(active ? "text-white/70" : "text-muted-foreground")}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-24 bg-transparent outline-none placeholder:text-current/40",
          active ? "text-white placeholder:text-white/40" : "text-foreground",
        )}
      />
    </label>
  );
}

function SelectChip({
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
        "relative inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "dl-chip-on border"
          : "dl-chip-off border text-foreground",
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
