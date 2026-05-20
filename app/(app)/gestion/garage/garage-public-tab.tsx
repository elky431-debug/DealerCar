"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateGarageSlug } from "@/lib/garage-slug";
import { publicBrandingUrl } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/lib/types";

interface PublicForm {
  company_name: string;
  location: string;
  phone: string;
  email: string;
  description: string;
  is_network_visible: boolean;
}

interface Props {
  userId: string;
  email: string;
  profile: Profile | null;
}

const inputClass =
  "rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm font-medium transition-colors placeholder:text-gray-300 focus:border-brand/40 focus:bg-white focus:outline-none";

const inputClassNormal =
  "rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-300 focus:border-brand/40 focus:bg-white focus:outline-none";

async function geocodeLocation(
  location: string,
): Promise<{ latitude: number | null; longitude: number | null }> {
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

export function GaragePublicTab({ userId, email, profile }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [logoPath, setLogoPath] = useState(profile?.logo_storage_path ?? null);
  const [bannerPath, setBannerPath] = useState(profile?.banner_storage_path ?? null);
  const [form, setForm] = useState<PublicForm>({
    company_name: profile?.company_name ?? "",
    location: profile?.location ?? "",
    phone: profile?.phone ?? "",
    email: profile?.email ?? email,
    description: profile?.description ?? "",
    is_network_visible: profile?.is_network_visible !== false,
  });

  const logoUrl = logoPath ? publicBrandingUrl(logoPath) : null;
  const bannerUrl = bannerPath ? publicBrandingUrl(bannerPath) : null;

  const uploadFile = async (file: File, path: string) => {
    const supabase = createClient();
    const { error } = await supabase.storage.from("dealer-branding").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = `${userId}/logo.jpg`;
      await uploadFile(file, path);
      setLogoPath(path);
      toast.success("Logo mis à jour");
    } catch (err) {
      toast.error("Upload impossible", err instanceof Error ? err.message : "Erreur");
    }
    e.target.value = "";
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = `${userId}/banner.jpg`;
      await uploadFile(file, path);
      setBannerPath(path);
      toast.success("Bannière mise à jour");
    } catch (err) {
      toast.error("Upload impossible", err instanceof Error ? err.message : "Erreur");
    }
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!form.company_name.trim() || !form.location.trim() || !form.phone.trim()) {
      toast.error("Champs requis", "Nom, ville et téléphone sont obligatoires.");
      return;
    }
    setIsSaving(true);
    const supabase = createClient();
    const coords = await geocodeLocation(form.location.trim());
    const slug = generateGarageSlug(form.company_name.trim(), form.location.trim());

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: form.company_name.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || email,
        description: form.description.trim() || null,
        is_network_visible: form.is_network_visible,
        logo_storage_path: logoPath,
        banner_storage_path: bannerPath,
        slug,
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
      .eq("id", userId);

    setIsSaving(false);
    if (error) {
      const hint = error.message.includes("banner_storage_path")
        ? " Exécutez la migration : npm run db:sql -- supabase/migration-v11.sql"
        : "";
      toast.error("Sauvegarde impossible", `${error.message}${hint}`);
      return;
    }
    toast.success("Garage public enregistré");
    router.refresh();
  };

  return (
    <div>
      {/* HERO — Bannière + Logo superposé */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
        <label className="block cursor-pointer">
          <div className="group relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-100 to-brand/10">
            {bannerUrl ? (
              <Image src={bannerUrl} alt="Bannière" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 900px" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400 transition-colors group-hover:text-brand">
                <span className="text-3xl">🖼️</span>
                <p className="text-sm font-medium">Cliquez pour ajouter une bannière</p>
                <p className="text-xs">Recommandé : 1200 × 300px</p>
              </div>
            )}
            {bannerUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium shadow">
                  📷 Changer la bannière
                </span>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </label>

        <div className="absolute bottom-0 left-6 translate-y-1/2">
          <label className="block cursor-pointer">
            <div className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl">
              {logoUrl ? (
                <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="80px" />
              ) : (
                <span className="text-3xl">🏢</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                <span className="text-xs text-white">📷</span>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
      </div>

      <div className="h-12" />

      {/* FORMULAIRE */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Informations du garage
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Nom du garage <span className="text-brand">*</span>
            </label>
            <input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Auto Garage Martin"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Ville <span className="text-brand">*</span>
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Lyon, 69000"
              className={inputClassNormal}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Téléphone <span className="text-brand">*</span>
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="06 XX XX XX XX"
              className={inputClassNormal}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">
              Email <span className="text-brand">*</span>
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@garage.fr"
              className={inputClassNormal}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Spécialités, marques traitées, types de véhicules, années d'expérience..."
              rows={3}
              className={`${inputClassNormal} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* VISIBILITÉ */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Visible sur le réseau DealerLink</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Les autres marchands peuvent voir votre profil et vous contacter directement
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.is_network_visible}
            onClick={() => setForm({ ...form, is_network_visible: !form.is_network_visible })}
            className={`relative flex h-6 w-12 flex-shrink-0 rounded-full transition-colors ${
              form.is_network_visible ? "bg-brand" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                form.is_network_visible ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {form.is_network_visible && (
          <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-xs font-medium text-emerald-600">
              Votre garage est visible par tous les marchands du réseau
            </p>
          </div>
        )}
      </div>

      {/* BOUTON SAVE */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-gray-400">* Champs obligatoires pour apparaître dans l&apos;annuaire</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand/90 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Enregistrement...
            </>
          ) : (
            <>✓ Enregistrer mon garage public</>
          )}
        </button>
      </div>
    </div>
  );
}
