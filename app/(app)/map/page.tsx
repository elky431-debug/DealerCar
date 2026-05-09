import { redirect } from "next/navigation";
import { PageBody, PageHeader } from "@/components/page-header";
import { MapView } from "@/components/map/map-view";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { user } = await getServerAuth();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        eyebrow="Carte"
        title="Vue carte des véhicules réseau"
        description="Repérez les concessions partenaires et les véhicules réseau sur la carte. Touchez une concession pour filtrer ses annonces."
      />
      <PageBody className="pt-0">
        <MapView />
      </PageBody>
    </>
  );
}
