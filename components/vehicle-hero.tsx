import {
  Calendar,
  Gauge,
  MapPin,
  Tag,
  Building2,
  Globe,
  Lock,
} from "lucide-react";
import { cn, formatMileage, formatTitle } from "@/lib/utils";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
  type Vehicle,
} from "@/lib/types";

interface Props {
  vehicle: Pick<
    Vehicle,
    "brand" | "model" | "year" | "mileage" | "location" | "type" | "status" | "visibility"
  >;
  isOwner: boolean;
  actions?: React.ReactNode;
}

/**
 * Hero de la fiche véhicule.
 *
 * Conventions :
 *  - titre toujours en Title Case (formatTitle)
 *  - chips meta (année / km / ville) inline, lisibles, pas de surcharge
 *  - dot motif décoratif léger en fond, n'interfère pas avec la densité
 *  - actions au coin haut droit, ne casse pas le wrap mobile
 */
export function VehicleHero({ vehicle, isOwner, actions }: Props) {
  const title = `${formatTitle(vehicle.brand)} ${formatTitle(vehicle.model)}`.trim();

  const statusDot =
    vehicle.status === "available"
      ? "bg-success"
      : vehicle.status === "reserved"
      ? "bg-warning"
      : "bg-foreground/40";

  return (
    <header className="relative isolate overflow-hidden">
      {/* Décor : dot grid + gradient soft */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.6] dark:opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground) / 0.07) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-primary/[0.05] to-transparent"
      />

      <div className="px-5 pt-8 sm:px-10 sm:pt-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            {/* Eyebrow : marque + type véhicule */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Eyebrow icon={<Building2 className="h-3 w-3" />}>
                {formatTitle(vehicle.brand)}
              </Eyebrow>
              <Eyebrow icon={<Tag className="h-3 w-3" />}>
                {TYPE_LABELS[vehicle.type]}
              </Eyebrow>
              {isOwner && (
                <Eyebrow
                  icon={
                    vehicle.visibility === "network" ? (
                      <Globe className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )
                  }
                >
                  {VISIBILITY_LABELS[vehicle.visibility]}
                </Eyebrow>
              )}
            </div>

            <h1 className="display-font text-balance text-[32px] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-[40px]">
              {title}
            </h1>

            {/* Status + meta */}
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 font-medium text-foreground shadow-sm backdrop-blur">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", statusDot)}
                  aria-hidden
                />
                {STATUS_LABELS[vehicle.status]}
              </span>
              <Sep />
              <Meta icon={<Calendar className="h-3.5 w-3.5" />}>{vehicle.year}</Meta>
              <Sep />
              <Meta icon={<Gauge className="h-3.5 w-3.5" />}>
                {formatMileage(vehicle.mileage)}
              </Meta>
              <Sep />
              <Meta icon={<MapPin className="h-3.5 w-3.5" />}>{vehicle.location}</Meta>
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Eyebrow({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground shadow-sm backdrop-blur">
      {icon}
      {children}
    </span>
  );
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="font-medium text-foreground">{children}</span>
    </span>
  );
}

function Sep() {
  return (
    <span aria-hidden className="text-muted-foreground/40">
      ·
    </span>
  );
}
