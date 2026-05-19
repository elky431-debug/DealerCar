"use client";

import Image from "next/image";
import { publicBrandingUrl } from "@/lib/utils";
import type { NetworkGarageProfile } from "@/lib/types";

interface Props {
  garage: NetworkGarageProfile;
  onClick: () => void;
}

export function GarageCard({ garage, onClick }: Props) {
  const logoUrl = garage.logo_storage_path ? publicBrandingUrl(garage.logo_storage_path) : null;
  const bannerUrl = garage.banner_storage_path ? publicBrandingUrl(garage.banner_storage_path) : null;
  const count = garage.vehicles_count ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-24 bg-gradient-to-r from-brand/10 to-brand/5">
        {bannerUrl && <Image src={bannerUrl} alt="" fill className="object-cover" sizes="400px" />}
        <div className="absolute bottom-2 left-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-white shadow">
            {logoUrl ? (
              <Image src={logoUrl} alt="logo" width={40} height={40} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">🏢</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-3">
        <h3 className="mb-0.5 text-sm font-semibold text-gray-900">{garage.company_name}</h3>
        <p className="mb-2 text-xs text-gray-400">📍 {garage.location}</p>
        {garage.description && (
          <p className="mb-3 line-clamp-2 text-xs text-gray-500">{garage.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-brand">
            {count} véhicule{count > 1 ? "s" : ""} disponibles
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
            ✓ Actif
          </span>
        </div>
      </div>
    </button>
  );
}
