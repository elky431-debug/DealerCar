"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { ImageUploader, type UploadedImage } from "@/components/image-uploader";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import type { VehicleImage } from "@/lib/types";

interface Props {
  vehicleId: string;
  userId: string;
  images: VehicleImage[];
  alt: string;
}

export function VehiclePhotosTab({ vehicleId, userId, images, alt }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [uploaded, setUploaded] = useState<UploadedImage[]>(
    images.map((img) => ({
      id: img.id,
      storage_path: img.storage_path,
      position: img.position,
    })),
  );

  async function persistImages(next: UploadedImage[]) {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("vehicle_images")
      .select("id, storage_path")
      .eq("vehicle_id", vehicleId);

    const existingRows = existing ?? [];
    const nextIds = new Set(next.filter((n) => n.id).map((n) => n.id!));
    const toRemove = existingRows.filter((e) => !nextIds.has(e.id));

    if (toRemove.length) {
      await supabase.from("vehicle_images").delete().in(
        "id",
        toRemove.map((r) => r.id),
      );
      await supabase.storage
        .from("vehicle-images")
        .remove(toRemove.map((r) => r.storage_path));
    }

    for (let i = 0; i < next.length; i++) {
      const img = next[i];
      if (img.id) {
        await supabase.from("vehicle_images").update({ position: i }).eq("id", img.id);
      } else {
        const { data: row, error } = await supabase
          .from("vehicle_images")
          .insert({
            vehicle_id: vehicleId,
            storage_path: img.storage_path,
            position: i,
          })
          .select("id")
          .single();
        if (error) {
          toast.error("Erreur photo", error.message);
        } else if (row) {
          img.id = row.id;
        }
      }
    }

    setUploaded(next);
    toast.success("Photos mises à jour");
    startTransition(() => router.refresh());
  }

  const sorted = [...images].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <VehicleGallery images={sorted} alt={alt} />
      <div>
        <p className="mb-3 text-sm font-medium text-gray-900">Gérer les photos</p>
        <ImageUploader userId={userId} value={uploaded} onChange={persistImages} max={20} />
      </div>
    </div>
  );
}
