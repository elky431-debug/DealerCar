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
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
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

    setSaving(false);
    if (error) {
      toast.error("Sauvegarde impossible", error.message);
      return;
    }
    toast.success("Garage public enregistré");
    router.refresh();
  };

  const set = <K extends keyof PublicForm>(key: K, value: PublicForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="relative mb-6 h-40 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        {bannerUrl ? (
          <Image src={bannerUrl} alt="Bannière" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-brand/10 to-brand/5">
            <p className="text-sm text-gray-400">Cliquez pour ajouter une bannière</p>
          </div>
        )}
        <label className="absolute inset-0 flex cursor-pointer items-center justify-center opacity-0 transition-colors hover:bg-black/10 hover:opacity-100">
          <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium shadow">
            📷 Changer la bannière
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </label>
        <label className="absolute bottom-3 left-4 cursor-pointer">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">🏢</span>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Nom du garage *</label>
          <input
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:border-brand/40 focus:bg-white focus:outline-none"
            value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)}
            placeholder="Auto Garage Martin"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Ville *</label>
          <input
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:border-brand/40 focus:bg-white focus:outline-none"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Lyon, 69000"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Téléphone *</label>
          <input
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:border-brand/40 focus:bg-white focus:outline-none"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="06 XX XX XX XX"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Email *</label>
          <input
            className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:border-brand/40 focus:bg-white focus:outline-none"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="contact@garage.fr"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea
            className="h-20 resize-none rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm focus:border-brand/40 focus:bg-white focus:outline-none"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Spécialités, marques, types de véhicules, années d'expérience..."
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Visible sur le réseau DealerLink</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Les autres marchands peuvent voir votre profil et vous contacter
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.is_network_visible}
          onClick={() => set("is_network_visible", !form.is_network_visible)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            form.is_network_visible ? "bg-brand" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              form.is_network_visible ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {saving ? "Enregistrement…" : "Enregistrer mon garage public"}
      </button>
    </div>
  );
}
