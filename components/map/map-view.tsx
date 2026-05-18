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
import { Building2, Car, Layers, LocateFixed, MapPin, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, publicImageUrl } from "@/lib/utils";
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
      className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-md transition-all hover:border-brand/30 hover:shadow-lg"
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
    "w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all";
  const fieldInputCompact =
    "w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm placeholder:text-slate-400 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all";
  const fieldSelect =
    "w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-all cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-8";
  const selectChevron =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")";

  const layerTabs = [
    {
      id: "vehicles",
      label: "Véhicules",
      hint: "Prix & clusters",
      icon: Car,
      active: showVehiclesOnMap,
      onToggle: () => toggleVehiclesOnMap(!showVehiclesOnMap),
    },
    {
      id: "concessions",
      label: "Concessions",
      hint: "Partenaires",
      icon: Building2,
      active: showConcessionsOnMap,
      onToggle: () => toggleConcessionsOnMap(!showConcessionsOnMap),
    },
    {
      id: "mine",
      label: "Mon stock",
      hint: "Privés / réservés",
      icon: User,
      active: includeMine,
      onToggle: () => setIncludeMine(!includeMine),
    },
  ] as const;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-r border-slate-200/90 bg-slate-50/95 shadow-[inset_-1px_0_0_rgba(255,255,255,0.6)]">
        <div className="shrink-0 border-b border-slate-200/80 bg-white px-4 pb-4 pt-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/25">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                Carte
              </p>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Véhicules réseau</h2>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className={`${fieldInput} pl-10`}
              placeholder="Marque, modèle…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.03]">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Localisation
            </p>
            <div className="flex gap-2">
              <input
                id="map-city"
                type="text"
                className={`min-w-0 flex-1 ${fieldInputCompact}`}
                placeholder="Ville ou code postal"
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
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-brand/30 transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                onClick={() => void centerMapOnCity()}
              >
                <MapPin className="h-3.5 w-3.5" />
                Centrer
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-slate-400">Rayon ~50 km autour de la ville</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.03]">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Budget</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Prix min"
                type="number"
                className={fieldInputCompact}
                value={filters.priceMin}
                onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
              />
              <input
                placeholder="Prix max"
                type="number"
                className={fieldInputCompact}
                value={filters.priceMax}
                onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.03]">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Filtres</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                className={fieldSelect}
                style={{ backgroundImage: selectChevron }}
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
              >
                <option value="">Type</option>
                <option value="stock">Stock</option>
                <option value="depot">Dépôt</option>
              </select>
              <select
                className={fieldSelect}
                style={{ backgroundImage: selectChevron }}
                value={filters.radiusKm}
                onChange={(e) => setFilters((f) => ({ ...f, radiusKm: e.target.value }))}
              >
                <option value="">Rayon</option>
                <option value="100">&lt; 100 km</option>
                <option value="200">&lt; 200 km</option>
                <option value="500">&lt; 500 km</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm ring-1 ring-slate-900/[0.03]">
            <div className="mb-2.5 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-brand" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Afficher sur la carte
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              {layerTabs.map((layer) => {
                const Icon = layer.icon;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={layer.onToggle}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                      layer.active
                        ? "border-brand/25 bg-brand/10 text-brand-dark shadow-sm ring-1 ring-brand/10"
                        : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        layer.active ? "bg-brand text-white" : "bg-white text-slate-500 ring-1 ring-slate-200",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{layer.label}</span>
                      <span className="block text-[11px] text-slate-400">{layer.hint}</span>
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        layer.active ? "bg-brand" : "bg-slate-300",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.03]">
          {dealerFilterId && filteredDealerName ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-brand/25 bg-brand/10 px-2.5 py-2 text-xs">
              <span className="min-w-0 truncate font-medium text-brand-dark">
                {filteredDealerName}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md px-2 py-1 font-medium text-brand underline-offset-2 hover:underline"
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
                  <p className="text-[11px] text-slate-500">
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
              <li key={v.id} className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md">
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
                    <p className="text-xs text-slate-500">{v.location}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              <span className="text-sm font-bold text-slate-900">{items.length}</span> véhicule(s)
            </p>
            <p className="text-xs font-medium text-slate-500">
              <span className="text-sm font-bold text-slate-900">{dealerPins.length}</span> concession(s)
            </p>
          </div>
          {!loading && !fetchError && items.length === 0 ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700">
              Aucun véhicule réseau géolocalisé dans cette zone
            </p>
          ) : null}
        </div>
      </aside>

      <section className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-100">
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
