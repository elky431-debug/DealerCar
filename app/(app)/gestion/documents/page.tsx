import { redirect } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import type { VehicleDocument, Vehicle } from "@/lib/types";
import { DocumentsManager } from "./documents-manager";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [docsRes, vehiclesRes] = await Promise.all([
    supabase
      .from("vehicle_documents")
      .select("*")
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, brand, model, year")
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const docs = (docsRes.data ?? []) as VehicleDocument[];
  const vehicles = (vehiclesRes.data ?? []) as Pick<
    Vehicle,
    "id" | "brand" | "model" | "year"
  >[];

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Documents & Admin"
        description="Tous les documents associés à vos véhicules : carte grise, contrôle technique, factures…"
      />
      <PageBody>
        {vehicles.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-5 w-5" />}
            title="Aucun véhicule"
            description="Ajoutez d'abord un véhicule dans votre garage pour pouvoir y attacher des documents."
          />
        ) : (
          <DocumentsManager
            initialDocs={docs.map((d) => ({
              ...d,
              vehicle: vehicleById.get(d.vehicle_id) ?? null,
            }))}
            vehicles={vehicles}
          />
        )}
      </PageBody>
    </>
  );
}
