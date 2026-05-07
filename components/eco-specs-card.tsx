import { Leaf, Fuel, Zap, Gauge, Euro, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  avg,
  estimateAnnualFuelCost,
  getEnergyClass,
  ENERGY_CLASS_COLORS,
} from "@/lib/vehicle-specs";
import type { SpecMatchResult } from "@/lib/types";

interface Props {
  match: SpecMatchResult;
}

/**
 * Carte d'enrichissement éco/perf affichée sur la fiche véhicule.
 *
 * - Si pas de match : la carte ne s'affiche pas (return null).
 * - Si match "fuzzy" : badge "Approx." pour transparence.
 * - Couleurs sémantiques (success/warning/destructive) → adaptées dark mode.
 */
export function EcoSpecsCard({ match }: Props) {
  if (!match.spec) return null;
  const spec = match.spec;

  const co2 = avg(spec.co2_mixed_min, spec.co2_mixed_max);
  const conso = avg(spec.conso_mixed_min, spec.conso_mixed_max);
  const consoElec = avg(spec.conso_elec_min, spec.conso_elec_max);
  const autonomy = avg(spec.autonomy_min_km, spec.autonomy_max_km);
  const energyClass = getEnergyClass(co2);

  const cost = estimateAnnualFuelCost({
    fuelType: spec.fuel_type,
    consoMixedAvg: conso,
    consoElecAvg: consoElec,
  });

  const isElectric =
    spec.fuel_type.includes("ELECTRIC") || spec.fuel_type === "EL";
  const isHybrid = spec.fuel_type.includes("HYBRID");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-[14px]">
            <Leaf className="h-4 w-4 text-success" />
            Performance & coûts
          </CardTitle>
          {match.confidence === "fuzzy" && (
            <span
              title="Fiche approximative — basée sur la marque et le modèle, sans correspondance exacte."
              className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-warning ring-1 ring-inset ring-warning/30"
            >
              <AlertCircle className="h-3 w-3" />
              Approx.
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-[12px] text-muted-foreground">
          {spec.commercial_desc}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Classe énergie + CO2 — bloc principal */}
        {energyClass && co2 !== null && (
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[22px] font-bold leading-none text-white shadow-[0_2px_6px_-1px_rgba(0,0,0,0.25)] ring-1 ring-black/5",
                ENERGY_CLASS_COLORS[energyClass],
              )}
              title={`Classe énergie ${energyClass}`}
              aria-label={`Classe énergie ${energyClass}`}
            >
              {energyClass}
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Émissions CO₂
              </p>
              <p className="mt-0.5 flex items-baseline gap-1.5 text-[20px] font-semibold leading-none tracking-tight tabular-nums">
                {Math.round(co2)}
                <span className="text-[12px] font-normal text-muted-foreground">
                  g/km
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Métriques en grille */}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-border/50 pt-3 text-sm">
          {conso !== null && !isElectric && (
            <Metric
              icon={<Fuel className="h-3.5 w-3.5" />}
              label="Conso. mixte"
              value={`${conso.toFixed(1)} L/100`}
            />
          )}

          {consoElec !== null && (
            <Metric
              icon={<Zap className="h-3.5 w-3.5" />}
              label="Conso. élec."
              value={`${consoElec.toFixed(1)} kWh/100`}
            />
          )}

          {autonomy !== null && (isElectric || isHybrid) && (
            <Metric
              icon={<Gauge className="h-3.5 w-3.5" />}
              label="Autonomie"
              value={`${autonomy} km`}
            />
          )}

          {spec.fiscal_power && (
            <Metric
              icon={<Gauge className="h-3.5 w-3.5" />}
              label="Puiss. fiscale"
              value={`${spec.fiscal_power} CV`}
            />
          )}
        </dl>

        {/* Coût annuel estimé */}
        {cost && (
          <div className="rounded-xl bg-foreground/[0.03] p-3 ring-1 ring-inset ring-border/50">
            <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              <Euro className="h-3 w-3" />
              Coût carburant estimé
            </p>
            <p className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-[24px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                {cost.euroPerYear.toLocaleString("fr-FR")} €
              </span>
              <span className="text-[12px] text-muted-foreground">/ an</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Base 13 000 km/an · {cost.euroPer100km} €/100 km
            </p>
          </div>
        )}

        {/* Bonus / Malus écologique */}
        {spec.bonus_malus_amount != null && spec.bonus_malus_amount !== 0 && (
          <div
            className={cn(
              "rounded-xl p-3 ring-1 ring-inset",
              spec.bonus_malus_amount < 0
                ? "bg-success/8 ring-success/25"
                : "bg-destructive/8 ring-destructive/25",
            )}
          >
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {spec.bonus_malus_amount < 0
                ? "Bonus écologique"
                : "Malus écologique"}
            </p>
            <p
              className={cn(
                "mt-1 text-[18px] font-semibold leading-none tracking-tight tabular-nums",
                spec.bonus_malus_amount < 0 ? "text-success" : "text-destructive",
              )}
            >
              {spec.bonus_malus_amount < 0 ? "" : "+"}
              {spec.bonus_malus_amount.toLocaleString("fr-FR")} €
            </p>
          </div>
        )}

        <p className="pt-1 text-[10px] tracking-tight text-muted-foreground/70">
          Source : ADEME Car Labelling
          {spec.source_year ? ` · ${spec.source_year}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        <span className="text-muted-foreground/70">{icon}</span>
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[14px] font-semibold tracking-tight tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
