import { TrendingUp, TrendingDown, Calendar, Clock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";
import { STATUS_LABELS, type Vehicle } from "@/lib/types";

interface Props {
  vehicle: Pick<
    Vehicle,
    | "price"
    | "purchase_price"
    | "status"
    | "visibility"
    | "created_at"
    | "sold_at"
  >;
  isOwner: boolean;
}

/**
 * Carte Prix "hero" pour la sidebar de fiche véhicule.
 * Affiche prix, statut, et selon contexte :
 *   - owner : marge brute si purchase_price connu, jours en stock, visibilité
 *   - public : note de contact
 */
export function VehiclePriceCard({ vehicle, isOwner }: Props) {
  const status = vehicle.status;

  // Marge brute si owner + purchase_price renseigné
  const marginEur =
    isOwner && vehicle.purchase_price != null
      ? Number(vehicle.price) - Number(vehicle.purchase_price)
      : null;
  const marginPct =
    marginEur !== null && Number(vehicle.purchase_price) > 0
      ? Math.round((marginEur / Number(vehicle.purchase_price)) * 100)
      : null;

  // Jours en stock (vendu = jusqu'à sold_at, sinon jusqu'à aujourd'hui)
  const start = new Date(vehicle.created_at).getTime();
  const end = vehicle.sold_at
    ? new Date(vehicle.sold_at).getTime()
    : Date.now();
  const daysInStock = Math.max(1, Math.round((end - start) / 86_400_000));

  return (
    <Card className="relative overflow-hidden">
      {/* Décor : gradient diagonal très léger */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-60 dark:opacity-40"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, hsl(var(--primary) / 0.08), transparent 60%)",
        }}
      />

      <CardContent className="relative space-y-4 p-6">
        {/* Header : statut */}
        <div className="flex items-center justify-between">
          <StatusPill status={status} />
          {isOwner && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.12em]",
                vehicle.visibility === "network"
                  ? "text-foreground/80"
                  : "text-muted-foreground/80",
              )}
            >
              {vehicle.visibility === "network" ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              {vehicle.visibility === "network" ? "Réseau" : "Privé"}
            </span>
          )}
        </div>

        {/* Prix principal */}
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Prix de vente
          </p>
          <p className="display-font mt-1 text-[34px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        {/* Marge owner */}
        {isOwner && marginEur !== null && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                marginEur >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {marginEur >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                Marge brute
              </p>
              <p className="text-[13px] font-semibold tabular-nums text-foreground">
                {marginEur >= 0 ? "+" : ""}
                {formatPrice(marginEur)}
                {marginPct !== null && (
                  <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
                    ({marginPct >= 0 ? "+" : ""}
                    {marginPct}%)
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Stat : jours en stock (owner uniquement) */}
        {isOwner && (
          <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
            {status === "sold" ? (
              <>
                <Calendar className="h-3.5 w-3.5" />
                Vendu après{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {daysInStock} j
                </span>
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground tabular-nums">
                  {daysInStock} j
                </span>{" "}
                en stock
              </>
            )}
          </div>
        )}

        {/* Note pour le visiteur */}
        {!isOwner && (
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Prix annoncé par le marchand. Contactez-le pour confirmer la
            disponibilité.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusPill({ status }: { status: Vehicle["status"] }) {
  const styles =
    status === "available"
      ? "bg-success/12 text-success ring-success/25"
      : status === "reserved"
      ? "bg-warning/12 text-warning ring-warning/25"
      : "bg-foreground/8 text-muted-foreground ring-border";

  const dot =
    status === "available"
      ? "bg-success"
      : status === "reserved"
      ? "bg-warning"
      : "bg-muted-foreground/60";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset",
        styles,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", dot)}
        aria-hidden
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
