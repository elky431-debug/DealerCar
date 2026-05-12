import { TabsNav } from "@/components/ui/tabs";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GarageLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getServerAuth();

  let total = 0,
    depots = 0,
    leads = 0;

  if (user) {
    const [vehiclesRes, depotsRes, leadsRes] = await Promise.all([
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", user.id),
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", user.id)
        .eq("type", "depot"),
      supabase
        .from("vehicle_leads")
        .select("id", { count: "exact", head: true })
        .eq("dealer_id", user.id)
        .in("status", ["new", "contacted", "hot"]),
    ]);
    total = vehiclesRes.count ?? 0;
    depots = depotsRes.count ?? 0;
    leads = leadsRes.count ?? 0;
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
