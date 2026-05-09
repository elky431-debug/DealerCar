import Link from "next/link";
import { Plus, Warehouse, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader } from "@/components/page-header";
import { getServerAuth } from "@/lib/supabase/server";
import { formatPrice, formatMileage } from "@/lib/utils";
import {
  STATUS_LABELS,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DepotsPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("dealer_id", user.id)
    .eq("type", "depot")
    .order("created_at", { ascending: false });

  const list = (vehicles ?? []) as Vehicle[];

  const totalSold = list.filter((v) => v.status === "sold").length;
  const totalAvailable = list.filter((v) => v.status === "available").length;
  const estimatedCommission = list
    .filter((v) => v.status === "sold")
    .reduce((acc, v) => acc + computeCommission(v), 0);

  return (
    <>
      <PageHeader
        eyebrow="Garage"
        title="Dépôts-vente"
        description="Véhicules confiés par vos clients, avec leurs coordonnées."
        actions={
          <Link href="/garage/vehicules/nouveau">
            <Button>
              <Plus className="h-4 w-4" /> Ajouter en dépôt
            </Button>
          </Link>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total dépôts" value={String(list.length)} />
          <SummaryCard label="Disponibles" value={String(totalAvailable)} />
          <SummaryCard
            label="Commissions encaissées (vendus)"
            value={formatPrice(estimatedCommission)}
            hint={`${totalSold} véhicule${totalSold > 1 ? "s" : ""} vendu${totalSold > 1 ? "s" : ""}`}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={<Warehouse className="h-5 w-5" />}
            title="Aucun véhicule en dépôt-vente"
            description="Ajoutez un véhicule en sélectionnant le type « Dépôt-vente »."
            action={
              <Link href="/garage/vehicules/nouveau">
                <Button>
                  <Plus className="h-4 w-4" /> Ajouter
                </Button>
              </Link>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">Véhicules en dépôt</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Véhicule</th>
                      <th className="px-4 py-3 text-left font-medium">Client déposant</th>
                      <th className="px-4 py-3 text-left font-medium">Prix vente</th>
                      <th className="px-4 py-3 text-left font-medium">Prix client</th>
                      <th className="px-4 py-3 text-left font-medium">Commission</th>
                      <th className="px-4 py-3 text-left font-medium">Statut</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {list.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium">
                            {v.brand} {v.model}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {v.year} · {formatMileage(v.mileage)} · {v.location}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {v.deposit_client_name ? (
                            <div className="space-y-1">
                              <div className="font-medium">{v.deposit_client_name}</div>
                              {v.deposit_client_phone && (
                                <a
                                  href={`tel:${v.deposit_client_phone}`}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Phone className="h-3 w-3" /> {v.deposit_client_phone}
                                </a>
                              )}
                              {v.deposit_client_email && (
                                <a
                                  href={`mailto:${v.deposit_client_email}`}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Mail className="h-3 w-3" /> {v.deposit_client_email}
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top font-medium">
                          {formatPrice(v.price)}
                        </td>
                        <td className="px-4 py-3 align-top">{formatPrice(v.client_price)}</td>
                        <td className="px-4 py-3 align-top">
                          {formatCommission(v)}
                          <div className="text-xs text-muted-foreground">
                            ≈ {formatPrice(computeCommission(v))}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <Link
                            href={`/garage/vehicules/${v.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Détail →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  const variant =
    status === "available" ? "success" : status === "reserved" ? "warning" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}

function formatCommission(v: Vehicle): string {
  if (v.commission_value == null) return "—";
  if (v.commission_type === "percent") return `${v.commission_value}%`;
  if (v.commission_type === "fixed") return formatPrice(v.commission_value);
  return "—";
}

function computeCommission(v: Vehicle): number {
  if (v.commission_value == null) return 0;
  if (v.commission_type === "fixed") return v.commission_value;
  if (v.commission_type === "percent") return (v.price * v.commission_value) / 100;
  return 0;
}
