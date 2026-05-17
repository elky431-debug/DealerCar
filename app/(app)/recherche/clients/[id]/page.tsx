import { PageBody } from "@/components/page-header";
import { ClientSearchDetail } from "./client-search-detail";

export const dynamic = "force-dynamic";

export default function ClientSearchDetailPage({ params }: { params: { id: string } }) {
  return (
    <PageBody className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden px-0 pb-0 pt-0 sm:px-0 sm:pb-0">
      <ClientSearchDetail id={params.id} />
    </PageBody>
  );
}
