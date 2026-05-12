import { PageBody } from "@/components/page-header";
import { ClientSearchDetail } from "./client-search-detail";

export const dynamic = "force-dynamic";

export default function ClientSearchDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageBody className="min-w-0 max-w-full overflow-x-hidden px-0 pb-6 pt-0 sm:px-0 sm:pb-8 md:pt-1">
      <ClientSearchDetail id={params.id} />
    </PageBody>
  );
}
