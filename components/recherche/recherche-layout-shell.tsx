"use client";

import { usePathname } from "next/navigation";
import { TabsNav } from "@/components/ui/tabs";

export function RechercheLayoutShell({
  favCount,
  children,
}: {
  favCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideMarketTabs = pathname.startsWith("/recherche/clients");

  return (
    <>
      {!hideMarketTabs && (
        <TabsNav
          className="px-4 pt-5 sm:px-5 sm:pt-6 md:px-6"
          tabs={[
            { href: "/recherche/reseau", label: "Réseau" },
            { href: "/recherche/marche", label: "Marché web" },
            { href: "/recherche/favoris", label: "Favoris", count: favCount },
          ]}
        />
      )}
      {children}
    </>
  );
}
