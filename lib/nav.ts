import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Building2,
  Car,
  ClipboardCheck,
  FolderOpen,
  Globe,
  Heart,
  LayoutDashboard,
  Map,
  Megaphone,
  Network,
  TrendingUp,
  Truck,
  UserSearch,
  Users,
} from "lucide-react";

/**
 * Navigation item.
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
 * Groupe de navigation (label = titre de section en majuscules).
 */
export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const ICONS: Record<string, LucideIcon> = {
  Car,
  Archive,
  Users,
  Megaphone,
  TrendingUp,
  Network,
  Globe,
  Map,
  Heart,
  ClipboardCheck,
  UserSearch,
  Building2,
  FolderOpen,
  Truck,
  LayoutDashboard,
};

function item(label: string, href: string, icon: string, description?: string): NavItem {
  return {
    label,
    href,
    icon: ICONS[icon] ?? Car,
    description,
  };
}

/** Structure sidebar DealerLink (MON GARAGE → VENTES → RÉSEAU & SOURCING → BUSINESS) */
export const NAV: NavGroup[] = [
  {
    id: "overview",
    label: "",
    items: [
      item("Dashboard", "/dashboard", "LayoutDashboard", "Vue d'ensemble de votre activité"),
    ],
  },
  {
    id: "mon-garage",
    label: "MON GARAGE",
    items: [
      item("Mes véhicules", "/garage/vehicules", "Car", "Inventaire de vos véhicules en stock"),
      item("Dépôts-vente", "/garage/depots", "Archive", "Véhicules confiés par des particuliers"),
    ],
  },
  {
    id: "ventes",
    label: "VENTES",
    items: [
      item("Clients intéressés", "/garage/clients", "Users", "Prospects et leads par véhicule"),
      item("Annonces", "/gestion/annonces", "Megaphone", "Diffusion et mise en valeur"),
      item("Historique des ventes", "/gestion/ventes", "TrendingUp", "Transactions clôturées"),
    ],
  },
  {
    id: "reseau-sourcing",
    label: "RÉSEAU & SOURCING",
    items: [
      item("Réseau", "/recherche/reseau", "Network", "Véhicules partagés par les autres marchands"),
      item("Marché web", "/recherche/marche", "Globe", "Annonces externes"),
      item("Carte", "/map", "Map", "Vue carte des véhicules réseau"),
      item("Favoris", "/recherche/favoris", "Heart", "Annonces sauvegardées"),
      item(
        "Consultation pré-achat",
        "/sourcing/inspections",
        "ClipboardCheck",
        "Checklist guidée avant achat",
      ),
      item(
        "Recherche client",
        "/recherche/clients",
        "UserSearch",
        "Demandes clients et matching",
      ),
    ],
  },
  {
    id: "business",
    label: "BUSINESS",
    items: [
      item("Mon garage", "/gestion/garage", "Building2", "Profil entreprise"),
      item("Documents & Admin", "/gestion/documents", "FolderOpen", "Documents globaux du garage"),
      item("Fournisseurs", "/gestion/sourcing", "Truck", "Carnet de sources"),
    ],
  },
];

/* ---------- Helpers ---------- */

export function isItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((it) => isItemActive(it.href, pathname));
}
