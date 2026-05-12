"use client";

import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Facebook,
  ImageIcon,
  Instagram,
  Linkedin,
  Link2,
  Save,
  Palette,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileInput } from "@/lib/validators";
import { dealerBrandingPublicUrl } from "@/lib/utils";

interface Props {
  userId: string;
  email: string;
  defaults: ProfileInput;
}

const LOGO_MAX = 2 * 1024 * 1024;
const BANNER_MAX = 3 * 1024 * 1024;

export function GarageForm({ userId, email, defaults }: Props) {
  const router = useRouter();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  const w = watch();

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

  async function uploadBranding(file: File, kind: "logo" | "banner"): Promise<boolean> {
    const max = kind === "logo" ? LOGO_MAX : BANNER_MAX;
    if (file.size > max) {
      toast.error("Fichier trop volumineux", kind === "logo" ? "Logo : 2 Mo max." : "Bannière : 3 Mo max.");
      return false;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Format invalide", "Utilisez une image (JPG, PNG ou WebP).");
      return false;
    }
    const supabase = createClient();
    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("dealer-branding").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Envoi impossible", error.message);
      return false;
    }
    const col = kind === "logo" ? "logo_storage_path" : "banner_storage_path";
    const { error: dbErr } = await supabase.from("profiles").update({ [col]: path }).eq("id", userId);
    if (dbErr) {
      toast.error("Image envoyée mais profil non mis à jour", dbErr.message);
      return false;
    }
    if (kind === "logo") setValue("logo_storage_path", path, { shouldDirty: false });
    else setValue("banner_storage_path", path, { shouldDirty: false });
    toast.success(kind === "logo" ? "Logo enregistré" : "Bannière enregistrée");
    router.refresh();
    return true;
  }

  async function clearBranding(kind: "logo" | "banner") {
    const supabase = createClient();
    const col = kind === "logo" ? "logo_storage_path" : "banner_storage_path";
    const { error } = await supabase.from("profiles").update({ [col]: null }).eq("id", userId);
    if (error) {
      toast.error("Suppression impossible", error.message);
      return;
    }
    if (kind === "logo") setValue("logo_storage_path", "", { shouldDirty: false });
    else setValue("banner_storage_path", "", { shouldDirty: false });
    toast.success(kind === "logo" ? "Logo retiré" : "Bannière retirée");
    router.refresh();
  }

  async function onSubmit(values: ProfileInput) {
    const supabase = createClient();
    const coords = await geocodeLocation(values.location);
    const payload = {
      ...values,
      siret: values.siret?.replace(/\s/g, "") || null,
      specialties: values.specialties?.trim() || null,
      tagline: values.tagline?.trim() || null,
      website_url: values.website_url?.trim() || null,
      social_facebook_url: values.social_facebook_url?.trim() || null,
      social_instagram_url: values.social_instagram_url?.trim() || null,
      social_linkedin_url: values.social_linkedin_url?.trim() || null,
      social_x_url: values.social_x_url?.trim() || null,
      logo_storage_path: values.logo_storage_path?.trim() || null,
      banner_storage_path: values.banner_storage_path?.trim() || null,
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

  const logoUrl = dealerBrandingPublicUrl(w.logo_storage_path);
  const bannerUrl = dealerBrandingPublicUrl(w.banner_storage_path);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.05] text-foreground">
            <Palette className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[14px] font-semibold tracking-tight">Apparence</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Choisissez le thème de l&apos;interface. « Système » suit les préférences de votre appareil.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] sm:p-6"
        >
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">Identité visuelle</h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Logo et bannière visibles sur votre fiche réseau (stockage sécurisé).
            </p>
            <input type="hidden" {...register("logo_storage_path")} />
            <input type="hidden" {...register("banner_storage_path")} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[12px] font-medium text-muted-foreground">Logo</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Carré recommandé · 2 Mo max</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted/50">
                      <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Choisir une image
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void uploadBranding(f, "logo");
                      }}
                    />
                  </label>
                  {w.logo_storage_path ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 text-destructive"
                      onClick={() => void clearBranding("logo")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[12px] font-medium text-muted-foreground">Bannière</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Large (~1200×400) · 3 Mo max</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted/50">
                      <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Choisir une image
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void uploadBranding(f, "banner");
                      }}
                    />
                  </label>
                  {w.banner_storage_path ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 text-destructive"
                      onClick={() => void clearBranding("banner")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div>
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

                <Field label="Téléphone" htmlFor="phone" required error={errors.phone?.message}>
                  <Input id="phone" type="tel" {...register("phone")} />
                </Field>
              </div>

              <Field
                label="Accroche"
                htmlFor="tagline"
                hint="Une phrase sous le nom (ex. « Spécialiste SUV d’occasion »)."
                error={errors.tagline?.message}
              >
                <Input
                  id="tagline"
                  placeholder="Ex. Véhicules contrôlés · Livraison France"
                  {...register("tagline")}
                />
              </Field>

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

                <Field label="N° SIRET" htmlFor="siret" hint="14 chiffres" error={errors.siret?.message}>
                  <Input
                    id="siret"
                    inputMode="numeric"
                    placeholder="123 456 789 00012"
                    {...register("siret")}
                  />
                </Field>
              </div>

              <Field
                label="Site web"
                htmlFor="website_url"
                hint="https://…"
                error={errors.website_url?.message}
              >
                <Input id="website_url" type="url" placeholder="https://www.mon-garage.fr" {...register("website_url")} />
              </Field>

              <div>
                <p className="mb-2 text-[12px] font-medium text-foreground">Réseaux sociaux</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Facebook" htmlFor="sf" error={errors.social_facebook_url?.message}>
                    <Input id="sf" type="url" placeholder="https://facebook.com/…" {...register("social_facebook_url")} />
                  </Field>
                  <Field label="Instagram" htmlFor="si" error={errors.social_instagram_url?.message}>
                    <Input id="si" type="url" placeholder="https://instagram.com/…" {...register("social_instagram_url")} />
                  </Field>
                  <Field label="LinkedIn" htmlFor="sl" error={errors.social_linkedin_url?.message}>
                    <Input id="sl" type="url" placeholder="https://linkedin.com/…" {...register("social_linkedin_url")} />
                  </Field>
                  <Field label="X (Twitter)" htmlFor="sx" error={errors.social_x_url?.message}>
                    <Input id="sx" type="url" placeholder="https://x.com/…" {...register("social_x_url")} />
                  </Field>
                </div>
              </div>

              <Field
                label="Spécialités"
                htmlFor="specialties"
                hint="Décrivez votre positionnement (véhicules premium, utilitaires…)"
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
          </div>

          <div className="flex justify-end border-t border-border/60 pt-4">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              <Save className="h-4 w-4" /> Enregistrer le profil
            </Button>
          </div>
        </form>

        <aside className="space-y-3">
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Aperçu réseau
          </p>
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
            <div className="relative h-28 w-full bg-gradient-to-br from-muted to-muted/40">
              {bannerUrl ? (
                <Image src={bannerUrl} alt="" fill className="object-cover" sizes="340px" unoptimized />
              ) : null}
            </div>
            <div className="relative px-4 pb-4 pt-0">
              <div className="-mt-8 flex items-end gap-3">
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-foreground text-background shadow-md">
                  {logoUrl ? (
                    <Image src={logoUrl} alt="" width={64} height={64} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <Building2 className="h-7 w-7" />
                  )}
                </span>
                <div className="min-w-0 pb-1">
                  <p className="truncate text-[15px] font-semibold tracking-tight">
                    {w.company_name || "Votre entreprise"}
                  </p>
                  {w.tagline?.trim() ? (
                    <p className="truncate text-[12px] text-muted-foreground">{w.tagline}</p>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 text-[12.5px] text-muted-foreground">{w.location || "—"}</p>

              <div className="mt-3 space-y-1.5 text-[13px]">
                <Row label="Tél." value={w.phone || "—"} />
                <Row label="SIRET" value={w.siret || "—"} />
                {w.website_url?.trim() ? (
                  <Row label="Web" value={w.website_url.replace(/^https?:\/\//i, "")} />
                ) : null}
              </div>

              {(w.social_facebook_url ||
                w.social_instagram_url ||
                w.social_linkedin_url ||
                w.social_x_url) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {w.social_facebook_url?.trim() ? (
                    <SocialPill href={w.social_facebook_url.trim()} label="Facebook" icon={Facebook} />
                  ) : null}
                  {w.social_instagram_url?.trim() ? (
                    <SocialPill href={w.social_instagram_url.trim()} label="Instagram" icon={Instagram} />
                  ) : null}
                  {w.social_linkedin_url?.trim() ? (
                    <SocialPill href={w.social_linkedin_url.trim()} label="LinkedIn" icon={Linkedin} />
                  ) : null}
                  {w.social_x_url?.trim() ? (
                    <SocialPill href={w.social_x_url.trim()} label="X" icon={Link2} />
                  ) : null}
                </div>
              )}

              {w.specialties?.trim() ? (
                <p className="mt-4 rounded-lg bg-muted/50 p-3 text-[12.5px] leading-relaxed text-foreground/80">
                  {w.specialties}
                </p>
              ) : null}
            </div>
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

function SocialPill({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/50"
    >
      <Icon className="h-3 w-3" />
      {label}
    </a>
  );
}
