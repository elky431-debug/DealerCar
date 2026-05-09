"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMileage, formatPrice, publicImageUrl } from "@/lib/utils";

/** Infos concession affichées sur la carte (profil marchand). */
export interface MapDealerInfo {
  company_name: string;
  phone: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
}

export interface MapVehicleItem {
  id: string;
  dealer_id: string;
  dealer: MapDealerInfo;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  image: string | null;
}

export function VehiclePopup({ vehicle }: { vehicle: MapVehicleItem }) {
  return (
    <div className="w-[220px] space-y-2">
      <div className="h-24 overflow-hidden rounded-md bg-muted">
        {vehicle.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={publicImageUrl(vehicle.image)} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div>
        <p className="text-sm font-semibold">
          {vehicle.brand} {vehicle.model}
        </p>
        <p className="text-xs text-muted-foreground">
          {vehicle.year} · {formatMileage(vehicle.mileage)}
        </p>
        <p className="text-xs text-muted-foreground">{vehicle.location}</p>
        <p className="mt-1 text-sm font-semibold tabular">{formatPrice(vehicle.price)}</p>
      </div>
      <Link href={`/garage/vehicules/${vehicle.id}`} className="block">
        <Button size="sm" className="w-full">
          Voir la fiche
        </Button>
      </Link>
    </div>
  );
}
