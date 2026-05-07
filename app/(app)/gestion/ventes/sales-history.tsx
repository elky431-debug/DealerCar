"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";

type Sale = Pick<
  Vehicle,
  | "id"
  | "brand"
  | "model"
  | "year"
  | "mileage"
  | "price"
  | "purchase_price"
  | "sold_at"
  | "type"
  | "commission_type"
  | "commission_value"
  | "client_price"
  | "created_at"
>;

interface Props {
  sales: Sale[];
  defaults: { period?: string; sort?: string };
}

type SortKey = "date" | "margin";

function computeMargin(s: Sale): number | null {
  if (s.type === "depot") {
    if (!s.commission_value) return null;
    if (s.commission_type === "fixed") return Number(s.commission_value);
    if (s.commission_type === "percent") return (Number(s.price) * Number(s.commission_value)) / 100;
    return null;
  }
  if (s.purchase_price == null) return null;
  return Number(s.price) - Number(s.purchase_price);
}

function withinPeriod(soldAt: string | null, period: string): boolean {
  if (period === "all" || !period) return true;
  if (!soldAt) return false;
  const d = new Date(soldAt).getTime();
  const now = Date.now();
  if (period === "30j") return now - d <= 30 * 24 * 3600 * 1000;
  if (period === "90j") return now - d <= 90 * 24 * 3600 * 1000;
  if (period === "12m") return now - d <= 365 * 24 * 3600 * 1000;
  if (period === "year") return new Date(soldAt).getFullYear() === new Date().getFullYear();
  return true;
}

export function SalesHistory({ sales, defaults }: Props) {
  const [period, setPeriod] = useState(defaults.period ?? "all");
  const [sort, setSort] = useState<SortKey>((defaults.sort as SortKey) ?? "date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    return sales
      .filter((s) => withinPeriod(s.sold_at, period))
      .map((s) => ({ ...s, margin: computeMargin(s) }))
      .sort((a, b) => {
        if (sort === "margin") {
          const av = a.margin ?? -Infinity;
          const bv = b.margin ?? -Infinity;
          return sortDir === "asc" ? av - bv : bv - av;
        }
        const av = a.sold_at ? new Date(a.sold_at).getTime() : 0;
        const bv = b.sold_at ? new Date(b.sold_at).getTime() : 0;
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [sales, period, sort, sortDir]);

  // Aggregates
  const totalRevenue = filtered.reduce((s, x) => s + Number(x.price ?? 0), 0);
  const validMargins = filtered.filter((s) => s.margin != null).map((s) => Number(s.margin));
  const totalMargin = validMargins.reduce((a, b) => a + b, 0);
  const count = filtered.length;
  const avgMargin = validMargins.length ? totalMargin / validMargins.length : 0;

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Ventes" value={String(count)} />
        <KPI label="Chiffre d'affaires" value={formatPrice(totalRevenue)} />
        <KPI label="Marge totale" value={formatPrice(totalMargin)} accent="emerald" />
        <KPI label="Marge moyenne" value={formatPrice(avgMargin)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { v: "all", l: "Toutes périodes" },
          { v: "30j", l: "30 jours" },
          { v: "90j", l: "90 jours" },
          { v: "12m", l: "12 mois" },
          { v: "year", l: `${new Date().getFullYear()}` },
        ].map((p) => (
          <button
            key={p.v}
            type="button"
            onClick={() => setPeriod(p.v)}
            className={cn(
              "h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
              period === p.v
                ? "border-foreground bg-foreground text-background"
                : "border-border/70 bg-card text-foreground hover:border-foreground/40",
            )}
          >
            {p.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-3 py-2.5 text-left">Véhicule</th>
              <SortableTh
                label="Date de vente"
                active={sort === "date"}
                dir={sortDir}
                onClick={() => toggleSort("date")}
              />
              <th className="px-3 py-2.5 text-right">Prix d'achat</th>
              <th className="px-3 py-2.5 text-right">Prix de vente</th>
              <SortableTh
                label="Marge"
                align="right"
                active={sort === "margin"}
                dir={sortDir}
                onClick={() => toggleSort("margin")}
              />
              <th className="w-12 px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-12 text-center text-sm text-muted-foreground">
                  Aucune vente sur cette période.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/40 last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <Link href={`/garage/vehicules/${s.id}`} className="font-medium hover:underline">
                      {s.brand} {s.model}
                    </Link>{" "}
                    <span className="text-muted-foreground tabular">{s.year}</span>
                    {s.type === "depot" && (
                      <span className="ml-2 inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        Dépôt
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular text-muted-foreground">
                    {formatDate(s.sold_at)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular">
                    {s.type === "depot"
                      ? <span className="text-muted-foreground">—</span>
                      : s.purchase_price != null
                        ? formatPrice(Number(s.purchase_price))
                        : <span className="text-muted-foreground/70">non renseigné</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular">
                    {formatPrice(Number(s.price))}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {s.margin != null ? (
                      <span
                        className={cn(
                          "tabular font-semibold",
                          s.margin > 0
                            ? "text-emerald-600"
                            : s.margin < 0
                              ? "text-destructive"
                              : "text-foreground",
                        )}
                      >
                        {s.margin > 0 ? "+" : ""}
                        {formatPrice(s.margin)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setEditing(s)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Renseigner prix d'achat / date"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditDialog sale={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function KPI({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald";
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-[22px] font-semibold tabular tracking-tight",
          accent === "emerald" && "text-emerald-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SortableTh({
  label,
  align = "left",
  active,
  dir,
  onClick,
}: {
  label: string;
  align?: "left" | "right";
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className={cn("px-3 py-2.5", align === "right" ? "text-right" : "text-left")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        {active && (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}

function EditDialog({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [purchasePrice, setPurchasePrice] = useState(
    sale.purchase_price != null ? String(sale.purchase_price) : "",
  );
  const [soldAt, setSoldAt] = useState(sale.sold_at ? sale.sold_at.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const update: Record<string, unknown> = {};
    update.purchase_price = purchasePrice ? Number(purchasePrice) : null;
    update.sold_at = soldAt ? new Date(soldAt).toISOString() : null;
    const { error } = await supabase.from("vehicles").update(update).eq("id", sale.id);
    setBusy(false);
    if (error) {
      toast.error("Sauvegarde impossible", error.message);
      return;
    }
    toast.success("Vente mise à jour");
    onClose();
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[18px] font-semibold tracking-tight">
              {sale.brand} {sale.model}
            </h3>
            <p className="text-[13px] text-muted-foreground">
              Renseignez le prix d'achat et la date pour calculer la marge.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sale.type === "depot" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
            Pour un dépôt-vente, la marge correspond à la commission définie dans la fiche véhicule.
          </p>
        ) : (
          <Field label="Prix d'achat (€)">
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="Ex. 8000"
            />
          </Field>
        )}

        <Field label="Date de vente">
          <Input type="date" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="submit" loading={busy}>
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
