import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { VehicleForm } from "@/components/vehicle-form";
import { getServerAuth } from "@/lib/supabase/server";
import type { VehicleWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditVehiclePage({ params }: Props) {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", params.id)
    .maybeSingle<VehicleWithRelations>();

  if (!vehicle) notFound();
  if (vehicle.dealer_id !== user.id) redirect(`/garage/vehicules/${vehicle.id}`);

  vehicle.vehicle_images = (vehicle.vehicle_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);

  return (
    <>
      <PageHeader
        title={`Modifier — ${vehicle.brand} ${vehicle.model}`}
        actions={
          <Link href={`/garage/vehicules/${vehicle.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          </Link>
        }
      />
      <PageBody>
        <VehicleForm userId={user.id} initial={vehicle} />
      </PageBody>
    </>
  );
}
