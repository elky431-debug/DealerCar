import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";
import { PageBody, PageHeader } from "@/components/page-header";
import { MapView } from "@/components/map/map-view";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function loadMapMigrationSql(): string {
  try {
    return readFileSync(join(process.cwd(), "supabase/migration-map.sql"), "utf8");
  } catch {
    return "";
  }
}

export default async function MapPage() {
  const { user } = await getServerAuth();
  if (!user) redirect("/login");

  const mapMigrationSql = loadMapMigrationSql();

  return (
    <>
      <PageHeader
        eyebrow="Carte"
        title="Vue carte des véhicules réseau"
        description="Repérez les concessions partenaires et les véhicules réseau sur la carte. Touchez une concession pour filtrer ses annonces."
      />
      <PageBody className="pt-0">
        <MapView mapMigrationSql={mapMigrationSql} />
      </PageBody>
    </>
  );
}
