"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ImageUploader, type UploadedImage } from "@/components/image-uploader";
import { OcrCarteGriseModal } from "@/components/ocr-carte-grise-modal";
import { createClient } from "@/lib/supabase/client";
import { vehicleSchema, type VehicleInput } from "@/lib/validators";
import type { Vehicle, VehicleImage } from "@/lib/types";
import type { CarteGriseData } from "@/app/api/ocr-carte-grise/route";
import { cn } from "@/lib/utils";

interface VehicleFormProps {
  userId: string;
  defaultLocation?: string;
  initial?: Vehicle & { vehicle_images?: VehicleImage[] };
}

export function VehicleForm({ userId, defaultLocation, initial }: VehicleFormProps) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(initial);

  const [images, setImages] = useState<UploadedImage[]>(
    (initial?.vehicle_images ?? []).map((img) => ({
      id: img.id,
      storage_path: img.storage_path,
      position: img.position,
    })),
  );

  const [ocrOpen, setOcrOpen] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: initial?.brand ?? "",
      model: initial?.model ?? "",
      year: initial?.year ?? new Date().getFullYear(),
      mileage: initial?.mileage ?? 0,
      price: initial?.price ?? 0,
      location: initial?.location ?? defaultLocation ?? "",
      description: initial?.description ?? "",
      type: initial?.type ?? "stock",
      visibility: initial?.visibility ?? "private",
      status: initial?.status ?? "available",
      client_price: initial?.client_price ?? null,
      commission_type: initial?.commission_type ?? null,
      commission_value: initial?.commission_value ?? null,
      deposit_client_name: initial?.deposit_client_name ?? "",
      deposit_client_phone: initial?.deposit_client_phone ?? "",
      deposit_client_email: initial?.deposit_client_email ?? "",
      deposit_client_address: initial?.deposit_client_address ?? "",
      deposit_notes: initial?.deposit_notes ?? "",
    },
  });

  const type = watch("type");

  function applyOcrData(data: CarteGriseData) {
    const filled = new Set<string>(aiFilledFields);
    const extras: string[] = [];

    if (data.make) {
      const brand = data.make
        .toLowerCase()
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
      setValue("brand", brand, { shouldValidate: true });
      filled.add("brand");
    }
    if (data.model) {
      const model = data.model
        .toLowerCase()
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ");
      setValue("model", model, { shouldValidate: true });
      filled.add("model");
    }
    if (data.first_registration_date) {
      const year = parseInt(data.first_registration_date.slice(0, 4), 10);
      if (Number.isFinite(year)) {
        setValue("year", year, { shouldValidate: true });
        filled.add("year");
      }
    }

    // Champs non stockés dans la table mais utiles dans la description
    if (data.version) extras.push(`Version : ${data.version}`);
    if (data.fuel_type) extras.push(`Carburant : ${data.fuel_type}`);
    if (typeof data.power_kw === "number") {
      extras.push(`Puissance : ${data.power_kw} kW (~${Math.round(data.power_kw * 1.36)} ch)`);
    }
    if (typeof data.engine_displacement === "number") {
      extras.push(`Cylindrée : ${data.engine_displacement} cm³`);
    }
    if (typeof data.seats === "number") extras.push(`Places : ${data.seats}`);
    if (data.plate_number) extras.push(`Immat : ${data.plate_number}`);

    if (extras.length > 0) {
      const current = (watch("description") ?? "").trim();
      const block = `— Carte grise —\n${extras.join("\n")}`;
      const next = current ? `${current}\n\n${block}` : block;
      setValue("description", next, { shouldValidate: false });
      filled.add("description");
    }

    setAiFilledFields(filled);
    setAiSummary(`${filled.size} champ${filled.size > 1 ? "s" : ""} pré-rempli${filled.size > 1 ? "s" : ""} depuis la carte grise`);
    toast.success(
      "Carte grise lue",
      `${filled.size} champ${filled.size > 1 ? "s" : ""} pré-rempli${filled.size > 1 ? "s" : ""}`,
    );
  }

  const aiFieldClass = (key: string) =>
    aiFilledFields.has(key)
      ? "border-primary/40 bg-primary/10 focus-visible:border-primary focus-visible:ring-primary/20/50"
      : "";

  async function geocodeLocation(location: string): Promise<{ latitude: number | null; longitude: number | null }> {
    try {
      const url = new URL("/api/geocode", window.location.origin);
      url.searchParams.set("location", location);
      const response = await fetch(url.toString());
      if (!response.ok) return { latitude: null, longitude: null };
      const data = (await response.json()) as { latitude: number | null; longitude: number | null };
      return {
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      };
    } catch {
      return { latitude: null, longitude: null };
    }
  }

  async function onSubmit(values: VehicleInput) {
    const supabase = createClient();
    const coords = await geocodeLocation(values.location);

    const payload = {
      dealer_id: userId,
      brand: values.brand,
      model: values.model,
      year: values.year,
      mileage: values.mileage,
      price: values.price,
      location: values.location,
      latitude: coords.latitude,
      longitude: coords.longitude,
      description: values.description || null,
      type: values.type,
      visibility: values.visibility,
      status: values.status,
      client_price: values.type === "depot" ? values.client_price ?? null : null,
      commission_type: values.type === "depot" ? values.commission_type ?? null : null,
      commission_value: values.type === "depot" ? values.commission_value ?? null : null,
      deposit_client_name: values.type === "depot" ? values.deposit_client_name || null : null,
      deposit_client_phone: values.type === "depot" ? values.deposit_client_phone || null : null,
      deposit_client_email: values.type === "depot" ? values.deposit_client_email || null : null,
      deposit_client_address:
        values.type === "depot" ? values.deposit_client_address || null : null,
      deposit_notes: values.type === "depot" ? values.deposit_notes || null : null,
    };

    let vehicleId = initial?.id;

    if (isEdit && vehicleId) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", vehicleId);
      if (error) {
        toast.error("Sauvegarde impossible", error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("vehicles")
        .insert(payload)
        .select("id")
        .single();
      if (error || !data) {
        toast.error("Création impossible", error?.message ?? "");
        return;
      }
      vehicleId = data.id;
    }

    if (vehicleId) {
      // Sync images
      const existingIds = (initial?.vehicle_images ?? []).map((i) => i.id);
      const keptIds = images.map((i) => i.id).filter(Boolean) as string[];
      const removedIds = existingIds.filter((id) => !keptIds.includes(id));

      if (removedIds.length) {
        const removedPaths = (initial?.vehicle_images ?? [])
          .filter((i) => removedIds.includes(i.id))
          .map((i) => i.storage_path);
        await supabase.from("vehicle_images").delete().in("id", removedIds);
        if (removedPaths.length) {
          await supabase.storage.from("vehicle-images").remove(removedPaths);
        }
      }

      // Insert new
      const newImgs = images.filter((i) => !i.id);
      if (newImgs.length) {
        const rows = newImgs.map((i) => ({
          vehicle_id: vehicleId!,
          storage_path: i.storage_path,
          position: i.position,
        }));
        const { error } = await supabase.from("vehicle_images").insert(rows);
        if (error) toast.error("Erreur images", error.message);
      }

      // Update positions for kept ones
      for (const img of images) {
        if (img.id) {
          await supabase
            .from("vehicle_images")
            .update({ position: img.position })
            .eq("id", img.id);
        }
      }
    }

    toast.success(isEdit ? "Véhicule modifié" : "Véhicule ajouté");
    router.push(`/garage/vehicules/${vehicleId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* OCR Banner */}
      {!isEdit && (
        <div className="dl-brand-banner flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="dl-icon-mark h-10 w-10">
              <Camera className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-semibold tracking-tight">
                Remplissage automatique
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {aiSummary
                  ? aiSummary
                  : "Scannez la carte grise pour pré-remplir marque, modèle, année et plus."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" onClick={() => setOcrOpen(true)}>
              <Sparkles className="h-4 w-4" /> Scanner la carte grise
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Les champs marqués d'un <span className="text-destructive">*</span> sont obligatoires.
            {aiFilledFields.size > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/20">
                <Sparkles className="h-2.5 w-2.5" />
                Champs en orange : pré-remplis par l&apos;IA
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={<AiLabel base="Marque" filled={aiFilledFields.has("brand")} />} htmlFor="brand" required error={errors.brand?.message}>
              <Input
                id="brand"
                placeholder="Renault, BMW, …"
                className={cn(aiFieldClass("brand"))}
                {...register("brand")}
              />
            </Field>
            <Field label={<AiLabel base="Modèle" filled={aiFilledFields.has("model")} />} htmlFor="model" required error={errors.model?.message}>
              <Input
                id="model"
                placeholder="Clio, Série 3, …"
                className={cn(aiFieldClass("model"))}
                {...register("model")}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={<AiLabel base="Année" filled={aiFilledFields.has("year")} />} htmlFor="year" required error={errors.year?.message}>
              <Input
                id="year"
                type="number"
                inputMode="numeric"
                className={cn(aiFieldClass("year"))}
                {...register("year")}
              />
            </Field>
            <Field
              label="Kilométrage"
              htmlFor="mileage"
              required
              error={errors.mileage?.message}
              hint="en km"
            >
              <Input id="mileage" type="number" inputMode="numeric" {...register("mileage")} />
            </Field>
            <Field label="Prix" htmlFor="price" required error={errors.price?.message} hint="en €">
              <Input id="price" type="number" inputMode="decimal" step="1" {...register("price")} />
            </Field>
          </div>
          <Field label="Localisation" htmlFor="location" required error={errors.location?.message}>
            <Input id="location" placeholder="Ville, département…" {...register("location")} />
          </Field>
          <Field label={<AiLabel base="Description" filled={aiFilledFields.has("description")} />} htmlFor="description" error={errors.description?.message}>
            <Textarea
              id="description"
              rows={4}
              placeholder="Options, état, historique…"
              className={cn(aiFieldClass("description"))}
              {...register("description")}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statut & visibilité</CardTitle>
          <CardDescription>
            Seuls les véhicules <strong>visibles sur le réseau</strong> et{" "}
            <strong>disponibles</strong> apparaissent dans la recherche des autres marchands.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type" htmlFor="type" required error={errors.type?.message}>
              <Select id="type" {...register("type")}>
                <option value="stock">Stock (mon véhicule)</option>
                <option value="depot">Dépôt-vente (client)</option>
              </Select>
            </Field>
            <Field label="Visibilité" htmlFor="visibility" required error={errors.visibility?.message}>
              <Select id="visibility" {...register("visibility")}>
                <option value="private">Privé (interne)</option>
                <option value="network">Réseau (visible des autres marchands)</option>
              </Select>
            </Field>
            <Field label="Statut" htmlFor="status" required error={errors.status?.message}>
              <Select id="status" {...register("status")}>
                <option value="available">Disponible</option>
                <option value="reserved">Réservé</option>
                <option value="sold">Vendu</option>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      {type === "depot" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informations dépôt-vente</CardTitle>
              <CardDescription>Prix net dû au client + commission qui vous revient.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Prix client"
                  htmlFor="client_price"
                  required
                  error={errors.client_price?.message}
                  hint="ce qui revient au client"
                >
                  <Input
                    id="client_price"
                    type="number"
                    inputMode="decimal"
                    step="1"
                    {...register("client_price")}
                  />
                </Field>
                <Field
                  label="Type de commission"
                  htmlFor="commission_type"
                  required
                  error={errors.commission_type?.message}
                >
                  <Select id="commission_type" {...register("commission_type")}>
                    <option value="">—</option>
                    <option value="fixed">Montant fixe (€)</option>
                    <option value="percent">Pourcentage (%)</option>
                  </Select>
                </Field>
                <Field
                  label="Valeur commission"
                  htmlFor="commission_value"
                  required
                  error={errors.commission_value?.message}
                >
                  <Input
                    id="commission_value"
                    type="number"
                    inputMode="decimal"
                    step="1"
                    {...register("commission_value")}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Client déposant
              </CardTitle>
              <CardDescription>
                Coordonnées du propriétaire du véhicule (visible seulement par vous).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Nom complet"
                htmlFor="deposit_client_name"
                required
                error={errors.deposit_client_name?.message}
              >
                <Input
                  id="deposit_client_name"
                  placeholder="Jean Dupont"
                  {...register("deposit_client_name")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Téléphone"
                  htmlFor="deposit_client_phone"
                  error={errors.deposit_client_phone?.message}
                >
                  <Input
                    id="deposit_client_phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    {...register("deposit_client_phone")}
                  />
                </Field>
                <Field
                  label="Email"
                  htmlFor="deposit_client_email"
                  error={errors.deposit_client_email?.message}
                >
                  <Input
                    id="deposit_client_email"
                    type="email"
                    placeholder="jean@exemple.fr"
                    {...register("deposit_client_email")}
                  />
                </Field>
              </div>
              <Field
                label="Adresse"
                htmlFor="deposit_client_address"
                error={errors.deposit_client_address?.message}
              >
                <Input
                  id="deposit_client_address"
                  placeholder="123 rue Exemple, 75001 Paris"
                  {...register("deposit_client_address")}
                />
              </Field>
              <Field
                label="Notes internes"
                htmlFor="deposit_notes"
                error={errors.deposit_notes?.message}
                hint="Date de dépôt, conditions, particularités…"
              >
                <Textarea id="deposit_notes" rows={3} {...register("deposit_notes")} />
              </Field>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
          <CardDescription>
            La 1ʳᵉ photo sera utilisée comme photo de couverture. Glissez-déposez pour réorganiser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader userId={userId} value={images} onChange={setImages} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2 pb-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? "Enregistrer" : "Créer le véhicule"}
        </Button>
      </div>

      <OcrCarteGriseModal
        open={ocrOpen}
        onClose={() => setOcrOpen(false)}
        onApply={applyOcrData}
      />
    </form>
  );
}

function AiLabel({ base, filled }: { base: string; filled: boolean }) {
  if (!filled) return <>{base}</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {base}
      <Sparkles className="h-3 w-3 text-primary" />
    </span>
  );
}
