"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_LABELS,
  VISIBILITY_LABELS,
  type VehicleImage,
  type VehicleStatus,
  type VehicleVisibility,
} from "@/lib/types";

interface Props {
  vehicleId: string;
  status: VehicleStatus;
  visibility: VehicleVisibility;
  images: VehicleImage[];
}

export function VehicleOwnerActions({
  vehicleId,
  status: initialStatus,
  visibility: initialVisibility,
  images,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<VehicleStatus>(initialStatus);
  const [visibility, setVisibility] = useState<VehicleVisibility>(initialVisibility);
  const [busy, setBusy] = useState(false);

  async function update(payload: Partial<{ status: VehicleStatus; visibility: VehicleVisibility }>) {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("vehicles").update(payload).eq("id", vehicleId);
    setBusy(false);
    if (error) {
      toast.error("Mise à jour impossible", error.message);
      return false;
    }
    toast.success("Mis à jour");
    router.refresh();
    return true;
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ce véhicule ? Cette action est irréversible.")) return;
    setBusy(true);
    const supabase = createClient();
    if (images.length) {
      await supabase.storage.from("vehicle-images").remove(images.map((i) => i.storage_path));
    }
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
    setBusy(false);
    if (error) {
      toast.error("Suppression impossible", error.message);
      return;
    }
    toast.success("Véhicule supprimé");
    router.push("/garage/vehicules");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="field-label">Statut</label>
        <Select
          className="mt-1.5"
          value={status}
          onChange={async (e) => {
            const v = e.target.value as VehicleStatus;
            setStatus(v);
            const ok = await update({ status: v });
            if (!ok) setStatus(initialStatus);
          }}
          disabled={busy}
        >
          {(Object.keys(STATUS_LABELS) as VehicleStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="field-label">Visibilité</label>
        <Select
          className="mt-1.5"
          value={visibility}
          onChange={async (e) => {
            const v = e.target.value as VehicleVisibility;
            setVisibility(v);
            const ok = await update({ visibility: v });
            if (!ok) setVisibility(initialVisibility);
          }}
          disabled={busy}
        >
          {(Object.keys(VISIBILITY_LABELS) as VehicleVisibility[]).map((v) => (
            <option key={v} value={v}>
              {VISIBILITY_LABELS[v]}
            </option>
          ))}
        </Select>
        {visibility === "network" && status === "available" && (
          <p className="field-hint mt-1.5">Visible par tous les marchands du réseau.</p>
        )}
        {visibility === "network" && status !== "available" && (
          <p className="field-hint mt-1.5">
            Hors recherche : le statut doit être « Disponible ».
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Link href={`/garage/vehicules/${vehicleId}/modifier`}>
          <Button variant="outline" className="w-full">
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
        </Link>
        <Button variant="destructive" onClick={handleDelete} loading={busy} className="w-full">
          <Trash2 className="h-4 w-4" /> Supprimer
        </Button>
      </div>
    </div>
  );
}
