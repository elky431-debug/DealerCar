import { TabsNav } from "@/components/ui/tabs";
import { getCachedGarageTabCounts } from "@/lib/data/layout-cache";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GarageLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerAuth();

  let total = 0,
    depots = 0,
    leads = 0;

  if (user) {
    const counts = await getCachedGarageTabCounts(user.id);
    total = counts.total;
    depots = counts.depots;
    leads = counts.leads;
  }

  return (
    <>
      <TabsNav
        tabs={[
          { href: "/garage/vehicules", label: "Mes véhicules", count: total },
          { href: "/garage/depots", label: "Dépôts-vente", count: depots },
          { href: "/garage/clients", label: "Clients intéressés", count: leads },
        ]}
      />
      {children}
    </>
  );
}
