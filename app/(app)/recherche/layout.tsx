import { TabsNav } from "@/components/ui/tabs";
import { getCachedFavCount } from "@/lib/data/layout-cache";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RechercheLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerAuth();

  let favCount = 0;
  if (user) {
    favCount = await getCachedFavCount(user.id);
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
