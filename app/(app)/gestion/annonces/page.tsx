import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerAuth } from "@/lib/supabase/server";
import type { VehicleWithRelations } from "@/lib/types";
import { ListingsManager } from "./listings-manager";

export const dynamic = "force-dynamic";

export default async function AnnoncesPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("dealer_id", user.id)
    .neq("status", "sold")
    .order("created_at", { ascending: false });

  const vehicles = (data ?? []) as VehicleWithRelations[];
  vehicles.forEach((v) => {
    v.vehicle_images = (v.vehicle_images ?? []).slice().sort((a, b) => a.position - b.position);
  });

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Annonces & Mise en valeur"
        description="Optimisez vos fiches : titre accrocheur, description, qualité du véhicule, copie en un clic."
      />
      <PageBody>
        {vehicles.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-5 w-5" />}
            title="Aucun véhicule à mettre en valeur"
            description="Ajoutez d'abord un véhicule dans votre garage."
          />
        ) : (
          <ListingsManager vehicles={vehicles} />
        )}
      </PageBody>
    </>
  );
}
