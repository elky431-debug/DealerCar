import { redirect } from "next/navigation";
import { PageBody, PageHeader } from "@/components/page-header";
import { MapView } from "@/components/map/map-view";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        eyebrow="Carte"
        title="Vue carte des véhicules réseau"
        description="Explorez les véhicules disponibles par zone géographique et trouvez rapidement les opportunités proches."
      />
      <PageBody className="pt-0">
        <MapView />
      </PageBody>
    </>
  );
}
