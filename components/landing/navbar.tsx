"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LandingLogoMark } from "@/components/landing/logo-mark";

const NAV = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#reseau", label: "Réseau" },
  { href: "#tarifs", label: "Tarifs" },
];

export function Navbar({ authenticated = false }: { authenticated?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <LandingLogoMark className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight text-gray-900">DealerLink</span>
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
              Bêta
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-500 transition-colors duration-150 hover:text-gray-900"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {authenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-500 transition-colors duration-150 hover:text-gray-900"
                >
                  Tableau de bord
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black"
                >
                  Mon espace
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-500 transition-colors duration-150 hover:text-gray-900"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-black"
                >
                  Essai gratuit
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 md:hidden"
            aria-expanded={open}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-gray-900/40"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-gray-900">
                <LandingLogoMark className="h-7 w-7" />
                DealerLink
              </span>
              <button type="button" className="p-2 text-gray-500" onClick={() => setOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 pt-6">
              {authenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-gray-900 py-3 text-center text-sm font-medium text-white"
                  onClick={() => setOpen(false)}
                >
                  Tableau de bord
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg border border-gray-200 py-3 text-center text-sm font-medium text-gray-700"
                    onClick={() => setOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-gray-900 py-3 text-center text-sm font-medium text-white"
                    onClick={() => setOpen(false)}
                  >
                    Essai gratuit
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
