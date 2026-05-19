"use client";

import Image from "next/image";
import { publicBrandingUrl } from "@/lib/utils";
import type { NetworkGarageProfile } from "@/lib/types";
import { GarageVehicles } from "./garage-vehicles";

interface Props {
  garage: NetworkGarageProfile;
  onClose: () => void;
  isLoggedIn?: boolean;
}

export function GarageDrawer({ garage, onClose, isLoggedIn = true }: Props) {
  const bannerUrl = garage.banner_storage_path
    ? publicBrandingUrl(garage.banner_storage_path)
    : null;
  const logoUrl = garage.logo_storage_path ? publicBrandingUrl(garage.logo_storage_path) : null;
  const count = garage.vehicles_count ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      <div className="relative flex h-full w-[420px] max-w-full flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="relative flex h-36 flex-shrink-0 bg-gradient-to-r from-brand/10 to-brand/5">
          {bannerUrl && (
            <Image src={bannerUrl} alt="Bannière" fill className="object-cover" sizes="420px" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
            aria-label="Fermer"
          >
            ✕
          </button>
          <div className="absolute bottom-3 left-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-lg">
              {logoUrl ? (
                <Image src={logoUrl} alt="logo" width={56} height={56} className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">🏢</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">{garage.company_name}</h2>
            <p className="mt-0.5 text-sm text-gray-500">📍 {garage.location}</p>
            {garage.description && (
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{garage.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-brand/10 p-3 text-center">
              <p className="text-2xl font-bold text-brand">{count}</p>
              <p className="mt-0.5 text-xs text-brand/80">véhicules dispo</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">✓</p>
              <p className="mt-0.5 text-xs text-emerald-500">Membre vérifié</p>
            </div>
          </div>

          {isLoggedIn ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Contact direct
              </p>
              {garage.phone && (
                <a
                  href={`tel:${garage.phone}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">📞</div>
                  <div>
                    <p className="text-xs text-gray-400">Téléphone</p>
                    <p className="text-sm font-semibold text-gray-900">{garage.phone}</p>
                  </div>
                </a>
              )}
              {garage.email && (
                <a
                  href={`mailto:${garage.email}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-brand/30 hover:bg-brand/5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10">✉️</div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{garage.email}</p>
                  </div>
                </a>
              )}
              {garage.phone && (
                <a
                  href={`https://wa.me/${garage.phone.replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 p-3 transition-colors hover:bg-green-100"
                >
                  <span>💬</span>
                  <span className="text-sm font-medium text-green-700">WhatsApp</span>
                </a>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 blur-sm select-none">
                <p className="text-sm font-medium">06 XX XX XX XX</p>
                <p className="text-sm text-gray-400">contact@garage.fr</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-white/70 backdrop-blur-[1px]">
                <span>🔒</span>
                <a
                  href="/register"
                  className="text-xs font-semibold text-brand underline underline-offset-2"
                >
                  S&apos;inscrire pour voir les contacts
                </a>
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Véhicules disponibles
            </p>
            <GarageVehicles dealerId={garage.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
