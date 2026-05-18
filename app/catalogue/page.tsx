import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { VehicleCard } from "@/components/catalogue/vehicle-card";
import { LandingLogoMark } from "@/components/landing/logo-mark";

export const metadata = {
  title: "Catalogue véhicules — DealerLink",
  description: "Découvrez les véhicules disponibles chez nos marchands professionnels.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxMileage?: string;
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let query = supabase
    .from("vehicles")
    .select("id, brand, model, year, mileage, price")
    .eq("visibility", "network")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(48);

  if (searchParams.brand) query = query.ilike("brand", `%${searchParams.brand}%`);
  if (searchParams.minPrice) query = query.gte("price", parseInt(searchParams.minPrice, 10));
  if (searchParams.maxPrice) query = query.lte("price", parseInt(searchParams.maxPrice, 10));
  if (searchParams.minYear) query = query.gte("year", parseInt(searchParams.minYear, 10));
  if (searchParams.maxMileage)
    query = query.lte("mileage", parseInt(searchParams.maxMileage, 10));

  const { data: vehicles } = await query;

  const { data: allImages } = await supabase
    .from("vehicle_images")
    .select("vehicle_id, storage_path")
    .in("vehicle_id", vehicles?.map((v) => v.id) ?? []);

  const imageMap: Record<string, string> = {};
  allImages?.forEach((img) => {
    if (!imageMap[img.vehicle_id]) imageMap[img.vehicle_id] = img.storage_path;
  });

  const count = vehicles?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <LandingLogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">
              Dealer<span className="text-brand">Link</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pb-6 pt-10">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Catalogue public
          </p>
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">
          Véhicules disponibles
        </h1>
        <p className="text-sm text-gray-500">
          {count} véhicule{count > 1 ? "s" : ""} disponibles chez nos marchands professionnels.
          <span className="ml-1 font-medium text-brand">
            Inscrivez-vous pour accéder aux coordonnées des vendeurs.
          </span>
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-7xl px-6">
        <form method="get" className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <input
              name="brand"
              defaultValue={searchParams.brand}
              placeholder="Marque (ex: BMW)"
              className="col-span-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:bg-white focus:outline-none md:col-span-1"
            />
            <input
              name="minPrice"
              type="number"
              defaultValue={searchParams.minPrice}
              placeholder="Prix min €"
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:bg-white focus:outline-none"
            />
            <input
              name="maxPrice"
              type="number"
              defaultValue={searchParams.maxPrice}
              placeholder="Prix max €"
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:bg-white focus:outline-none"
            />
            <input
              name="minYear"
              type="number"
              defaultValue={searchParams.minYear}
              placeholder="Année min"
              className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:bg-white focus:outline-none"
            />
            <div className="col-span-2 flex gap-2 md:col-span-1">
              <input
                name="maxMileage"
                type="number"
                defaultValue={searchParams.maxMileage}
                placeholder="Km max"
                className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:border-brand/40 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="flex-shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
              >
                Filtrer
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-16">
        {!vehicles || vehicles.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="mb-4 text-4xl">🚗</p>
            <p className="text-sm">Aucun véhicule disponible pour ces critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                imagePath={imageMap[vehicle.id]}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <h2 className="mb-2 text-xl font-bold text-gray-900">Vous êtes marchand automobile ?</h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">
            Rejoignez le réseau DealerLink pour accéder aux coordonnées des vendeurs et partager
            vos propres véhicules.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand/90"
          >
            Créer mon compte gratuitement →
          </Link>
          <p className="mt-3 text-xs text-gray-400">14 jours d&apos;essai · Sans carte bancaire</p>
        </div>
      </div>
    </div>
  );
}
