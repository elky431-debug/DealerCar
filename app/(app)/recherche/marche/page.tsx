import { PageBody, PageHeader } from "@/components/page-header";
import { MarketSearch } from "./market-search";

export const dynamic = "force-dynamic";

export default function MarchePage() {
  return (
    <>
      <PageHeader
        eyebrow="Recherche · Marché web"
        title="Annonces du marché"
        description="Trouvez des véhicules sur AutoScout24 et Mobile.de — directement depuis DealerLink."
      />
      <PageBody className="space-y-6">
        <MarketSearch />
      </PageBody>
    </>
  );
}
