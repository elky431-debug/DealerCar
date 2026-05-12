import Link from "next/link";
import { Plus, UserRoundSearch } from "lucide-react";
import { PageBody } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { CS_EYEBROW, CS_PAGE_GUTTER } from "@/lib/client-search-ui";
import { ClientsSearchesList } from "./clients-searches-list";

export const dynamic = "force-dynamic";

export default function ClientSearchesPage() {
  return (
    <PageBody className="min-w-0 max-w-full overflow-x-hidden px-0 pb-10 pt-0 sm:pb-12">
      <div
        className={`border-b border-border/50 bg-background/85 backdrop-blur-xl ${CS_PAGE_GUTTER} py-8 md:py-10`}
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-4">
            <Link
              href="/recherche/marche"
              className={`inline-flex items-center gap-2 ${CS_EYEBROW} transition-colors hover:text-foreground`}
            >
              <span className="h-px w-6 bg-border" aria-hidden />
              Recherche & sourcing
            </Link>
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <UserRoundSearch className="h-7 w-7" />
              </span>
              <div className="min-w-0 space-y-2">
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-[2.15rem] md:leading-tight">
                  Recherche client
                </h1>
                <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                  Pipeline des demandes sur-mesure : critères, matching stock & réseau, sources pro et
                  relances — tout au même endroit.
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button variant="outline" size="lg" className="h-12 rounded-xl px-5" href="/recherche/clients/new">
              <Plus className="mr-2 h-5 w-5" />
              Nouvelle recherche
            </Button>
          </div>
        </div>
      </div>

      <div className={`${CS_PAGE_GUTTER} py-8 md:py-10`}>
        <ClientsSearchesList />
      </div>
    </PageBody>
  );
}
