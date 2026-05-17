import {
  INSPECTION_STEPS,
  type InspectionStep,
  type InspectionStepKind,
} from "@/lib/inspection-steps";

/** Étape personnalisée créée par l'utilisateur (checklist simple). */
export interface CustomInspectionStepDef {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  checks: { id: string; label: string }[];
  optional?: boolean;
}

/** Configuration des étapes pour une consultation. */
export interface InspectionStepsConfig {
  /** Identifiants ordonnés : étapes par défaut (step1…) ou custom_xxx */
  stepIds: string[];
  customSteps: Record<string, CustomInspectionStepDef>;
}

const DEFAULT_STEP_IDS = INSPECTION_STEPS.map((s) => s.id);

export function defaultStepsConfig(): InspectionStepsConfig {
  return {
    stepIds: [...DEFAULT_STEP_IDS],
    customSteps: {},
  };
}

/** Normalise une config lue en base (ids invalides retirés, ordre conservé). */
export function normalizeStepsConfig(
  raw: InspectionStepsConfig | null | undefined,
): InspectionStepsConfig {
  if (!raw?.stepIds?.length) return defaultStepsConfig();

  const defaultIds = new Set(DEFAULT_STEP_IDS);
  const custom = raw.customSteps ?? {};
  const customIds = new Set(Object.keys(custom));

  const stepIds = raw.stepIds.filter(
    (id) => defaultIds.has(id) || customIds.has(id),
  );

  if (stepIds.length === 0) return defaultStepsConfig();

  const customSteps: Record<string, CustomInspectionStepDef> = {};
  for (const id of stepIds) {
    if (custom[id]) customSteps[id] = sanitizeCustomStep(custom[id], id);
  }

  return { stepIds, customSteps };
}

function sanitizeCustomStep(
  step: CustomInspectionStepDef,
  id: string,
): CustomInspectionStepDef {
  const checks = (step.checks ?? [])
    .filter((c) => c.label?.trim())
    .map((c, i) => ({
      id: c.id || `c${i}`,
      label: c.label.trim(),
    }));
  return {
    id,
    title: (step.title ?? "Étape personnalisée").trim(),
    subtitle: (step.subtitle ?? "").trim() || "À compléter",
    description: step.description?.trim() || undefined,
    checks: checks.length > 0 ? checks : [{ id: "c0", label: "Point à vérifier" }],
    optional: Boolean(step.optional),
  };
}

/** Liste résolue des étapes actives pour une consultation. */
export function resolveInspectionSteps(
  config: InspectionStepsConfig | null | undefined,
): InspectionStep[] {
  const normalized = normalizeStepsConfig(config);
  const byDefaultId = new Map(INSPECTION_STEPS.map((s) => [s.id, s]));

  const resolved: InspectionStep[] = [];
  normalized.stepIds.forEach((id, index) => {
    const number = String(index + 1);
    const custom = normalized.customSteps[id];
    if (custom) {
      resolved.push(customDefToStep(custom, number));
      return;
    }
    const def = byDefaultId.get(id);
    if (def) {
      resolved.push({ ...def, number });
    }
  });

  return resolved.length > 0 ? resolved : [...INSPECTION_STEPS];
}

function customDefToStep(
  def: CustomInspectionStepDef,
  number: string,
): InspectionStep {
  const kind: InspectionStepKind = "checklist";
  return {
    id: def.id,
    number,
    title: def.title,
    subtitle: def.subtitle,
    description: def.description,
    kind,
    checks: def.checks.map((c) => ({ id: c.id, label: c.label })),
    optional: def.optional,
  };
}

export function inspectionStepsCount(
  config: InspectionStepsConfig | null | undefined,
): number {
  return resolveInspectionSteps(config).length;
}

export function countCompletedForSteps(
  steps: InspectionStep[],
  state: Record<string, { done?: boolean } | undefined>,
): number {
  return steps.reduce((acc, s) => (state[s.id]?.done ? acc + 1 : acc), 0);
}

export function stepAtIndexResolved(
  steps: InspectionStep[],
  idx: number,
): InspectionStep | null {
  return steps[idx] ?? null;
}

export function stepByIdResolved(
  steps: InspectionStep[],
  id: string,
): InspectionStep | null {
  return steps.find((s) => s.id === id) ?? null;
}

export function createCustomStepId(): string {
  return `custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export function createEmptyCustomStep(): CustomInspectionStepDef {
  const id = createCustomStepId();
  return {
    id,
    title: "",
    subtitle: "",
    checks: [{ id: "c0", label: "" }],
    optional: false,
  };
}

/** Valide une config avant sauvegarde API. */
export function validateStepsConfig(
  config: InspectionStepsConfig,
): { ok: true } | { ok: false; error: string } {
  const normalized = normalizeStepsConfig(config);
  if (normalized.stepIds.length === 0) {
    return { ok: false, error: "Au moins une étape est requise." };
  }
  for (const id of normalized.stepIds) {
    const custom = normalized.customSteps[id];
    if (custom && !custom.title.trim()) {
      return { ok: false, error: "Chaque étape personnalisée doit avoir un titre." };
    }
  }
  return { ok: true };
}
