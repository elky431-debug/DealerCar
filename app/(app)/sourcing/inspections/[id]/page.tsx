import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/supabase/server";
import type { VehicleInspection } from "@/lib/types";
import { InspectionWizard } from "./inspection-wizard";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

/**
 * Page wizard "focus mode".
 *
 * On rend le wizard en pleine largeur (pas de PageHeader/PageBody) car
 * il a sa propre top bar et son footer fixe. Le but est d'avoir une
 * expérience immersive : une étape à la fois, illustration en hero.
 */
export default async function InspectionDetailPage({ params }: Props) {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data: inspection } = await supabase
    .from("vehicle_inspections")
    .select("*")
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .maybeSingle<VehicleInspection>();

  if (!inspection) notFound();

  return <InspectionWizard inspection={inspection} />;
}
