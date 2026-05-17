"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function Li({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-gray-600">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} aria-hidden />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" strokeWidth={2} aria-hidden />
      )}
      <span>{children}</span>
    </li>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const proPrice = annual ? 39 : 49;

  return (
    <section id="tarifs" className="scroll-mt-24 landing-section-alt py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 md:text-[36px]">
          Un tarif simple, sans surprise
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-lg text-landing-muted">
          Essayez gratuitement pendant 14 jours, sans carte bancaire.
        </p>

        <div className="mx-auto mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150",
                !annual ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900",
              )}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150",
                annual ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900",
              )}
            >
              Annuel <span className="text-emerald-600">-20%</span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-[800px] gap-5 md:grid-cols-2">
          <div className="landing-card-surface flex flex-col p-6 transition-transform hover:-translate-y-0.5 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900">Gratuit</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">0 €/mois</p>
            <p className="mt-1 text-sm text-gray-500">Pour démarrer</p>
            <ul className="mt-6 flex flex-1 flex-col gap-2">
              <Li ok>Jusqu&apos;à 5 véhicules</Li>
              <Li ok>Accès au réseau (lecture)</Li>
              <Li ok>1 utilisateur</Li>
              <Li ok>Support email</Li>
              <Li ok={false}>Documents illimités</Li>
              <Li ok={false}>IA (OCR, estimations)</Li>
              <Li ok={false}>Partage réseau</Li>
            </ul>
            <Link
              href="/register"
              className="mt-8 block w-full rounded-lg border border-gray-300 py-3 text-center text-sm font-medium text-gray-900 transition-colors duration-150 hover:bg-gray-50"
            >
              Créer un compte gratuit
            </Link>
          </div>

          <div className="relative flex flex-col rounded-2xl border-2 border-landing-brand bg-white p-6 shadow-[0_20px_50px_-24px_rgba(217,147,48,0.35)] transition-transform hover:-translate-y-0.5 sm:p-8">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-landing-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Le plus populaire
            </span>
            <h3 className="text-lg font-bold text-gray-900">Pro</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {proPrice} €/mois
              {annual ? (
                <span className="ml-2 text-base font-normal text-gray-500 line-through">49 €</span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-gray-500">Pour les professionnels actifs</p>
            <ul className="mt-6 flex flex-1 flex-col gap-2">
              <Li ok>Véhicules illimités</Li>
              <Li ok>Partage réseau illimité</Li>
              <Li ok>Documents & médias illimités</Li>
              <Li ok>IA : OCR carte grise + estimation réparations</Li>
              <Li ok>Assistant IA conseiller</Li>
              <Li ok>Historique des ventes + marges</Li>
              <Li ok>Support prioritaire</Li>
              <Li ok>Multi-utilisateurs (bientôt)</Li>
            </ul>
            <Link href="/register" className="landing-cta-primary mt-8 w-full justify-center py-3 text-sm">
              Commencer l&apos;essai gratuit →
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Questions ? Écrivez-nous à{" "}
          <a href="mailto:contact@dealerlink.fr" className="font-medium text-gray-900 underline-offset-2 hover:underline">
            contact@dealerlink.fr
          </a>
        </p>
      </div>
    </section>
  );
}
