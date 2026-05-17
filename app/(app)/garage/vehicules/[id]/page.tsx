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
import { VehicleOwnerActions } from "@/components/vehicle-owner-actions";
import { VehiclePriceCard } from "@/components/vehicle-price-card";
import { FavoriteButton } from "@/components/favorite-button";
import { VehicleDetailTabs } from "./detail-tabs";
import { VehicleDocumentsTab } from "./vehicle-documents-tab";
import { VehicleClientsTab } from "./vehicle-clients-tab";
import { VehicleFraisTab } from "./vehicle-frais-tab";
import { VehiclePhotosTab } from "./vehicle-photos-tab";
import { EcoSpecsCard } from "@/components/eco-specs-card";
import { getServerAuth } from "@/lib/supabase/server";
import { findVehicleSpecsForVehicle } from "@/lib/vehicle-specs";
import { formatMileage, formatPrice, formatTitle } from "@/lib/utils";
import {
  STATUS_LABELS,
  TYPE_LABELS,
  VISIBILITY_LABELS,
  type Lead,
  type Profile,
  type SpecMatchResult,
  type VehicleCost,
  type VehicleDocument,
  type VehicleImage,
  type VehicleWithRelations,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const TAB_IDS = ["infos", "photos", "documents", "frais", "clients"] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_ALIASES: Record<string, TabId> = {
  details: "infos",
  costs: "frais",
  leads: "clients",
};

function resolveTab(raw?: string): TabId {
  if (!raw) return "infos";
  const normalized = TAB_ALIASES[raw] ?? raw;
  return TAB_IDS.includes(normalized as TabId) ? (normalized as TabId) : "infos";
}

interface Props {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function VehicleDetailPage({ params, searchParams }: Props) {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", params.id)
    .maybeSingle<VehicleWithRelations>();

  if (!vehicle) notFound();

  const isOwner = vehicle.dealer_id === user.id;
  const tab = resolveTab(searchParams.tab);

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
      : Promise.resolve({ data: [] as Lead[] }),
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
  const leadsList = (leads ?? []) as Lead[];
  const costs = (costsData ?? []) as VehicleCost[];
  const isFav = Boolean(fav);
  const images = (vehicle.vehicle_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position);

  let specMatch: SpecMatchResult = { spec: null, confidence: "none", alternatives: 0 };
  try {
    specMatch = await findVehicleSpecsForVehicle(supabase, vehicle);
  } catch {
    /* table ADEME absente */
  }

  const fullTitle = `${formatTitle(vehicle.brand)} ${formatTitle(vehicle.model)}`.trim();

  const ownerTabs = [
    { id: "infos", label: "Infos", iconKey: "info" as const },
    { id: "photos", label: "Photos", count: images.length, iconKey: "photos" as const },
    { id: "documents", label: "Documents", count: docs.length, iconKey: "document" as const },
    { id: "frais", label: "Frais", count: costs.length, iconKey: "wallet" as const },
    { id: "clients", label: "Clients", count: leadsList.length, iconKey: "users" as const },
  ];

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
        <VehicleDetailTabs base={`/garage/vehicules/${vehicle.id}`} tabs={ownerTabs} active={tab} />
      )}

      <PageBody className="pt-6 sm:pt-8">
        {tab === "infos" && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
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
                    <Detail icon={<Tag className="h-4 w-4" />} label="Type" value={TYPE_LABELS[vehicle.type]} />
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
                        <Detail label="Prix client" value={formatPrice(vehicle.client_price)} />
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
                    vehicle.deposit_client_email) && (
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
                            <Detail label="Nom" value={vehicle.deposit_client_name} />
                          )}
                          {vehicle.deposit_client_phone && (
                            <Detail label="Téléphone" value={vehicle.deposit_client_phone} />
                          )}
                          {vehicle.deposit_client_email && (
                            <Detail label="Email" value={vehicle.deposit_client_email} />
                          )}
                        </dl>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

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

        {tab === "photos" && isOwner && (
          <VehiclePhotosTab vehicleId={vehicle.id} userId={user.id} images={images} alt={fullTitle} />
        )}

        {tab === "documents" && isOwner && (
          <VehicleDocumentsTab vehicleId={vehicle.id} userId={user.id} documents={docs} />
        )}

        {tab === "frais" && isOwner && (
          <VehicleFraisTab vehicleId={vehicle.id} userId={user.id} costs={costs} />
        )}

        {tab === "clients" && isOwner && (
          <VehicleClientsTab vehicleId={vehicle.id} userId={user.id} leads={leadsList} />
        )}

        {!isOwner && tab !== "infos" && (
          <p className="text-sm text-muted-foreground">Cette section est réservée au propriétaire.</p>
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
      <dd className="mt-1 truncate text-[14px] font-medium text-foreground">{value}</dd>
    </div>
  );
}
