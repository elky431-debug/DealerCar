import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Car,
  ClipboardCheck,
  FolderOpen,
  Globe,
  Heart,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Network,
  TrendingUp,
  Truck,
  UserRoundSearch,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";

/**
 * Navigation item.
 *
 * Champs optionnels prévus pour scaler :
 *  - `badge`       : compteur (ex : nb de leads non lus)
 *  - `disabled`    : item visible mais non cliquable
 *  - `comingSoon`  : étiquette "bientôt"
 *  - `description` : tooltip en mode expanded
 */
export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  comingSoon?: boolean;
  description?: string;
};

/**
 * Group ordering = funnel order :
 * Stock (ce que j'ai) → Sourcing (où je trouve) → Ventes (comment je vends) → Business (back-office).
 *
 * `label` absent = groupe muet (ex: Dashboard tout en haut).
 */
export type NavGroup = {
  id: string;
  label?: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    id: "overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Vue d'ensemble de votre activité",
      },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    items: [
      {
        href: "/garage/vehicules",
        label: "Mes véhicules",
        icon: Car,
        description: "Inventaire de vos véhicules en stock",
      },
      {
        href: "/garage/depots",
        label: "Dépôts-vente",
        icon: Warehouse,
        description: "Véhicules confiés par des particuliers",
      },
      {
        href: "/gestion/frais",
        label: "Frais & réparations",
        icon: Wrench,
        description: "Coûts engagés par véhicule (estimation IA)",
      },
    ],
  },
  {
    id: "sourcing",
    label: "Sourcing",
    items: [
      {
        href: "/sourcing/inspections",
        label: "Consultation pré-achat",
        icon: ClipboardCheck,
        description: "Checklist guidée 10 étapes avant achat (avec IA)",
      },
      {
        href: "/recherche/marche",
        label: "Marché web",
        icon: Globe,
        description: "Annonces externes (AutoScout24, Mobile.de…)",
      },
      {
        href: "/recherche/reseau",
        label: "Réseau",
        icon: Network,
        description: "Véhicules partagés par les autres marchands",
      },
      {
        href: "/map",
        label: "Carte",
        icon: MapPinned,
        description: "Vue carte des véhicules réseau",
      },
      {
        href: "/recherche/favoris",
        label: "Favoris",
        icon: Heart,
        description: "Annonces sauvegardées",
      },
      {
        href: "/recherche/clients",
        label: "Recherche client",
        icon: UserRoundSearch,
        description: "Demandes clients, matching stock & réseau, sources et messages IA",
      },
    ],
  },
  {
    id: "ventes",
    label: "Ventes",
    items: [
      {
        href: "/garage/clients",
        label: "Clients intéressés",
        icon: Users,
        description: "Prospects et leads par véhicule",
      },
      {
        href: "/gestion/annonces",
        label: "Annonces",
        icon: Megaphone,
        description: "Diffusion et mise en valeur",
      },
      {
        href: "/gestion/ventes",
        label: "Historique des ventes",
        icon: TrendingUp,
        description: "Transactions clôturées et reporting",
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      {
        href: "/gestion/garage",
        label: "Mon garage",
        icon: Building2,
        description: "Profil entreprise et préférences",
      },
      {
        href: "/gestion/sourcing",
        label: "Fournisseurs",
        icon: Truck,
        description: "Carnet d'adresses des sources de véhicules",
      },
      {
        href: "/gestion/documents",
        label: "Documents & admin",
        icon: FolderOpen,
        description: "Cartes grises, factures, contrats",
      },
    ],
  },
];

/* ---------- Helpers ---------- */

/** Match strict pour /dashboard, sinon prefix-match (gère /garage/vehicules/123). */
export function isItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Un groupe est "actif" si l'un de ses enfants l'est. Sert au highlight subtil du label. */
export function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((it) => isItemActive(it.href, pathname));
}
