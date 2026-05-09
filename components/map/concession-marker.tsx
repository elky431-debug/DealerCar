"use client";

import { DivIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import type { MapDealerInfo } from "@/components/map/vehicle-popup";

export interface MapConcessionPin {
  dealerId: string;
  dealer: MapDealerInfo;
  latitude: number;
  longitude: number;
  vehicleCount: number;
}

const concessionIcon = new DivIcon({
  className: "concession-marker",
  html: `<div style="background:#0f766e;color:#fff;border-radius:10px;padding:5px 9px;font-size:11px;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.28);border:2px solid #fff;white-space:nowrap">Concession</div>`,
  iconSize: [88, 28],
  iconAnchor: [44, 14],
});

export function ConcessionMarker({
  pin,
  onViewVehicles,
}: {
  pin: MapConcessionPin;
  onViewVehicles: (dealerId: string) => void;
}) {
  const { dealer } = pin;
  return (
    <Marker position={[pin.latitude, pin.longitude]} icon={concessionIcon} zIndexOffset={800}>
      <Popup>
        <div className="w-[220px] space-y-2">
          <div>
            <p className="text-sm font-semibold leading-tight">{dealer.company_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{dealer.location}</p>
            {dealer.phone ? (
              <a href={`tel:${dealer.phone}`} className="mt-1 block text-xs font-medium text-teal-700">
                {dealer.phone}
              </a>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">
              {pin.vehicleCount} véhicule{pin.vehicleCount > 1 ? "s" : ""} dans la zone
            </p>
          </div>
          <Button size="sm" className="w-full" type="button" onClick={() => onViewVehicles(pin.dealerId)}>
            Voir les véhicules
          </Button>
        </div>
      </Popup>
    </Marker>
  );
}
