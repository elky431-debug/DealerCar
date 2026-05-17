"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Save, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/validators";

interface Props {
  userId: string;
  email: string;
  defaults: ProfileInput;
}

export function GarageForm({ userId, email, defaults }: Props) {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  async function geocodeLocation(location: string): Promise<{ latitude: number | null; longitude: number | null }> {
    try {
      const url = new URL("/api/geocode", window.location.origin);
      url.searchParams.set("location", location);
      const response = await fetch(url.toString());
      if (!response.ok) return { latitude: null, longitude: null };
      const data = (await response.json()) as { latitude: number | null; longitude: number | null };
      return { latitude: data.latitude ?? null, longitude: data.longitude ?? null };
    } catch {
      return { latitude: null, longitude: null };
    }
  }

  async function onSubmit(values: ProfileInput) {
    const supabase = createClient();
    const coords = await geocodeLocation(values.location);
    const payload = {
      ...values,
      siret: values.siret?.replace(/\s/g, "") || null,
      specialties: values.specialties || null,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) {
      toast.error("Sauvegarde impossible", error.message);
      return;
    }
    toast.success("Profil mis à jour");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Apparence (paramètre global, non-lié au profil DB) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] text-foreground">
            <Palette className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[14px] font-semibold tracking-tight">Apparence</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Choisissez le thème de l'interface. « Système » suit les
              préférences de votre Mac/téléphone.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] sm:p-6"
      >
        <h3 className="text-[15px] font-semibold tracking-tight">Informations entreprise</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Visible par les autres marchands et vos prospects.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Email" htmlFor="email" hint="Lié à votre compte. Non modifiable.">
            <Input id="email" value={email} disabled />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nom de l'entreprise"
              htmlFor="company_name"
              required
              error={errors.company_name?.message}
            >
              <Input id="company_name" {...register("company_name")} />
            </Field>

            <Field
              label="Téléphone"
              htmlFor="phone"
              required
              error={errors.phone?.message}
            >
              <Input id="phone" type="tel" {...register("phone")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Ville / Localisation"
              htmlFor="location"
              required
              error={errors.location?.message}
              hint="Sert aussi à placer votre concession sur la carte réseau."
            >
              <Input id="location" {...register("location")} placeholder="Lyon" />
            </Field>

            <Field
              label="N° SIRET"
              htmlFor="siret"
              hint="14 chiffres"
              error={errors.siret?.message}
            >
              <Input
                id="siret"
                inputMode="numeric"
                placeholder="123 456 789 00012"
                {...register("siret")}
              />
            </Field>
          </div>

          <Field
            label="Spécialités"
            htmlFor="specialties"
            hint="Décrivez votre positionnement (ex: véhicules premium, utilitaires, occasions récentes…)"
            error={errors.specialties?.message}
          >
            <Textarea
              id="specialties"
              rows={4}
              placeholder="Ex: Spécialiste véhicules allemands premium · Garantie 12 mois · Reprise possible"
              {...register("specialties")}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        </div>
      </form>

      {/* Preview card — what other dealers will see */}
      <aside className="space-y-3">
        <p className="px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Aperçu réseau
        </p>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.3)]">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">
                {defaults.company_name || "Votre entreprise"}
              </p>
              <p className="text-[12.5px] text-muted-foreground">
                {defaults.location || "—"}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 text-[13px]">
            <Row label="Tél." value={defaults.phone || "—"} />
            <Row label="SIRET" value={defaults.siret || "—"} />
          </div>

          {defaults.specialties && (
            <p className="mt-4 rounded-lg bg-muted/50 p-3 text-[12.5px] leading-relaxed text-foreground/80">
              {defaults.specialties}
            </p>
          )}
        </div>
      </aside>
    </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right tabular">{value}</span>
    </div>
  );
}
