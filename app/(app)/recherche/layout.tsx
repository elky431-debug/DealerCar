import { RechercheLayoutShell } from "@/components/recherche/recherche-layout-shell";
import { getCachedFavCount } from "@/lib/data/layout-cache";
import { getServerAuth } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RechercheLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getServerAuth();

  let favCount = 0;
  if (user) {
    favCount = await getCachedFavCount(user.id);
  }

  return <RechercheLayoutShell favCount={favCount}>{children}</RechercheLayoutShell>;
}
