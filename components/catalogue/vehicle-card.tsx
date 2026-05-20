"use client";

import Image from "next/image";
import Link from "next/link";
import { publicImageUrl } from "@/lib/utils";

interface Props {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
  };
  imagePath?: string;
}

export function VehicleCard({ vehicle, imagePath }: Props) {
  const imageUrl = imagePath ? publicImageUrl(imagePath) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🚗
          </div>
        )}
        <div className="absolute left-2.5 top-2.5">
          <span className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white">
            Disponible
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">
          {vehicle.brand} {vehicle.model}
        </h3>
        <div className="mb-3 flex items-center gap-3 text-xs text-gray-400">
          <span>{vehicle.year}</span>
          <span>·</span>
          <span>{vehicle.mileage?.toLocaleString("fr-FR")} km</span>
        </div>
        <p className="mb-4 text-lg font-bold text-gray-900">
          {vehicle.price?.toLocaleString("fr-FR")} €
        </p>

        <div className="relative">
          <div className="pointer-events-none mb-2 select-none rounded-lg bg-gray-50 p-3 blur-sm">
            <p className="text-xs font-medium text-gray-700">Garage Martin · Lyon 69</p>
            <p className="text-xs text-gray-400">06 XX XX XX XX · contact@garage.fr</p>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-white/60 backdrop-blur-[1px]">
            <span className="mb-1 text-base">🔒</span>
            <Link
              href="/register"
              className="text-xs font-semibold text-brand underline underline-offset-2 transition-colors hover:text-brand/80"
            >
              S&apos;inscrire pour voir le vendeur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
