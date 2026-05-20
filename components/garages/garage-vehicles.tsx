"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { publicImageUrl } from "@/lib/utils";

interface GarageVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  vehicle_images: { storage_path: string }[] | null;
}

interface Props {
  dealerId: string;
}

export function GarageVehicles({ dealerId }: Props) {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, mileage, price, vehicle_images(storage_path)")
        .eq("dealer_id", dealerId)
        .eq("visibility", "network")
        .eq("status", "available")
        .limit(6);
      setVehicles((data as GarageVehicle[]) ?? []);
      setLoading(false);
    };
    void fetchVehicles();
  }, [dealerId]);

  if (loading) {
    return <p className="py-4 text-center text-xs text-gray-400">Chargement…</p>;
  }

  if (!vehicles.length) {
    return (
      <p className="py-4 text-center text-xs text-gray-400">Aucun véhicule partagé sur le réseau</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {vehicles.map((v) => {
        const cover = v.vehicle_images?.[0]?.storage_path;
        return (
          <div key={v.id} className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            <div className="flex h-20 items-center justify-center bg-gray-200 text-2xl">
              {cover ? (
                <Image
                  src={publicImageUrl(cover)}
                  alt={`${v.brand} ${v.model}`}
                  width={120}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                "🚗"
              )}
            </div>
            <div className="p-2">
              <p className="truncate text-xs font-semibold">
                {v.brand} {v.model}
              </p>
              <p className="text-[11px] text-gray-400">
                {v.year} · {v.mileage?.toLocaleString("fr-FR")} km
              </p>
              <p className="mt-0.5 text-xs font-bold text-brand">
                {v.price?.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
