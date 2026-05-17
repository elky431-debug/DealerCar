"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { INSPECTION_STEPS } from "@/lib/inspection-steps";
import {
  createEmptyCustomStep,
  defaultStepsConfig,
  normalizeStepsConfig,
  type CustomInspectionStepDef,
  type InspectionStepsConfig,
} from "@/lib/inspection-steps-config";

interface Props {
  open: boolean;
  onClose: () => void;
  initialConfig: InspectionStepsConfig | null;
  onSave: (config: InspectionStepsConfig) => Promise<void>;
}

type Row =
  | { type: "default"; id: string; title: string; subtitle: string; optional?: boolean }
  | { type: "custom"; def: CustomInspectionStepDef };

export function InspectionStepsEditor({
  open,
  onClose,
  initialConfig,
  onSave,
}: Props) {
  const toast = useToast();
  const [config, setConfig] = useState<InspectionStepsConfig>(() =>
    normalizeStepsConfig(initialConfig),
  );
  const [editingCustom, setEditingCustom] = useState<CustomInspectionStepDef | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(normalizeStepsConfig(initialConfig));
      setEditingCustom(null);
    }
  }, [open, initialConfig]);

  const rows = useMemo((): Row[] => {
    const byDefault = new Map(INSPECTION_STEPS.map((s) => [s.id, s]));
    return config.stepIds.map((id) => {
      const custom = config.customSteps[id];
      if (custom) return { type: "custom" as const, def: custom };
      const def = byDefault.get(id);
      if (def) {
        return {
          type: "default" as const,
          id: def.id,
          title: def.title,
          subtitle: def.subtitle,
          optional: def.optional,
        };
      }
      return null;
    }).filter(Boolean) as Row[];
  }, [config]);

  const inactiveDefaults = useMemo(() => {
    const active = new Set(config.stepIds);
    return INSPECTION_STEPS.filter((s) => !active.has(s.id));
  }, [config.stepIds]);

  const move = useCallback((index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= config.stepIds.length) return;
    setConfig((c) => {
      const ids = [...c.stepIds];
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return { ...c, stepIds: ids };
    });
  }, [config.stepIds.length]);

  const removeStep = useCallback((id: string) => {
    setConfig((c) => {
      const stepIds = c.stepIds.filter((x) => x !== id);
      const { [id]: _, ...customSteps } = c.customSteps;
      return { stepIds, customSteps };
    });
  }, []);

  const restoreDefault = useCallback((id: string) => {
    setConfig((c) => {
      if (c.stepIds.includes(id)) return c;
      return { ...c, stepIds: [...c.stepIds, id] };
    });
  }, []);

  const addCustom = useCallback(() => {
    const def = createEmptyCustomStep();
    setConfig((c) => ({
      stepIds: [...c.stepIds, def.id],
      customSteps: { ...c.customSteps, [def.id]: def },
    }));
    setEditingCustom(def);
  }, []);

  const saveCustomEdit = useCallback(() => {
    if (!editingCustom) return;
    if (!editingCustom.title.trim()) {
      toast.error("Titre requis", "Donnez un nom à votre étape.");
      return;
    }
    const checks = editingCustom.checks
      .map((c, i) => ({
        id: c.id || `c${i}`,
        label: c.label.trim(),
      }))
      .filter((c) => c.label);
    if (checks.length === 0) {
      toast.error("Checklist vide", "Ajoutez au moins un point à vérifier.");
      return;
    }
    const saved: CustomInspectionStepDef = {
      ...editingCustom,
      title: editingCustom.title.trim(),
      subtitle: editingCustom.subtitle.trim() || "Étape personnalisée",
      checks,
    };
    setConfig((c) => ({
      ...c,
      customSteps: { ...c.customSteps, [saved.id]: saved },
    }));
    setEditingCustom(null);
  }, [editingCustom, toast]);

  async function handleSaveAll() {
    if (config.stepIds.length === 0) {
      toast.error("Aucune étape", "Gardez au moins une étape active.");
      return;
    }
    setSaving(true);
    try {
      await onSave(normalizeStepsConfig(config));
      onClose();
      toast.success("Étapes mises à jour", "Votre consultation a été adaptée.");
    } catch (err) {
      toast.error(
        "Enregistrement impossible",
        err instanceof Error ? err.message : "Erreur",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    if (!confirm("Réinitialiser toutes les étapes par défaut ? Vos étapes personnalisées seront retirées.")) {
      return;
    }
    setConfig(defaultStepsConfig());
    setEditingCustom(null);
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      title="Personnaliser les étapes"
      description="Activez ou retirez les étapes par défaut, réordonnez-les et ajoutez vos propres points de contrôle."
      className="max-w-lg"
    >
      {editingCustom ? (
        <CustomStepForm
          step={editingCustom}
          onChange={setEditingCustom}
          onCancel={() => setEditingCustom(null)}
          onSave={saveCustomEdit}
        />
      ) : (
        <div className="space-y-4">
          <ol className="space-y-2">
            {rows.map((row, index) => (
              <li
                key={row.type === "default" ? row.id : row.def.id}
                className="flex items-stretch gap-1 rounded-xl border border-border/60 bg-card"
              >
                <div className="flex flex-col justify-center border-r border-border/50 px-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Monter"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2.5">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">
                      {row.type === "default" ? row.title : row.def.title}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {row.type === "default" ? row.subtitle : row.def.subtitle}
                      {row.type === "custom" && (
                        <span className="ml-1 text-[#b07824]">· Personnalisée</span>
                      )}
                    </p>
                  </div>
                  {row.type === "custom" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCustom({ ...row.def })}
                    >
                      Modifier
                    </Button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(row.type === "default" ? row.id : row.def.id)}
                  className="flex shrink-0 items-center rounded-r-xl px-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Retirer l'étape"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>

          {inactiveDefaults.length > 0 && (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Étapes par défaut retirées
              </p>
              <div className="flex flex-wrap gap-2">
                {inactiveDefaults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => restoreDefault(s.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[12px] font-medium transition-colors hover:border-foreground/30"
                  >
                    <Plus className="h-3 w-3" />
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addCustom}>
              <Plus className="h-4 w-4" />
              Ajouter une étape
            </Button>
            <Button type="button" variant="ghost" onClick={resetToDefault}>
              Réinitialiser
            </Button>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSaveAll} loading={saving}>
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CustomStepForm({
  step,
  onChange,
  onCancel,
  onSave,
}: {
  step: CustomInspectionStepDef;
  onChange: (s: CustomInspectionStepDef) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Titre de l'étape" required>
        <Input
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
          placeholder="Ex : Vérification sellerie"
          autoFocus
        />
      </Field>
      <Field label="Sous-titre">
        <Input
          value={step.subtitle}
          onChange={(e) => onChange({ ...step, subtitle: e.target.value })}
          placeholder="Courte description"
        />
      </Field>
      <Field label="Description (optionnel)">
        <Textarea
          value={step.description ?? ""}
          onChange={(e) => onChange({ ...step, description: e.target.value })}
          placeholder="Consignes pour cette étape…"
          rows={3}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium">Points à vérifier</p>
        <ul className="space-y-2">
          {step.checks.map((c, i) => (
            <li key={c.id} className="flex gap-2">
              <Input
                value={c.label}
                onChange={(e) => {
                  const checks = [...step.checks];
                  checks[i] = { ...checks[i], label: e.target.value };
                  onChange({ ...step, checks });
                }}
                placeholder={`Point ${i + 1}`}
              />
              <button
                type="button"
                disabled={step.checks.length <= 1}
                onClick={() => {
                  const checks = step.checks.filter((_, j) => j !== i);
                  onChange({ ...step, checks });
                }}
                className="shrink-0 rounded-lg px-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                aria-label="Supprimer le point"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() =>
            onChange({
              ...step,
              checks: [
                ...step.checks,
                { id: `c${step.checks.length}`, label: "" },
              ],
            })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter un point
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(step.optional)}
          onChange={(e) => onChange({ ...step, optional: e.target.checked })}
          className="rounded border-border"
        />
        Étape facultative (peut être passée)
      </label>

      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Retour
        </Button>
        <Button type="button" onClick={onSave}>
          Valider l&apos;étape
        </Button>
      </div>
    </div>
  );
}
