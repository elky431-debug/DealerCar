"use client";

import { DivIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { formatPrice } from "@/lib/utils";
import type { MapVehicleItem } from "@/components/map/vehicle-popup";
import { VehiclePopup } from "@/components/map/vehicle-popup";

const markerIconCache = new Map<string, DivIcon>();

function priceMarkerIcon(price: number): DivIcon {
  const label = formatPrice(price);
  if (markerIconCache.has(label)) return markerIconCache.get(label)!;

  const icon = new DivIcon({
    className: "vehicle-price-marker",
    html: `<div style="background:#111827;color:#fff;border-radius:9999px;padding:4px 10px;font-size:12px;font-weight:600;box-shadow:0 8px 20px rgba(0,0,0,.25);white-space:nowrap;border:1px solid rgba(255,255,255,.1)">${label}</div>`,
    iconSize: [72, 28],
    iconAnchor: [36, 14],
  });
  markerIconCache.set(label, icon);
  return icon;
}

export function VehicleMarker({ vehicle }: { vehicle: MapVehicleItem }) {
  return (
    <Marker position={[vehicle.latitude, vehicle.longitude]} icon={priceMarkerIcon(vehicle.price)}>
      <Popup>
        <VehiclePopup vehicle={vehicle} />
      </Popup>
    </Marker>
  );
}
