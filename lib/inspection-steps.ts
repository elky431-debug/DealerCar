/**
 * Configuration des étapes de la "Consultation complète véhicule".
 *
 * Une étape = bloc de la checklist guidée. Pour ajouter ou modifier une
 * étape, il suffit d'éditer ce fichier — la sidebar, la progress bar et
 * les composants de rendu utilisent ce manifeste.
 *
 * Types d'étapes :
 *   - "checklist" : items à cocher + notes (rendu générique)
 *   - "form"      : inputs structurés + notes (ex: Histovec)
 *   - "ai_chassis": génération IA des emplacements de la frappe à froid
 *   - "ai_ct"     : upload photo + analyse IA contrôle technique
 *   - "ai_tires"  : photos pneus + recherche allopneu (link helper)
 */

export type InspectionStepKind =
  | "checklist"
  | "form"
  | "ai_chassis"
  | "ai_ct"
  | "ai_tires";

export interface ChecklistItem {
  id: string;
  label: string;
  /** Notation explicite : critique = bloque, warning = à surveiller. */
  severity?: "info" | "warning" | "critical";
  /** Aide complémentaire affichée sous l'item. */
  hint?: string;
}

export interface FormFieldDef {
  id: string;
  label: string;
  type: "text" | "textarea" | "number";
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export interface InspectionStep {
  /** Identifiant stable utilisé en clé dans steps_state (ex: "step1"). */
  id: string;
  /** Numéro affiché à l'utilisateur (peut être "6 bis" pour l'étape pneus). */
  number: string;
  /** Titre court (sidebar + header). */
  title: string;
  /** Sous-titre / description courte. */
  subtitle: string;
  /** Description longue affichée au-dessus du contenu. */
  description?: string;
  /** Kind de rendu, voir InspectionStepKind. */
  kind: InspectionStepKind;
  /** Illustration affichée dans le hero (chemin public Next). */
  image?: string;
  /** Items de checklist (kind=checklist). */
  checks?: ChecklistItem[];
  /** Champs (kind=form). */
  fields?: FormFieldDef[];
  /** Conseils / instructions affichés en encart en haut. */
  tips?: { title: string; body: string }[];
  /** Bloc rouge "ne pas acheter si..." (signaux disqualifiants). */
  redFlags?: string[];
  /** Étape facultative (le user peut "passer" sans valider). */
  optional?: boolean;
  /** Astuce explicative en bas (ex: "non obligatoire si véhicule < 4 ans"). */
  footnote?: string;
}

export const INSPECTION_STEPS: InspectionStep[] = [
  /* ─── 1. HISTOVEC ─── */
  {
    id: "step1",
    number: "1",
    title: "Histovec",
    subtitle: "Historique officiel & non gage",
    description:
      "Vérifier l'historique du véhicule, le certificat de non-gage et l'évolution du kilométrage via les contrôles techniques. À faire AVANT de se déplacer.",
    kind: "form",
    image: "/inspection/illustrations/step1-histovec.jpg",
    fields: [
      {
        id: "buyer_first_name",
        label: "Votre prénom",
        type: "text",
        placeholder: "Jean",
        required: true,
      },
      {
        id: "buyer_last_name",
        label: "Votre nom",
        type: "text",
        placeholder: "Dupont",
        required: true,
      },
      {
        id: "vehicle_plate",
        label: "Numéro d'immatriculation",
        type: "text",
        placeholder: "AA-123-AA",
        required: true,
      },
      {
        id: "vehicle_vin",
        label: "Numéro de châssis (VIN, 17 caractères)",
        type: "text",
        placeholder: "WBA…",
        required: true,
        hint: "Disponible sur la carte grise (case E).",
      },
    ],
    tips: [
      {
        title: "Lien officiel",
        body: "https://histovec.interieur.gouv.fr — service gratuit du ministère de l'Intérieur.",
      },
      {
        title: "À faire AVANT le déplacement",
        body: "Cette consultation se fait en ligne et permet d'éliminer 80% des arnaques sans bouger.",
      },
    ],
  },

  /* ─── 2. CARVERTICAL ─── */
  {
    id: "step2",
    number: "2",
    title: "CarVertical",
    subtitle: "Rapport historique premium (≈ 30 €)",
    description:
      "Service payant qui croise plusieurs bases européennes : historique complet, pays d'origine, évolution du kilométrage, accidents déclarés.",
    kind: "checklist",
    image: "/inspection/illustrations/step2-carvertical.jpg",
    optional: true,
    checks: [
      { id: "history_ok", label: "Historique complet cohérent", severity: "critical" },
      { id: "country_ok", label: "Pays d'immatriculation d'origine connu" },
      { id: "km_progression", label: "Évolution du kilométrage cohérente", severity: "critical" },
      { id: "no_accidents", label: "Aucun accident déclaré", severity: "warning" },
    ],
    tips: [
      {
        title: "≈ 30 € le rapport",
        body: "Étape facultative — l'alternative gratuite reste Histovec (étape 1).",
      },
    ],
    footnote:
      "Recommandé pour les véhicules > 15 000 € ou en cas de doute sur l'historique.",
  },

  /* ─── 3. NUMÉRO DE CHÂSSIS (frappe à froid) ─── */
  {
    id: "step3",
    number: "3",
    title: "Numéro de châssis",
    subtitle: "Localiser la frappe à froid",
    description:
      "Le VIN doit être physiquement gravé sur le véhicule (frappe à froid) et identique à celui de la carte grise. L'emplacement varie selon le constructeur.",
    kind: "ai_chassis",
    image: "/inspection/illustrations/step3-chassis.jpg",
    checks: [
      {
        id: "vin_match",
        label: "VIN frappé à froid identique à la carte grise",
        severity: "critical",
      },
      {
        id: "vin_no_tampering",
        label: "Aucune trace de regravure / soudure / repeinte",
        severity: "critical",
      },
    ],
  },

  /* ─── 4. CONTRÔLE TECHNIQUE ─── */
  {
    id: "step4",
    number: "4",
    title: "Contrôle technique",
    subtitle: "Validité, défauts majeurs/mineurs",
    description:
      "Le contrôle technique doit dater de moins de 6 mois. Photographiez-le, l'IA détecte les défauts et leur gravité.",
    kind: "ai_ct",
    image: "/inspection/illustrations/step4-ct.png",
    checks: [
      { id: "ct_recent", label: "CT de moins de 6 mois", severity: "critical" },
      { id: "no_major_defect", label: "Aucun défaut majeur", severity: "critical" },
      { id: "minor_defects_ok", label: "Défauts mineurs acceptables" },
    ],
    footnote:
      "Non obligatoire pour les véhicules de moins de 4 ans (premier CT à 4 ans).",
  },

  /* ─── 5. CARROSSERIE ─── */
  {
    id: "step5",
    number: "5",
    title: "Carrosserie",
    subtitle: "Bélier, ailes, jantes, rayures",
    description:
      "Faire le tour complet du véhicule à la lumière du jour. Vérifier l'alignement des éléments et l'état des points sensibles.",
    kind: "checklist",
    image: "/inspection/illustrations/step5-carrosserie.png",
    checks: [
      { id: "belier", label: "Bélier (sous le pare-chocs avant) sans choc" },
      { id: "ailes", label: "Ailes alignées, pas de jeu de portes" },
      { id: "enjoliveurs", label: "Enjoliveurs présents et non rayés" },
      { id: "retros", label: "Coques de rétroviseurs intactes" },
      {
        id: "scratches",
        label: "Aucune rayure profonde",
        hint: "Astuce : passer l'ongle. S'il bloque dans la rayure → peinture nécessaire. Sinon → simple polish.",
      },
      {
        id: "jantes",
        label: "Jantes sans choc important",
        hint: "Ne pas remplacer directement, faire d'abord évaluer par un mécano.",
      },
    ],
  },

  /* ─── 6. VOYANTS + ACCIDENT ─── */
  {
    id: "step6",
    number: "6",
    title: "Voyants & détection d'accident",
    subtitle: "Tableau de bord + inspection capot",
    description:
      "Démarrer le véhicule, observer le tableau de bord pendant 30 s. Ouvrir le capot et inspecter les boulons.",
    kind: "checklist",
    image: "/inspection/illustrations/step6-voyants.png",
    redFlags: [
      "Voyant moteur allumé",
      "Voyant boîte de vitesse allumé",
      "Voyant température allumé",
      "Voyant huile moteur allumé",
    ],
    checks: [
      { id: "no_engine_light", label: "Aucun voyant moteur", severity: "critical" },
      { id: "no_gearbox_light", label: "Aucun voyant boîte de vitesse", severity: "critical" },
      { id: "no_temp_light", label: "Aucun voyant température", severity: "critical" },
      { id: "no_oil_light", label: "Aucun voyant huile moteur", severity: "critical" },
      { id: "tire_pressure_ok", label: "Pression pneus OK (voyant éventuellement non bloquant)" },
      { id: "battery_ok", label: "Batterie OK (voyant éventuellement non bloquant)" },
      {
        id: "capot_bolts",
        label: "Boulons du capot tous de la même couleur",
        severity: "critical",
        hint: "Si certains boulons ont une couleur différente → démontage = choc probable. Croiser avec Histovec.",
      },
    ],
  },

  /* ─── 6 BIS. PNEUS ─── */
  {
    id: "step6bis",
    number: "6 bis",
    title: "Pneus",
    subtitle: "Usure, témoin, prix de remplacement",
    description:
      "Tourner les roues pour examiner toute la surface des pneus. Toucher avec les mains, ne pas se contenter du visuel.",
    kind: "ai_tires",
    image: "/inspection/illustrations/step6bis-pneus.png",
    checks: [
      {
        id: "wear_ok",
        label: "Usure acceptable (témoin non atteint)",
        hint: "Passer le doigt dans la rainure centrale, sentir la profondeur.",
      },
      { id: "all_tires_checked", label: "Les 4 pneus vérifiés à la main" },
      { id: "no_cracks", label: "Aucune craquelure / hernie / déformation", severity: "warning" },
    ],
    fields: [
      {
        id: "tire_ref",
        label: "Référence sur le flanc (ex: 205/55 R16 91V)",
        type: "text",
        placeholder: "205/55 R16 91V",
        hint: "Aide à estimer le prix d'un train de pneus neufs sur Allopneu.",
      },
    ],
  },

  /* ─── 7. PLAQUETTES DE FREIN ─── */
  {
    id: "step7",
    number: "7",
    title: "Plaquettes de frein",
    subtitle: "Quantité de matière restante",
    description:
      "Regarder entre le disque et l'étrier de frein, sur chaque roue. Une plaquette neuve fait ≈ 12 mm, à remplacer en dessous de 3 mm.",
    kind: "checklist",
    image: "/inspection/illustrations/step7-plaquettes.png",
    checks: [
      { id: "front_pads_ok", label: "Plaquettes avant > 3 mm" },
      { id: "rear_pads_ok", label: "Plaquettes arrière > 3 mm" },
      { id: "discs_ok", label: "Disques sans rayures / sillon profond" },
    ],
    footnote: "Coût indicatif d'un train de plaquettes : 80–250 € (matière + main d'œuvre).",
  },

  /* ─── 8. PARALLÉLISME ─── */
  {
    id: "step8",
    number: "8",
    title: "Parallélisme",
    subtitle: "Tenue de route droit + freinage",
    description:
      "Sur une route droite et plate, lâcher légèrement le volant. La voiture doit rouler droit, le volant centré.",
    kind: "checklist",
    image: "/inspection/illustrations/step8-parallelisme.jpg",
    checks: [
      { id: "drives_straight", label: "Roule droit, volant centré" },
      { id: "no_brake_pull", label: "Pas de tirage au freinage", severity: "warning" },
      {
        id: "no_vibrations",
        label: "Aucune vibration à vitesse élevée (110+ km/h)",
        hint: "Vibrations = équilibrage des roues à refaire.",
      },
    ],
  },

  /* ─── 9. ESSAI ROUTIER ─── */
  {
    id: "step9",
    number: "9",
    title: "Essai routier",
    subtitle: "Confort, options, bruits parasites",
    description:
      "Faire au moins 15 minutes d'essai en variant vitesse, surfaces et manœuvres.",
    kind: "checklist",
    image: "/inspection/illustrations/step9-essai.png",
    checks: [
      { id: "comfort_ok", label: "Confort général satisfaisant" },
      { id: "ac_ok", label: "Climatisation produit du froid en moins de 2 minutes" },
      { id: "bluetooth_ok", label: "Bluetooth / multimédia fonctionnel" },
      { id: "speed_bumps_ok", label: "Passage de dos d'âne sans bruit suspect" },
      { id: "reverse_ok", label: "Marche arrière sans à-coup ni grincement" },
      {
        id: "no_strange_noise",
        label: "Aucun bruit anormal (cliquetis, sifflement, claquement)",
        severity: "warning",
      },
    ],
  },

  /* ─── 10. FACTURES D'ENTRETIEN ─── */
  {
    id: "step10",
    number: "10",
    title: "Factures d'entretien",
    subtitle: "Carnet & traçabilité de l'entretien",
    description:
      "Demander toutes les factures d'entretien et révisions. Un véhicule sans aucune facture est un signal d'alerte.",
    kind: "checklist",
    image: "/inspection/illustrations/step10-factures.jpg",
    checks: [
      { id: "service_book", label: "Carnet d'entretien fourni" },
      { id: "regular_maintenance", label: "Entretien régulier (tous les 15-20 000 km)" },
      { id: "distrib_ok", label: "Distribution faite (si > 100 000 km)", severity: "warning" },
      { id: "recent_invoices", label: "Au moins une facture récente (<12 mois)" },
    ],
  },
];

/** Total d'étapes (sert pour la progress). 6 bis compte comme une étape. */
export const INSPECTION_STEPS_COUNT = INSPECTION_STEPS.length;

/** Récupère une étape par index 0-based, ou null si hors bornes. */
export function stepAtIndex(idx: number): InspectionStep | null {
  return INSPECTION_STEPS[idx] ?? null;
}

/** Récupère une étape par id, ou null si introuvable. */
export function stepById(id: string): InspectionStep | null {
  return INSPECTION_STEPS.find((s) => s.id === id) ?? null;
}

/**
 * Compte les étapes "validées" (done=true) dans un steps_state.
 * Une étape facultative non remplie ne compte pas comme validée.
 */
export function countCompleted(
  state: Record<string, { done?: boolean } | undefined>,
): number {
  return INSPECTION_STEPS.reduce(
    (acc, s) => (state[s.id]?.done ? acc + 1 : acc),
    0,
  );
}
