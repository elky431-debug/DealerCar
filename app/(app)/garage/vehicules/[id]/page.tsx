import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Gauge,
  MapPin,
  Mail,
  Phone,
  Building2,
  Tag,
  Receipt,
  User,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBody } from "@/components/page-header";
import { VehicleHero } from "@/components/vehicle-hero";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { VehicleOwnerActions } from "@/components/vehicle-owner-actions";
import { VehiclePriceCard } from "@/components/vehicle-price-card";
import { FavoriteButton } from "@/components/favorite-button";
import { VehicleDetailTabs } from "./detail-tabs";
import { DocumentSection } from "@/components/document-section";
import { LeadsSection } from "./leads-section";
import { CostsSection } from "./costs-section";
import { EcoSpecsCard } from "@/components/eco-specs-card";
import { createClient } from "@/lib/supabase/server";
import { findVehicleSpecsForVehicle } from "@/lib/vehicle-specs";
import { formatMileage, formatPrice, formatTitle } from "@/lib/utils";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
  type LeadWithVehicle,
  type Profile,
  type SpecMatchResult,
  type VehicleCost,
  type VehicleDocument,
  type VehicleWithRelations,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function VehicleDetailPage({ params, searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", params.id)
    .maybeSingle<VehicleWithRelations>();

  if (!vehicle) notFound();

  const isOwner = vehicle.dealer_id === user.id;
  const tab =
    (searchParams.tab as "details" | "documents" | "leads" | "costs") ?? "details";

  const [
    { data: dealer },
    { data: documents },
    { data: leads },
    { data: costsData },
    { data: fav },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", vehicle.dealer_id)
      .maybeSingle<Profile>(),
    isOwner
      ? supabase
          .from("vehicle_documents")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as VehicleDocument[] }),
    isOwner
      ? supabase
          .from("vehicle_leads")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as LeadWithVehicle[] }),
    isOwner
      ? supabase
          .from("vehicle_costs")
          .select("*")
          .eq("vehicle_id", vehicle.id)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] as VehicleCost[] }),
    isOwner
      ? Promise.resolve({ data: null })
      : supabase
          .from("favorites")
          .select("vehicle_id")
          .eq("dealer_id", user.id)
          .eq("vehicle_id", vehicle.id)
          .maybeSingle(),
  ]);

  const docs = (documents ?? []) as VehicleDocument[];
  const leadsList = (leads ?? []) as LeadWithVehicle[];
  const costs = (costsData ?? []) as VehicleCost[];
  const isFav = Boolean(fav);
  const images = (vehicle.vehicle_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);

  // Enrichissement ADEME (silencieux si la table n'existe pas encore)
  let specMatch: SpecMatchResult = { spec: null, confidence: "none", alternatives: 0 };
  try {
    specMatch = await findVehicleSpecsForVehicle(supabase, vehicle);
  } catch {
    // Table pas encore importée : on ignore proprement
  }

  const fullTitle = `${formatTitle(vehicle.brand)} ${formatTitle(vehicle.model)}`.trim();

  return (
    <>
      <VehicleHero
        vehicle={vehicle}
        isOwner={isOwner}
        actions={
          <>
            {!isOwner && <FavoriteButton vehicleId={vehicle.id} initial={isFav} />}
            {isOwner && (
              <Link href={`/garage/vehicules/${vehicle.id}/modifier`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4" /> Modifier
                </Button>
              </Link>
            )}
            <Link href={isOwner ? "/garage/vehicules" : "/recherche/reseau"}>
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>
            </Link>
          </>
        }
      />

      {isOwner && (
        <VehicleDetailTabs
          base={`/garage/vehicules/${vehicle.id}`}
          tabs={[
            { id: "details", label: "Détails", iconKey: "info" },
            { id: "costs", label: "Frais", count: costs.length, iconKey: "wallet" },
            { id: "documents", label: "Documents", count: docs.length, iconKey: "document" },
            { id: "leads", label: "Clients intéressés", count: leadsList.length, iconKey: "users" },
          ]}
          active={tab}
        />
      )}

      <PageBody className="pt-6 sm:pt-8">
        {tab === "details" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <VehicleGallery images={images} alt={fullTitle} />

              <Card>
                <CardHeader>
                  <CardTitle>Caractéristiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm sm:grid-cols-3">
                    <Detail
                      icon={<Calendar className="h-4 w-4" />}
                      label="Année"
                      value={String(vehicle.year)}
                    />
                    <Detail
                      icon={<Gauge className="h-4 w-4" />}
                      label="Kilométrage"
                      value={formatMileage(vehicle.mileage)}
                    />
                    <Detail
                      icon={<MapPin className="h-4 w-4" />}
                      label="Localisation"
                      value={vehicle.location}
                    />
                    <Detail
                      icon={<Tag className="h-4 w-4" />}
                      label="Type"
                      value={TYPE_LABELS[vehicle.type]}
                    />
                    <Detail
                      icon={<Tag className="h-4 w-4" />}
                      label="Statut"
                      value={STATUS_LABELS[vehicle.status]}
                    />
                    {isOwner && (
                      <Detail
                        icon={<Tag className="h-4 w-4" />}
                        label="Visibilité"
                        value={VISIBILITY_LABELS[vehicle.visibility]}
                      />
                    )}
                  </dl>
                </CardContent>
              </Card>

              {vehicle.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-foreground/90">
                      {vehicle.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {isOwner && vehicle.type === "depot" && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        Dépôt-vente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm sm:grid-cols-3">
                        <Detail
                          label="Prix client"
                          value={formatPrice(vehicle.client_price)}
                        />
                        <Detail
                          label="Type commission"
                          value={
                            vehicle.commission_type === "percent"
                              ? "Pourcentage"
                              : vehicle.commission_type === "fixed"
                              ? "Montant fixe"
                              : "—"
                          }
                        />
                        <Detail
                          label="Valeur commission"
                          value={
                            vehicle.commission_value == null
                              ? "—"
                              : vehicle.commission_type === "percent"
                              ? `${vehicle.commission_value}%`
                              : formatPrice(vehicle.commission_value)
                          }
                        />
                      </dl>
                    </CardContent>
                  </Card>

                  {(vehicle.deposit_client_name ||
                    vehicle.deposit_client_phone ||
                    vehicle.deposit_client_email ||
                    vehicle.deposit_client_address ||
                    vehicle.deposit_notes) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Client déposant
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid gap-4 text-sm sm:grid-cols-2">
                          {vehicle.deposit_client_name && (
                            <Detail
                              label="Nom"
                              value={vehicle.deposit_client_name}
                            />
                          )}
                          {vehicle.deposit_client_phone && (
                            <Detail
                              label="Téléphone"
                              value={vehicle.deposit_client_phone}
                            />
                          )}
                          {vehicle.deposit_client_email && (
                            <Detail
                              label="Email"
                              value={vehicle.deposit_client_email}
                            />
                          )}
                          {vehicle.deposit_client_address && (
                            <Detail
                              label="Adresse"
                              value={vehicle.deposit_client_address}
                            />
                          )}
                        </dl>
                        {vehicle.deposit_notes && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground">Notes</p>
                            <p className="mt-1 whitespace-pre-line text-sm">
                              {vehicle.deposit_notes}
                            </p>
                          </div>
                        )}
                        {(vehicle.deposit_client_phone ||
                          vehicle.deposit_client_email) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {vehicle.deposit_client_phone && (
                              <a href={`tel:${vehicle.deposit_client_phone}`}>
                                <Button variant="outline" size="sm">
                                  <Phone className="h-3.5 w-3.5" /> Appeler
                                </Button>
                              </a>
                            )}
                            {vehicle.deposit_client_email && (
                              <a href={`mailto:${vehicle.deposit_client_email}`}>
                                <Button variant="outline" size="sm">
                                  <Mail className="h-3.5 w-3.5" /> Email
                                </Button>
                              </a>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <VehiclePriceCard vehicle={vehicle} isOwner={isOwner} />

              <EcoSpecsCard match={specMatch} />

              {isOwner ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Gestion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VehicleOwnerActions
                      vehicleId={vehicle.id}
                      status={vehicle.status}
                      visibility={vehicle.visibility}
                      images={images}
                    />
                  </CardContent>
                </Card>
              ) : (
                dealer && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Marchand</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{dealer.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {dealer.location}
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <a href={`tel:${dealer.phone}`}>
                          <Button className="w-full">
                            <Phone className="h-4 w-4" /> {dealer.phone}
                          </Button>
                        </a>
                        <a
                          href={`mailto:${dealer.email}?subject=${encodeURIComponent(
                            `À propos de ${fullTitle}`,
                          )}`}
                        >
                          <Button variant="outline" className="w-full">
                            <Mail className="h-4 w-4" /> Envoyer un email
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </aside>
          </div>
        )}

        {tab === "costs" && isOwner && (
          <CostsSection
            vehicleId={vehicle.id}
            userId={user.id}
            vehiclePrice={Number(vehicle.price)}
            purchasePrice={
              vehicle.purchase_price != null ? Number(vehicle.purchase_price) : null
            }
            costs={costs}
          />
        )}

        {tab === "documents" && isOwner && (
          <DocumentSection vehicleId={vehicle.id} userId={user.id} documents={docs} />
        )}

        {tab === "leads" && isOwner && (
          <LeadsSection vehicleId={vehicle.id} userId={user.id} leads={leadsList} />
        )}
      </PageBody>
    </>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
        {label}
      </dt>
      <dd className="mt-1 truncate text-[14px] font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}
