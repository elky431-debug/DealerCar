import Link from "next/link";
import Image from "next/image";
import { ImageIcon, MapPin, Gauge, ArrowUpRight } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import {
  formatMileage,
  formatPrice,
  publicImageUrl,
  cn,
} from "@/lib/utils";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
  type VehicleStatus,
  type VehicleWithRelations,
} from "@/lib/types";

interface VehicleCardProps {
  vehicle: VehicleWithRelations;
  href: string;
  showOwnerBadges?: boolean;
  showFavoriteButton?: boolean;
  isFavorite?: boolean;
}

export function VehicleCard({
  vehicle,
  href,
  showOwnerBadges = false,
  showFavoriteButton = false,
  isFavorite = false,
}: VehicleCardProps) {
  const cover = vehicle.vehicle_images?.[0];
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-foreground/15 hover:shadow-[0_24px_48px_-20px_rgba(15,23,42,0.18)]",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted">
        {cover ? (
          <Image
            src={publicImageUrl(cover.storage_path)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 via-black/0 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusPill status={vehicle.status} />
          {showOwnerBadges && (
            <>
              <SoftPill>{TYPE_LABELS[vehicle.type]}</SoftPill>
              <SoftPill highlight={vehicle.visibility === "network"}>
                {VISIBILITY_LABELS[vehicle.visibility]}
              </SoftPill>
            </>
          )}
        </div>

        <div className="absolute right-3 top-3 flex gap-1.5">
          {showFavoriteButton && (
            <FavoriteButton vehicleId={vehicle.id} initial={isFavorite} size="sm" />
          )}
        </div>

        <span
          aria-hidden
          className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-foreground text-background opacity-0 shadow-[0_8px_20px_-6px_hsl(var(--foreground)/0.4)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          <span className="shrink-0 text-[12px] font-medium tabular text-muted-foreground">
            {vehicle.year}
          </span>
        </div>

        <p className="text-[24px] font-semibold leading-none tabular tracking-tight text-foreground">
          {formatPrice(vehicle.price)}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 stroke-[1.75]" />
            <span className="tabular">{formatMileage(vehicle.mileage)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 stroke-[1.75]" />
            {vehicle.location}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SoftPill({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-tight ring-1 ring-inset shadow-sm backdrop-blur-md",
        highlight
          ? "bg-foreground text-background ring-foreground/20"
          : "bg-card/95 text-foreground ring-foreground/10",
      )}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: VehicleStatus }) {
  const dotClass: Record<VehicleStatus, string> = {
    available: "bg-emerald-500",
    reserved: "bg-amber-500",
    sold: "bg-slate-400",
  };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-foreground shadow-sm ring-1 ring-inset ring-foreground/10 backdrop-blur-md">
      <span className={cn("relative h-1.5 w-1.5 rounded-full", dotClass[status])}>
        <span
          className={cn(
            "absolute inset-0 animate-ping rounded-full opacity-60",
            dotClass[status],
          )}
        />
      </span>
      {STATUS_LABELS[status]}
    </span>
  );
}
