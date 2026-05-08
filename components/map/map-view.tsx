"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useState } from "react";
import type { PointFeature } from "supercluster";
import Supercluster from "supercluster";
import { DivIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { publicImageUrl } from "@/lib/utils";
import type { MapVehicleItem } from "@/components/map/vehicle-popup";
import { VehicleMarker } from "@/components/map/vehicle-marker";

type ClusterProps = { cluster: true; point_count: number; point_count_abbreviated: number };
type MapPoint = PointFeature<ClusterProps | { cluster: false; vehicle: MapVehicleItem }>;
type BBox = [number, number, number, number];

interface Filters {
  q: string;
  priceMin: string;
  priceMax: string;
  type: "" | "stock" | "depot";
  radiusKm: string;
}

function BoundsListener({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: BBox, zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend() {
      const b = map.getBounds();
      onBoundsChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], map.getZoom());
    },
    zoomend() {
      const b = map.getBounds();
      onBoundsChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], map.getZoom());
    },
  });

  useEffect(() => {
    const b = map.getBounds();
    onBoundsChange([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], map.getZoom());
  }, [map, onBoundsChange]);

  return null;
}

function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  return (
    <Button
      size="sm"
      variant="secondary"
      className="gap-1.5"
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const lat = coords.latitude;
            const lng = coords.longitude;
            map.setView([lat, lng], Math.max(11, map.getZoom()));
            onLocate(lat, lng);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 },
        );
      }}
    >
      <LocateFixed className="h-4 w-4" />
      Me localiser
    </Button>
  );
}

export function MapView() {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    priceMin: "",
    priceMax: "",
    type: "",
    radiusKm: "",
  });
  const [bounds, setBounds] = useState<BBox>([-5.2, 41.2, 9.7, 51.2]);
  const [zoom, setZoom] = useState(6);
  const [items, setItems] = useState<MapVehicleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locCenter, setLocCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("/api/map/vehicles", window.location.origin);
        url.searchParams.set("minLng", String(bounds[0]));
        url.searchParams.set("minLat", String(bounds[1]));
        url.searchParams.set("maxLng", String(bounds[2]));
        url.searchParams.set("maxLat", String(bounds[3]));
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "250");
        if (filters.q) url.searchParams.set("q", filters.q);
        if (filters.priceMin) url.searchParams.set("priceMin", filters.priceMin);
        if (filters.priceMax) url.searchParams.set("priceMax", filters.priceMax);
        if (filters.type) url.searchParams.set("type", filters.type);
        if (filters.radiusKm && locCenter) {
          url.searchParams.set("radiusKm", filters.radiusKm);
          url.searchParams.set("centerLat", String(locCenter.lat));
          url.searchParams.set("centerLng", String(locCenter.lng));
        }

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) return;
        const payload = (await res.json()) as { items: MapVehicleItem[] };
        setItems(payload.items ?? []);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [bounds, filters, locCenter]);

  const points = useMemo<MapPoint[]>(
    () =>
      items.map((vehicle) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [vehicle.longitude, vehicle.latitude],
        },
        properties: { cluster: false, vehicle },
      })),
    [items],
  );

  const clusterIndex = useMemo(
    () =>
      new Supercluster<ClusterProps | { cluster: false; vehicle: MapVehicleItem }>({
        radius: 55,
        maxZoom: 18,
      }).load(points),
    [points],
  );

  const clustered = useMemo(() => clusterIndex.getClusters(bounds, zoom), [clusterIndex, bounds, zoom]);

  return (
    <div className="grid h-[calc(100vh-168px)] gap-4 lg:grid-cols-[340px_1fr]">
      <aside className="order-2 flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-3 lg:order-1">
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Marque, modèle…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Prix min"
              type="number"
              value={filters.priceMin}
              onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
            />
            <Input
              placeholder="Prix max"
              type="number"
              value={filters.priceMax}
              onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
            >
              <option value="">Type</option>
              <option value="stock">Stock</option>
              <option value="depot">Dépôt</option>
            </Select>
            <Select
              value={filters.radiusKm}
              onChange={(e) => setFilters((f) => ({ ...f, radiusKm: e.target.value }))}
            >
              <option value="">Rayon</option>
              <option value="100">&lt; 100 km</option>
              <option value="200">&lt; 200 km</option>
              <option value="500">&lt; 500 km</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
          <p className="mb-2 text-xs text-muted-foreground">
            {loading ? "Chargement..." : `${items.length} véhicule(s) dans la zone`}
          </p>
          <ul className="space-y-2">
            {items.map((v) => (
              <li key={v.id} className="rounded-xl border border-border/60 bg-background p-2.5">
                <a href={`/garage/vehicules/${v.id}`} className="flex gap-2">
                  <div className="h-12 w-16 overflow-hidden rounded-md bg-muted">
                    {v.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={publicImageUrl(v.image)} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {v.brand} {v.model}
                    </p>
                    <p className="text-xs text-muted-foreground">{v.location}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="order-1 min-h-0 overflow-hidden rounded-2xl border border-border/60 lg:order-2">
        <MapContainer center={[46.5, 2.5]} zoom={6} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsListener
            onBoundsChange={(bbox, z) => {
              setBounds(bbox);
              setZoom(z);
            }}
          />
          <div className="leaflet-top leaflet-right">
            <div className="leaflet-control">
              <LocateButton onLocate={(lat, lng) => setLocCenter({ lat, lng })} />
            </div>
          </div>

          {clustered.map((feature) => {
            const [lng, lat] = feature.geometry.coordinates as [number, number];
            if (feature.properties.cluster) {
              const count = feature.properties.point_count;
              return (
                <Marker
                  key={`cluster-${feature.id}`}
                  position={[lat, lng]}
                  icon={
                    new DivIcon({
                      className: "vehicle-cluster",
                      html: `<div style="background:#111827;color:#fff;border-radius:9999px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff">${count}</div>`,
                      iconSize: [38, 38],
                      iconAnchor: [19, 19],
                    })
                  }
                />
              );
            }
            return (
              <VehicleMarker
                key={`vehicle-${feature.properties.vehicle.id}`}
                vehicle={feature.properties.vehicle}
              />
            );
          })}
        </MapContainer>
      </section>
    </div>
  );
}
