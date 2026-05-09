import { TabsNav } from "@/components/ui/tabs";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RechercheLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getServerAuth();

  let favCount = 0;
  if (user) {
    const { count } = await supabase
      .from("favorites")
      .select("vehicle_id", { count: "exact", head: true })
      .eq("dealer_id", user.id);
    favCount = count ?? 0;
  }

  return (
    <>
      <TabsNav
        tabs={[
          { href: "/recherche/reseau", label: "Réseau" },
          { href: "/recherche/marche", label: "Marché web" },
          { href: "/recherche/favoris", label: "Favoris", count: favCount },
        ]}
      />
      {children}
    </>
  );
}
