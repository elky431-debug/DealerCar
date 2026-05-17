import { readFileSync } from "fs";
import { join } from "path";
import { redirect } from "next/navigation";
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
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <MapView mapMigrationSql={mapMigrationSql} />
    </div>
  );
}
