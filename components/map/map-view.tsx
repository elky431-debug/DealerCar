"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { LocateFixed, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { publicImageUrl } from "@/lib/utils";
import type { MapVehicleItem } from "@/components/map/vehicle-popup";
import { ConcessionMarker, type MapConcessionPin } from "@/components/map/concession-marker";
import { VehicleMarker } from "@/components/map/vehicle-marker";

type ClusterProps = { cluster: true; point_count: number; point_count_abbreviated: number };
type MapPoint = PointFeature<ClusterProps | { cluster: false; vehicle: MapVehicleItem }>;
type BBox = [number, number, number, number];

/** Écarte le pin concession du nuage de marqueurs-prix (même marchand). */
function offsetConcessionPosition(lat: number, lng: number, dealerId: string): [number, number] {
  let h = 0;
  for (let i = 0; i < dealerId.length; i++) h = (h + dealerId.charCodeAt(i) * (i + 1)) % 997;
  const angle = (h / 997) * 2 * Math.PI;
  const d = 0.00065;
  const dLat = d * Math.cos(angle);
  const dLng = (d * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180);
  return [lat + dLat, lng + dLng];
}

interface Filters {
  q: string;
  city: string;
  priceMin: string;
  priceMax: string;
  type: "" | "stock" | "depot";
  radiusKm: string;
}

function isSqlMigrationHint(message: string): boolean {
  return (
    message.includes("colonnes GPS") ||
    message.includes("migration-map.sql") ||
    message.includes("migration-v7") ||
    message.includes("migration-v8")
  );
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
    // Intentionnel : on ne dépend pas de onBoundsChange (voir MapView : handler stable via useCallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}

function FlyToCoords({
  target,
  onDone,
}: {
  target: { lat: number; lng: number; zoom: number } | null;
  onDone: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.setView([target.lat, target.lng], target.zoom);
    onDone();
  }, [target, map, onDone]);
  return null;
}

function LocateButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
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
    </button>
  );
}

export function MapView({ mapMigrationSql = "" }: { mapMigrationSql?: string }) {
  const [filters, setFilters] = useState<Filters>({
    q: "",
    city: "",
    priceMin: "",
    priceMax: "",
    type: "",
    radiusKm: "",
  });
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [bounds, setBounds] = useState<BBox>([-5.2, 41.2, 9.7, 51.2]);
  const [zoom, setZoom] = useState(6);
  const [items, setItems] = useState<MapVehicleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locCenter, setLocCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [dealerFilterId, setDealerFilterId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mapHint, setMapHint] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [showVehiclesOnMap, setShowVehiclesOnMap] = useState(true);
  const [showConcessionsOnMap, setShowConcessionsOnMap] = useState(true);
  const [includeMine, setIncludeMine] = useState(false);

  const handleBoundsChange = useCallback((bbox: BBox, z: number) => {
    setBounds((prev) => (prev.every((v, i) => Math.abs(v - bbox[i]) < 1e-9) ? prev : bbox));
    setZoom((prev) => (prev === z ? prev : z));
  }, []);

  const consumeFlyTo = useCallback(() => setFlyTo(null), []);

  async function centerMapOnCity() {
    const q = filters.city.trim();
    if (!q) return;
    try {
      const url = new URL("/api/geocode", window.location.origin);
      url.searchParams.set("location", q);
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = (await res.json()) as { latitude?: number | null; longitude?: number | null };
      if (data.latitude == null || data.longitude == null) return;
      setFlyTo({ lat: data.latitude, lng: data.longitude, zoom: 11 });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      let abortedByUnmount = false;
      try {
        const url = new URL("/api/map/vehicles", window.location.origin);
        url.searchParams.set("minLng", String(bounds[0]));
        url.searchParams.set("minLat", String(bounds[1]));
        url.searchParams.set("maxLng", String(bounds[2]));
        url.searchParams.set("maxLat", String(bounds[3]));
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "250");
        if (filters.q) url.searchParams.set("q", filters.q);
        if (filters.city.trim()) url.searchParams.set("city", filters.city.trim());
        if (filters.priceMin) url.searchParams.set("priceMin", filters.priceMin);
        if (filters.priceMax) url.searchParams.set("priceMax", filters.priceMax);
        if (filters.type) url.searchParams.set("type", filters.type);
        if (filters.radiusKm && locCenter) {
          url.searchParams.set("radiusKm", filters.radiusKm);
          url.searchParams.set("centerLat", String(locCenter.lat));
          url.searchParams.set("centerLng", String(locCenter.lng));
        }
        if (includeMine) url.searchParams.set("includeMine", "1");

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setFetchError(body.error ?? `Erreur ${res.status}`);
          setMapHint(null);
          setItems([]);
          return;
        }
        setFetchError(null);
        const payload = (await res.json()) as { items: MapVehicleItem[]; warning?: string; hint?: string };
        setMapHint(
          typeof payload.warning === "string"
            ? payload.warning
            : typeof payload.hint === "string"
              ? payload.hint
              : null,
        );
        const next = payload.items ?? [];
        setItems(next);
        setDealerFilterId((prev) => (prev && next.some((v) => v.dealer_id === prev) ? prev : null));
      } catch (e) {
        const isAbort =
          (e instanceof DOMException && e.name === "AbortError") ||
          (e instanceof Error && e.name === "AbortError");
        if (isAbort) {
          abortedByUnmount = true;
          return;
        }
        setFetchError(e instanceof Error ? e.message : "Erreur réseau");
        setMapHint(null);
        setItems([]);
      } finally {
        if (!abortedByUnmount) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [bounds, filters, locCenter, includeMine]);

  const dealerPins = useMemo<MapConcessionPin[]>(() => {
    const byDealer = new Map<string, MapVehicleItem[]>();
    for (const v of items) {
      const list = byDealer.get(v.dealer_id) ?? [];
      list.push(v);
      byDealer.set(v.dealer_id, list);
    }
    const pins: MapConcessionPin[] = [];
    for (const [dealerId, vehs] of byDealer) {
      const dealer = vehs[0]!.dealer;
      let lat = dealer.latitude;
      let lng = dealer.longitude;
      if (lat == null || lng == null) {
        lat = vehs.reduce((s, x) => s + x.latitude, 0) / vehs.length;
        lng = vehs.reduce((s, x) => s + x.longitude, 0) / vehs.length;
      } else {
        lat = Number(lat);
        lng = Number(lng);
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const [dispLat, dispLng] = offsetConcessionPosition(lat, lng, dealerId);
      pins.push({
        dealerId,
        dealer,
        latitude: dispLat,
        longitude: dispLng,
        vehicleCount: vehs.length,
      });
    }
    return pins;
  }, [items]);

  const filteredItems = useMemo(
    () => (dealerFilterId ? items.filter((v) => v.dealer_id === dealerFilterId) : items),
    [items, dealerFilterId],
  );

  const filteredDealerName = dealerFilterId
    ? items.find((v) => v.dealer_id === dealerFilterId)?.dealer.company_name
    : null;

  const points = useMemo<MapPoint[]>(
    () =>
      showVehiclesOnMap
        ? items.map((vehicle) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [vehicle.longitude, vehicle.latitude],
            },
            properties: { cluster: false, vehicle },
          }))
        : [],
    [items, showVehiclesOnMap],
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

  function toggleVehiclesOnMap(next: boolean) {
    if (!next && !showConcessionsOnMap) return;
    setShowVehiclesOnMap(next);
  }

  function toggleConcessionsOnMap(next: boolean) {
    if (!next && !showVehiclesOnMap) return;
    setShowConcessionsOnMap(next);
  }

  const fieldInput =
    "w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-blue-300 focus:bg-white transition-colors";
  const fieldInputCompact =
    "px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-blue-300 transition-colors";
  const fieldSelect =
    "px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-blue-300 transition-colors cursor-pointer";

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-0 flex-1 overflow-hidden">
      <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-4 pb-3 pt-4">
          <div className="mb-1 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Carte</p>
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Véhicules réseau</h2>
        </div>
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              className={`${fieldInput} h-auto pl-9 shadow-none ring-0`}
              placeholder="Marque, modèle…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
        </div>

        <div className="my-1 h-px bg-gray-100" />

        <div className="px-4 py-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Localisation
          </p>
          <div className="flex gap-2">
            <Input
              id="map-city"
              className={`min-w-0 flex-1 ${fieldInputCompact} h-auto shadow-none ring-0`}
              placeholder="ex. Lyon, Paris, 33000…"
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void centerMapOnCity();
              }}
            />
            <button
              type="button"
              title="Centrer la carte sur cette ville"
              disabled={!filters.city.trim()}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void centerMapOnCity()}
            >
              <MapPin className="h-4 w-4" />
              Centrer
            </button>
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Rayon ~50 km autour de la ville</p>
        </div>

        <div className="my-1 h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <Input
            placeholder="Prix min"
            type="number"
            className={`${fieldInputCompact} h-auto shadow-none ring-0`}
            value={filters.priceMin}
            onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
          />
          <Input
            placeholder="Prix max"
            type="number"
            className={`${fieldInputCompact} h-auto shadow-none ring-0`}
            value={filters.priceMax}
            onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
          />
        </div>

        <div className="my-1 h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <Select
            className={`${fieldSelect} h-auto shadow-none ring-0`}
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
          >
            <option value="">Type</option>
            <option value="stock">Stock</option>
            <option value="depot">Dépôt</option>
          </Select>
          <Select
            className={`${fieldSelect} h-auto shadow-none ring-0`}
            value={filters.radiusKm}
            onChange={(e) => setFilters((f) => ({ ...f, radiusKm: e.target.value }))}
          >
            <option value="">Rayon</option>
            <option value="100">&lt; 100 km</option>
            <option value="200">&lt; 200 km</option>
            <option value="500">&lt; 500 km</option>
          </Select>
        </div>

        <div className="my-1 h-px bg-gray-100" />

        <div className="px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Afficher sur la carte
          </p>
          <label className="group flex cursor-pointer items-center gap-2.5 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
              checked={showVehiclesOnMap}
              onChange={(e) => toggleVehiclesOnMap(e.target.checked)}
            />
            <span className="text-sm text-gray-700 transition-colors group-hover:text-gray-900">
              Véhicules (prix et regroupements)
            </span>
          </label>
          <label className="group flex cursor-pointer items-center gap-2.5 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
              checked={showConcessionsOnMap}
              onChange={(e) => toggleConcessionsOnMap(e.target.checked)}
            />
            <span className="text-sm text-gray-700 transition-colors group-hover:text-gray-900">
              Concessions (partenaires)
            </span>
          </label>
          <label className="group flex cursor-pointer items-center gap-2.5 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-600"
              checked={includeMine}
              onChange={(e) => setIncludeMine(e.target.checked)}
            />
            <span className="text-sm text-gray-700 transition-colors group-hover:text-gray-900">
              Voir aussi mes véhicules (privés / réservés, avec GPS)
            </span>
          </label>
        </div>

        <div className="my-1 h-px bg-gray-100" />

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          {dealerFilterId && filteredDealerName ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-teal-200/80 bg-teal-50/80 px-2.5 py-2 text-xs dark:border-teal-900/50 dark:bg-teal-950/40">
              <span className="min-w-0 truncate font-medium text-teal-900 dark:text-teal-100">
                {filteredDealerName}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 font-medium text-teal-800 underline-offset-2 hover:underline dark:text-teal-200"
                onClick={() => setDealerFilterId(null)}
              >
                Tout afficher
              </button>
            </div>
          ) : null}
          {mapHint ? (
            <p className="mb-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              {mapHint}
            </p>
          ) : null}
          {fetchError ? (
            <div className="mb-2 space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
              <p>{fetchError}</p>
              {mapMigrationSql && isSqlMigrationHint(fetchError) ? (
                <div className="space-y-2 border-t border-destructive/25 pt-2 text-foreground">
                  <p className="text-[11px] text-muted-foreground">
                    <strong className="text-foreground">Étapes :</strong> Supabase → ton projet →{" "}
                    <a
                      className="font-medium underline underline-offset-2"
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tableau Supabase → SQL Editor
                    </a>{" "}
                    → colle le script ci-dessous → <strong>Run</strong> → recharge cette page puis
                    ré-enregistre un véhicule ou « Mon garage ».
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(mapMigrationSql);
                          setSqlCopied(true);
                          setTimeout(() => setSqlCopied(false), 2500);
                        } catch {
                          setSqlCopied(false);
                        }
                      }}
                    >
                      {sqlCopied ? "Copié" : "Copier le script SQL"}
                    </Button>
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-md border border-border/60 bg-muted/50 p-2 text-[10px] leading-relaxed text-foreground">
                    {mapMigrationSql}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
          {dealerFilterId && !loading && !fetchError ? (
            <p className="mb-2 text-xs text-gray-500">
              {filteredItems.length} véhicule(s) — cette concession
            </p>
          ) : null}
          <ul className="space-y-2">
            {filteredItems.map((v) => (
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

        <div className="mt-auto border-t border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium text-gray-500">
            <span className="font-semibold text-gray-900">{items.length}</span> véhicule(s) sur la carte ·{" "}
            <span className="font-semibold text-gray-900">{dealerPins.length}</span> concession(s)
          </p>
          {!loading && !fetchError && items.length === 0 ? (
            <p className="mt-1 text-[11px] text-amber-600">
              ⚠ Aucun véhicule réseau géolocalisé dans cette zone
            </p>
          ) : null}
        </div>
      </aside>

      <section className="relative min-h-0 flex-1 overflow-hidden">
        <MapContainer center={[46.5, 2.5]} zoom={6} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BoundsListener onBoundsChange={handleBoundsChange} />
          <FlyToCoords target={flyTo} onDone={consumeFlyTo} />
          <div className="leaflet-top leaflet-right">
            <div className="leaflet-control">
              <LocateButton onLocate={(lat, lng) => setLocCenter({ lat, lng })} />
            </div>
          </div>

          {showVehiclesOnMap
            ? clustered.map((feature) => {
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
              })
            : null}
          {showConcessionsOnMap
            ? dealerPins.map((pin) => (
                <ConcessionMarker
                  key={`concession-${pin.dealerId}`}
                  pin={pin}
                  onViewVehicles={(id) => setDealerFilterId(id)}
                />
              ))
            : null}
        </MapContainer>
      </section>
    </div>
  );
}
