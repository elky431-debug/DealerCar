"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Loader2,
  FileText,
  Film,
  ImageIcon,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
  type VehicleDocument,
} from "@/lib/types";

interface Props {
  vehicleId: string;
  userId: string;
  documents: VehicleDocument[];
}

const ACCEPTED =
  "image/png, image/jpeg, image/webp, image/heic, video/mp4, video/quicktime, video/webm, application/pdf";

const MAX_SIZE_MB = 50;

interface UrlEntry {
  url: string;
  expiresAt: number;
}

export function DocumentSection({ vehicleId, userId, documents }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<DocumentCategory>("photo_after");
  const [urls, setUrls] = useState<Record<string, UrlEntry>>({});
  const [activePreview, setActivePreview] = useState<VehicleDocument | null>(null);

  // Generate signed URLs for previews when docs change
  useEffect(() => {
    if (!documents.length) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const paths = documents.map((d) => d.storage_path);
      const { data, error } = await supabase.storage
        .from("vehicle-documents")
        .createSignedUrls(paths, 60 * 60);
      if (cancelled || error || !data) return;
      const map: Record<string, UrlEntry> = {};
      data.forEach((entry, i) => {
        if (entry.signedUrl) {
          map[documents[i].id] = {
            url: entry.signedUrl,
            expiresAt: Date.now() + 60 * 60 * 1000,
          };
        }
      });
      setUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [documents]);

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    const oversized = arr.find((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized) {
      toast.error("Fichier trop volumineux", `Limite ${MAX_SIZE_MB} Mo par fichier.`);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    try {
      for (const file of arr) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
        const path = `${userId}/${vehicleId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-documents")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });
        if (upErr) {
          toast.error("Upload échoué", upErr.message);
          continue;
        }
        const { error: dbErr } = await supabase.from("vehicle_documents").insert({
          vehicle_id: vehicleId,
          dealer_id: userId,
          name: file.name,
          storage_path: path,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
          category,
        });
        if (dbErr) {
          toast.error("Erreur enregistrement", dbErr.message);
          await supabase.storage.from("vehicle-documents").remove([path]);
          continue;
        }
      }
      toast.success("Documents ajoutés");
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(doc: VehicleDocument) {
    if (!confirm(`Supprimer « ${doc.name} » ?`)) return;
    const supabase = createClient();
    const [{ error: dbErr }] = await Promise.all([
      supabase.from("vehicle_documents").delete().eq("id", doc.id),
      supabase.storage.from("vehicle-documents").remove([doc.storage_path]),
    ]);
    if (dbErr) {
      toast.error("Suppression impossible", dbErr.message);
      return;
    }
    toast.success("Supprimé");
    startTransition(() => router.refresh());
  }

  const grouped = groupByCategory(documents);

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="field-label">Catégorie</label>
            <Select
              className="mt-1.5 max-w-xs"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            >
              {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <p className="field-hint mt-1.5">
              Images, vidéos (jusqu'à {MAX_SIZE_MB} Mo) et PDF acceptés.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            loading={busy}
          >
            <Upload className="h-4 w-4" /> Importer
          </Button>
        </div>
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
          <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Upload en cours…
          </p>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun document. Importez vos photos avant/après réparation, vidéos, ou docs administratifs.
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.keys(grouped) as DocumentCategory[]).map((cat) => (
            <section key={cat}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {DOCUMENT_CATEGORY_LABELS[cat]}{" "}
                <span className="font-normal">· {grouped[cat].length}</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {grouped[cat].map((doc) => (
                  <DocumentTile
                    key={doc.id}
                    doc={doc}
                    url={urls[doc.id]?.url}
                    onPreview={() => setActivePreview(doc)}
                    onDelete={() => handleDelete(doc)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {activePreview && (
        <PreviewModal
          doc={activePreview}
          url={urls[activePreview.id]?.url}
          onClose={() => setActivePreview(null)}
        />
      )}
    </div>
  );
}

function DocumentTile({
  doc,
  url,
  onPreview,
  onDelete,
}: {
  doc: VehicleDocument;
  url?: string;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const isImage = doc.mime_type.startsWith("image/");
  const isVideo = doc.mime_type.startsWith("video/");
  const isPdf = doc.mime_type === "application/pdf";

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={onPreview}
        className="block aspect-square w-full bg-muted text-muted-foreground"
      >
        {isImage && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={doc.name} className="h-full w-full object-cover" />
        ) : isVideo && url ? (
          <div className="relative h-full w-full">
            <video src={url} className="h-full w-full object-cover" muted preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Film className="h-8 w-8 text-white/90" />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {isPdf ? <FileText className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
          </div>
        )}
      </button>
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium" title={doc.name}>
            {doc.name}
          </p>
          <p className="text-[11px] text-muted-foreground">{formatBytes(doc.size_bytes)}</p>
        </div>
        <div className="flex shrink-0 gap-0.5">
          {url && (
            <a
              href={url}
              download={doc.name}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Télécharger"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  doc,
  url,
  onClose,
}: {
  doc: VehicleDocument;
  url?: string;
  onClose: () => void;
}) {
  const isImage = doc.mime_type.startsWith("image/");
  const isVideo = doc.mime_type.startsWith("video/");
  const isPdf = doc.mime_type === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className={cn("relative max-h-full max-w-5xl overflow-hidden rounded-xl bg-background")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="truncate text-sm font-medium">{doc.name}</p>
          <div className="flex items-center gap-2">
            {url && (
              <a href={url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
        <div className="flex max-h-[80vh] items-center justify-center bg-black/20 p-2">
          {isImage && url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={doc.name} className="max-h-[78vh] w-auto object-contain" />
          )}
          {isVideo && url && (
            <video src={url} controls className="max-h-[78vh] w-full" />
          )}
          {isPdf && url && (
            <iframe src={url} title={doc.name} className="h-[78vh] w-[80vw] bg-white" />
          )}
          {!isImage && !isVideo && !isPdf && url && (
            <div className="p-8 text-center text-sm">
              Aperçu non disponible.{" "}
              <a href={url} className="text-primary underline" target="_blank" rel="noreferrer">
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function groupByCategory(docs: VehicleDocument[]): Record<DocumentCategory, VehicleDocument[]> {
  const order: DocumentCategory[] = [
    "carte_grise",
    "controle_technique",
    "declaration_cession",
    "facture",
    "photo_before",
    "photo_after",
    "video_before",
    "video_after",
    "admin",
    "other",
  ];
  const out: Partial<Record<DocumentCategory, VehicleDocument[]>> = {};
  for (const d of docs) {
    if (!out[d.category]) out[d.category] = [];
    out[d.category]!.push(d);
  }
  const result: Record<DocumentCategory, VehicleDocument[]> = {} as Record<
    DocumentCategory,
    VehicleDocument[]
  >;
  for (const k of order) if (out[k]?.length) result[k] = out[k]!;
  return result;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
