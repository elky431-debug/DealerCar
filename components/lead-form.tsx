"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { leadSchema, type LeadInput } from "@/lib/validators";
import { LEAD_STATUS_LABELS, type Lead, type Vehicle } from "@/lib/types";

interface Props {
  userId: string;
  vehicleId?: string;
  vehicles?: Pick<Vehicle, "id" | "brand" | "model" | "year">[];
  initial?: Lead;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function LeadForm({
  userId,
  vehicleId,
  vehicles,
  initial,
  onSaved,
  onCancel,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const isEdit = Boolean(initial);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: initial?.name ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      vehicle_id: initial?.vehicle_id ?? vehicleId ?? "",
      message: initial?.message ?? "",
      status: initial?.status ?? "new",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: LeadInput) {
    const supabase = createClient();
    const payload = {
      dealer_id: userId,
      name: values.name,
      phone: values.phone || null,
      email: values.email || null,
      vehicle_id: values.vehicle_id || null,
      message: values.message || null,
      status: values.status,
      notes: values.notes || null,
    };
    if (isEdit && initial) {
      const { error } = await supabase
        .from("vehicle_leads")
        .update(payload)
        .eq("id", initial.id);
      if (error) {
        toast.error("Sauvegarde impossible", error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("vehicle_leads").insert(payload);
      if (error) {
        toast.error("Création impossible", error.message);
        return;
      }
    }
    toast.success(isEdit ? "Client mis à jour" : "Client ajouté");
    startTransition(() => router.refresh());
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field label="Nom" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" placeholder="Jean Dupont" {...register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" {...register("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" {...register("email")} />
        </Field>
      </div>
      {vehicles && (
        <Field label="Véhicule concerné" htmlFor="vehicle_id">
          <Select id="vehicle_id" {...register("vehicle_id")}>
            <option value="">— Aucun —</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} ({v.year})
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Statut" htmlFor="status">
        <Select id="status" {...register("status")}>
          {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Message du client" htmlFor="message" error={errors.message?.message}>
        <Textarea id="message" rows={2} {...register("message")} />
      </Field>
      <Field label="Notes internes" htmlFor="notes" error={errors.notes?.message}>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Suivi, prochains rappels…"
          {...register("notes")}
        />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}

export function LeadFormDialog({
  open,
  onClose,
  ...props
}: Props & { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">
            {props.initial ? "Modifier le client" : "Nouveau client intéressé"}
          </h2>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-6">
          <LeadForm {...props} onSaved={onClose} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
