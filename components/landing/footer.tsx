import Link from "next/link";
import { BrandText } from "@/components/landing/brand-text";
import { LandingLogoMark } from "@/components/landing/logo-mark";

const linkClass = "text-sm text-gray-500 transition-colors hover:text-gray-900";

export function Footer() {
  return (
    <footer className="border-t border-gray-200/80 bg-white/90 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-bold text-gray-900">
            <LandingLogoMark className="h-9 w-9" />
            Dealer<BrandText>Link</BrandText>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-landing-muted">
            La plateforme B2B des marchands automobiles professionnels.
          </p>
          <p className="mt-6 text-sm text-gray-400">© {new Date().getFullYear()} DealerLink</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Produit</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="#fonctionnalites" className={linkClass}>
                Fonctionnalités
              </a>
            </li>
            <li>
              <a href="#tarifs" className={linkClass}>
                Tarifs
              </a>
            </li>
            <li>
              <a href="#reseau" className={linkClass}>
                Réseau
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ressources</p>
          <ul className="mt-4 space-y-2">
            <li>
              <span className={`${linkClass} cursor-default`}>Documentation</span>
            </li>
            <li>
              <a href="mailto:contact@dealerlink.fr" className={linkClass}>
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Légal</p>
          <ul className="mt-4 space-y-2">
            <li>
              <span className={`${linkClass} cursor-default`}>Mentions légales</span>
            </li>
            <li>
              <span className={`${linkClass} cursor-default`}>CGU</span>
            </li>
            <li>
              <span className={`${linkClass} cursor-default`}>Politique de confidentialité</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
