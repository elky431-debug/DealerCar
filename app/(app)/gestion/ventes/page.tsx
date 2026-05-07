import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/lib/types";
import { SalesHistory } from "./sales-history";

export const dynamic = "force-dynamic";

export default async function VentesPage({
  searchParams,
}: {
  searchParams: { period?: string; sort?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, brand, model, year, mileage, price, purchase_price, sold_at, type, commission_type, commission_value, client_price, created_at",
    )
    .eq("dealer_id", user.id)
    .eq("status", "sold")
    .order("sold_at", { ascending: false, nullsFirst: false });

  const sales = (data ?? []) as Pick<
    Vehicle,
    | "id"
    | "brand"
    | "model"
    | "year"
    | "mileage"
    | "price"
    | "purchase_price"
    | "sold_at"
    | "type"
    | "commission_type"
    | "commission_value"
    | "client_price"
    | "created_at"
  >[];

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Historique des ventes"
        description="Performances commerciales : prix d'achat, prix de vente, marges."
      />
      <PageBody>
        {sales.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="h-5 w-5" />}
            title="Aucune vente enregistrée"
            description="Lorsque vous passerez le statut d'un véhicule à « Vendu », il apparaîtra ici."
          />
        ) : (
          <SalesHistory sales={sales} defaults={searchParams} />
        )}
      </PageBody>
    </>
  );
}
