import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader } from "@/components/page-header";
import { ClientsList } from "./clients-list";
import { getServerAuth } from "@/lib/supabase/server";
import { VEHICLE_LEAD_LIST_SELECT } from "@/lib/data/lead-select";
import type { LeadWithVehicle, Vehicle } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const [{ data: leads }, { data: vehicles }] = await Promise.all([
    supabase
      .from("vehicle_leads")
      .select(VEHICLE_LEAD_LIST_SELECT)
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, brand, model, year")
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const list = (leads ?? []) as unknown as LeadWithVehicle[];
  const vehiclesList = (vehicles ?? []) as Pick<Vehicle, "id" | "brand" | "model" | "year">[];

  return (
    <>
      <PageHeader
        eyebrow="Garage"
        title="Clients intéressés"
        description="Tous les contacts qui ont manifesté un intérêt pour vos véhicules."
      />
      <PageBody>
        {list.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="Aucun client intéressé"
            description="Ajoutez un client manuellement ou depuis la fiche d'un véhicule."
            action={<ClientsList userId={user.id} leads={[]} vehicles={vehiclesList} emptyMode />}
          />
        ) : (
          <ClientsList userId={user.id} leads={list} vehicles={vehiclesList} />
        )}
      </PageBody>
    </>
  );
}
