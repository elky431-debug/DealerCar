"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GarageCard } from "@/components/garages/garage-card";
import { GarageDrawer } from "@/components/garages/garage-drawer";
import { GaragesMap } from "@/components/garages/garages-map";
import type { NetworkGarageProfile } from "@/lib/types";

export default function GaragesPage() {
  const [garages, setGarages] = useState<NetworkGarageProfile[]>([]);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [search, setSearch] = useState("");
  const [selectedGarage, setSelectedGarage] = useState<NetworkGarageProfile | null>(null);

  useEffect(() => {
    const fetchGarages = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, company_name, location, phone, email, description, logo_storage_path, banner_storage_path, latitude, longitude, vehicles_count",
        )
        .eq("is_network_visible", true)
        .not("company_name", "is", null)
        .order("company_name");
      setGarages((data as NetworkGarageProfile[]) ?? []);
    };
    void fetchGarages();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return garages;
    return garages.filter(
      (g) =>
        g.company_name?.toLowerCase().includes(q) || g.location?.toLowerCase().includes(q),
    );
  }, [garages, search]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Réseau & Sourcing
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Garages du réseau</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} garage{filtered.length > 1 ? "s" : ""} actif
            {filtered.length > 1 ? "s" : ""} sur le réseau DealerLink
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              view === "grid" ? "bg-white text-gray-900 shadow" : "text-gray-500"
            }`}
          >
            ⊞ Grille
          </button>
          <button
            type="button"
            onClick={() => setView("map")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              view === "map" ? "bg-white text-gray-900 shadow" : "text-gray-500"
            }`}
          >
            🗺️ Carte
          </button>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher par nom ou ville..."
        className="w-full max-w-sm rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:outline-none"
      />

      {view === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((garage) => (
            <GarageCard key={garage.id} garage={garage} onClick={() => setSelectedGarage(garage)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400">
              <p className="mb-3 text-3xl">🏢</p>
              <p className="text-sm">Aucun garage trouvé</p>
            </div>
          )}
        </div>
      )}

      {view === "map" && <GaragesMap garages={filtered} onSelect={setSelectedGarage} />}

      {selectedGarage && (
        <GarageDrawer garage={selectedGarage} onClose={() => setSelectedGarage(null)} />
      )}
    </div>
  );
}
