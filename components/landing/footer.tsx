import { LandingLogoMark } from "@/components/landing/logo-mark";

const link = "text-sm text-gray-400 transition-colors duration-150 hover:text-white";

function LogoFooter() {
  return (
    <a href="/" className="flex items-center gap-2.5 font-bold text-white">
      <LandingLogoMark className="h-9 w-9 rounded-md bg-white/10 p-0.5 ring-1 ring-white/10" />
      DealerLink
    </a>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-8 lg:px-8">
        <div>
          <LogoFooter />
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            La plateforme B2B des marchands automobiles professionnels.
          </p>
          <p className="mt-6 text-sm text-gray-500">© {new Date().getFullYear()} DealerLink</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Produit</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="#fonctionnalites" className={link}>
                Fonctionnalités
              </a>
            </li>
            <li>
              <a href="#tarifs" className={link}>
                Tarifs
              </a>
            </li>
            <li>
              <a href="#reseau" className={link}>
                Réseau
              </a>
            </li>
            <li>
              <span className={`${link} cursor-default hover:text-gray-400`}>Roadmap</span>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ressources</p>
          <ul className="mt-4 space-y-2">
            <li>
              <span className={`${link} cursor-default hover:text-gray-400`}>Documentation</span>
            </li>
            <li>
              <span className={`${link} cursor-default hover:text-gray-400`}>Blog</span>
            </li>
            <li>
              <a href="mailto:contact@dealerlink.fr" className={link}>
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Légal</p>
          <ul className="mt-4 space-y-2">
            <li>
              <span className={`${link} cursor-default hover:text-gray-400`}>Mentions légales</span>
            </li>
            <li>
              <span className={`${link} cursor-default hover:text-gray-400`}>CGU</span>
            </li>
            <li>
              <span className={`${link} cursor-default hover:text-gray-400`}>Politique de confidentialité</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
