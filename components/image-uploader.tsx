"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn, publicImageUrl } from "@/lib/utils";

export interface UploadedImage {
  id?: string;
  storage_path: string;
  position: number;
  is_new?: boolean;
}

interface ImageUploaderProps {
  userId: string;
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
}

const ACCEPTED = "image/png, image/jpeg, image/webp";
const MAX_SIZE_MB = 8;

export function ImageUploader({ userId, value, onChange, max = 12 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const toast = useToast();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!arr.length) return;
      const room = max - value.length;
      if (room <= 0) {
        toast.error("Limite atteinte", `Maximum ${max} images.`);
        return;
      }
      const toUpload = arr.slice(0, room);
      const oversized = toUpload.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
      if (oversized) {
        toast.error("Fichier trop volumineux", `Limite ${MAX_SIZE_MB} Mo par image.`);
        return;
      }

      setBusy(true);
      const supabase = createClient();
      const next: UploadedImage[] = [...value];
      try {
        for (const file of toUpload) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${userId}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage
            .from("vehicle-images")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });
          if (error) {
            toast.error("Upload échoué", error.message);
            continue;
          }
          next.push({
            storage_path: path,
            position: next.length,
            is_new: true,
          });
        }
        onChange(reindex(next));
      } finally {
        setBusy(false);
      }
    },
    [max, onChange, toast, userId, value],
  );

  async function handleRemove(index: number) {
    const img = value[index];
    if (img.is_new) {
      const supabase = createClient();
      await supabase.storage.from("vehicle-images").remove([img.storage_path]);
    }
    const next = value.filter((_, i) => i !== index);
    onChange(reindex(next));
  }

  function handleReorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(reindex(next));
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors",
          dragOver && "border-primary bg-primary/5",
        )}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">
          Glissez-déposez ou{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-primary hover:underline"
          >
            parcourez
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG / PNG / WebP — max {MAX_SIZE_MB} Mo · {max} images max
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {busy && (
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Upload en cours…
          </p>
        )}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((img, idx) => (
            <div
              key={img.storage_path}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx != null) handleReorder(dragIdx, idx);
                setDragIdx(null);
              }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted",
                dragIdx === idx && "opacity-50",
              )}
            >
              <img
                src={publicImageUrl(img.storage_path)}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute left-1 top-1 flex h-6 items-center gap-0.5 rounded-md bg-black/60 px-1.5 text-[10px] font-medium text-white">
                <GripVertical className="h-3 w-3" />
                {idx === 0 ? "Photo de couverture" : `#${idx + 1}`}
              </div>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute right-1 top-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleRemove(idx)}
                aria-label="Supprimer"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function reindex(images: UploadedImage[]): UploadedImage[] {
  return images.map((img, i) => ({ ...img, position: i }));
}
