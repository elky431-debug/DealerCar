import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

const VARIANT: Record<LeadStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  new: "default",
  contacted: "secondary",
  hot: "warning",
  cold: "outline",
  won: "success",
  lost: "destructive",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge variant={VARIANT[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}
