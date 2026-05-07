"use client";

import { useMemo, useState } from "react";
import { Megaphone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ListingEditor } from "./listing-editor";
import { cn, formatPrice, publicImageUrl } from "@/lib/utils";
import type { VehicleWithRelations } from "@/lib/types";

interface Props {
  vehicles: VehicleWithRelations[];
}

function checklistScore(v: VehicleWithRelations): { ok: number; total: number } {
  const items = [v.photos_ok, v.clean_ok, v.ct_ok, v.video_ok];
  return { ok: items.filter(Boolean).length, total: items.length };
}

export function ListingsManager({ vehicles }: Props) {
  const [selectedId, setSelectedId] = useState<string>(vehicles[0]?.id ?? "");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return vehicles;
    const ql = q.toLowerCase();
    return vehicles.filter((v) =>
      `${v.brand} ${v.model}`.toLowerCase().includes(ql),
    );
  }, [vehicles, q]);

  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      {/* Sidebar list */}
      <aside className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 rounded-xl border-border/70 bg-card pl-9 text-[13px]"
            placeholder="Filtrer…"
          />
        </div>
        <ul className="space-y-1.5">
          {filtered.map((v) => {
            const score = checklistScore(v);
            const cover = v.vehicle_images?.[0];
            const active = v.id === selected?.id;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                    active
                      ? "border-foreground bg-foreground text-background shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.2)]"
                      : "border-border/60 bg-card hover:border-foreground/40",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 shrink-0 overflow-hidden rounded-lg",
                      active ? "bg-background/10" : "bg-muted",
                    )}
                  >
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={publicImageUrl(cover.storage_path)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium tracking-tight">
                      {v.brand} {v.model}
                    </p>
                    <p
                      className={cn(
                        "tabular text-[12px]",
                        active ? "text-background/70" : "text-muted-foreground",
                      )}
                    >
                      {v.year} · {formatPrice(v.price)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular",
                      active
                        ? "bg-background/15 text-background"
                        : score.ok === score.total
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {score.ok}/{score.total}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="rounded-xl border border-dashed border-border/70 bg-card px-3 py-6 text-center text-[12.5px] text-muted-foreground">
              <Megaphone className="mx-auto mb-1.5 h-4 w-4" />
              Aucun résultat
            </li>
          )}
        </ul>
      </aside>

      {/* Editor */}
      <div className="min-w-0">
        {selected ? (
          <ListingEditor key={selected.id} vehicle={selected} />
        ) : null}
      </div>
    </div>
  );
}
