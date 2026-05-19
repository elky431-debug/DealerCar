"use client";

import "leaflet/dist/leaflet.css";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { NetworkGarageProfile } from "@/lib/types";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

interface Props {
  garages: NetworkGarageProfile[];
  onSelect: (garage: NetworkGarageProfile) => void;
}

export function GaragesMap({ garages, onSelect }: Props) {
  const garagesWithCoords = useMemo(
    () => garages.filter((g) => g.latitude != null && g.longitude != null),
    [garages],
  );

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-100 shadow-sm"
      style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
    >
      <MapContainer center={[46.5, 2.3]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {garagesWithCoords.map((garage) => (
          <Marker key={garage.id} position={[garage.latitude!, garage.longitude!]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{garage.company_name}</p>
                <p className="text-xs text-gray-500">{garage.location}</p>
                <p className="mt-1 text-xs text-brand">
                  {garage.vehicles_count ?? 0} véhicules dispo
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(garage)}
                  className="mt-2 w-full rounded-md bg-brand py-1 text-xs text-white"
                >
                  Voir le profil →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
