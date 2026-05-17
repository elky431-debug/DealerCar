"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  Film,
  ImageIcon,
  Trash2,
  Download,
  ExternalLink,
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelative } from "@/lib/utils";
import {
  ADMIN_DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type DocumentCategory,
  type Vehicle,
  type VehicleDocument,
} from "@/lib/types";

interface DocWithVehicle extends VehicleDocument {
  vehicle: Pick<Vehicle, "id" | "brand" | "model" | "year"> | null;
}

interface Props {
  initialDocs: DocWithVehicle[];
  vehicles: Pick<Vehicle, "id" | "brand" | "model" | "year">[];
}

const ACCEPTED =
  "image/png, image/jpeg, image/webp, image/heic, video/mp4, video/quicktime, video/webm, application/pdf";
const MAX_SIZE_MB = 50;

export function DocumentsManager({ initialDocs, vehicles }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [docs] = useState(initialDocs);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [activePreview, setActivePreview] = useState<DocWithVehicle | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterVehicle, setFilterVehicle] = useState<string>("");

  useEffect(() => {
    if (!docs.length) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const paths = docs.map((d) => d.storage_path);
      const { data, error } = await supabase.storage
        .from("vehicle-documents")
        .createSignedUrls(paths, 60 * 60);
      if (cancelled || error || !data) return;
      const map: Record<string, string> = {};
      data.forEach((entry, i) => {
        if (entry.signedUrl) map[docs[i].id] = entry.signedUrl;
      });
      setUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [docs]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (filterCat && d.category !== filterCat) return false;
      if (filterVehicle && d.vehicle_id !== filterVehicle) return false;
      if (
        ql &&
        !d.name.toLowerCase().includes(ql) &&
        !`${d.vehicle?.brand} ${d.vehicle?.model}`.toLowerCase().includes(ql)
      )
        return false;
      return true;
    });
  }, [docs, q, filterCat, filterVehicle]);

  async function handleDelete(doc: DocWithVehicle) {
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
    toast.success("Document supprimé");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-12 rounded-xl border-border/70 bg-card pl-11 pr-4 text-[15px] shadow-sm transition-shadow focus-visible:shadow-md"
            placeholder="Rechercher un document, un véhicule…"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            value={filterCat}
            onChange={setFilterCat}
            options={[
              { value: "", label: "Toutes catégories" },
              ...Object.entries(DOCUMENT_CATEGORY_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              })),
            ]}
          />
          <FilterPill
            value={filterVehicle}
            onChange={setFilterVehicle}
            options={[
              { value: "", label: "Tous les véhicules" },
              ...vehicles.map((v) => ({
                value: v.id,
                label: `${v.brand} ${v.model} · ${v.year}`,
              })),
            ]}
          />
          <Button type="button" className="ml-auto" onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4" /> Ajouter un document
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
          {docs.length === 0
            ? "Aucun document encore. Importez votre premier fichier ci-dessus."
            : "Aucun document ne correspond à vos filtres."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <th className="w-12 px-3 py-2.5"></th>
                <th className="px-3 py-2.5 text-left">Type</th>
                <th className="px-3 py-2.5 text-left">Document</th>
                <th className="px-3 py-2.5 text-left">Véhicule</th>
                <th className="px-3 py-2.5 text-left">Date</th>
                <th className="w-32 px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-border/40 last:border-b-0 hover:bg-muted/30"
                >
                  <td className="w-12 py-2.5 pl-3 pr-0">
                    <Thumb doc={doc} url={urls[doc.id]} />
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                        ADMIN_DOCUMENT_CATEGORIES.includes(doc.category)
                          ? "bg-primary/10 text-primary ring-primary/20"
                          : "bg-muted text-foreground/70 ring-border",
                      )}
                    >
                      {DOCUMENT_CATEGORY_LABELS[doc.category]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setActivePreview(doc)}
                      className="block max-w-[280px] truncate text-left font-medium hover:underline"
                      title={doc.name}
                    >
                      {doc.name}
                    </button>
                    <span className="text-[11px] text-muted-foreground tabular">
                      {formatBytes(doc.size_bytes)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {doc.vehicle ? (
                      <Link
                        href={`/garage/vehicules/${doc.vehicle.id}`}
                        className="text-foreground hover:underline"
                      >
                        {doc.vehicle.brand} {doc.vehicle.model}{" "}
                        <span className="text-muted-foreground tabular">{doc.vehicle.year}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular text-muted-foreground">
                    {formatRelative(doc.created_at)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => setActivePreview(doc)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="Aperçu"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      {urls[doc.id] && (
                        <a
                          href={urls[doc.id]}
                          download={doc.name}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Télécharger"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(doc)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <UploadDialog
          vehicles={vehicles}
          onClose={() => setShowUpload(false)}
          onUploaded={() => startTransition(() => router.refresh())}
        />
      )}

      {activePreview && (
        <PreviewModal
          doc={activePreview}
          url={urls[activePreview.id]}
          onClose={() => setActivePreview(null)}
        />
      )}
    </div>
  );
}

function Thumb({ doc, url }: { doc: DocWithVehicle; url?: string }) {
  const isImage = doc.mime_type.startsWith("image/");
  const isVideo = doc.mime_type.startsWith("video/");
  const isPdf = doc.mime_type === "application/pdf";
  return (
    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted text-muted-foreground">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : isVideo ? (
        <Film className="h-4 w-4" />
      ) : isPdf ? (
        <FileText className="h-4 w-4" />
      ) : (
        <ImageIcon className="h-4 w-4" />
      )}
    </div>
  );
}

function FilterPill({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = Boolean(value);
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <label
      className={cn(
        "relative inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-border/70 bg-card text-foreground hover:border-foreground/40",
      )}
    >
      <span className="max-w-[180px] truncate">{current.label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UploadDialog({
  vehicles,
  onClose,
  onUploaded,
}: {
  vehicles: Pick<Vehicle, "id" | "brand" | "model" | "year">[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [category, setCategory] = useState<DocumentCategory>("carte_grise");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicleId || !file) {
      toast.error("Champs manquants", "Sélectionnez un véhicule et un fichier.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("Fichier trop volumineux", `Limite ${MAX_SIZE_MB} Mo.`);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setBusy(false);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehicle-documents")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      toast.error("Upload échoué", upErr.message);
      setBusy(false);
      return;
    }
    const { error: dbErr } = await supabase.from("vehicle_documents").insert({
      vehicle_id: vehicleId,
      dealer_id: user.id,
      name: file.name,
      storage_path: path,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
      category,
    });
    if (dbErr) {
      toast.error("Erreur enregistrement", dbErr.message);
      await supabase.storage.from("vehicle-documents").remove([path]);
      setBusy(false);
      return;
    }
    toast.success("Document ajouté");
    setBusy(false);
    onUploaded();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <div>
          <h3 className="text-[18px] font-semibold tracking-tight">Ajouter un document</h3>
          <p className="text-[13px] text-muted-foreground">Lié à un de vos véhicules.</p>
        </div>

        <Field label="Type" required>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          >
            {ADMIN_DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
            <option disabled>──────</option>
            <option value="photo_before">{DOCUMENT_CATEGORY_LABELS.photo_before}</option>
            <option value="photo_after">{DOCUMENT_CATEGORY_LABELS.photo_after}</option>
            <option value="video_before">{DOCUMENT_CATEGORY_LABELS.video_before}</option>
            <option value="video_after">{DOCUMENT_CATEGORY_LABELS.video_after}</option>
          </Select>
        </Field>

        <Field label="Véhicule" required>
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.brand} {v.model} · {v.year}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fichier" required hint={`Image / PDF / Vidéo · max ${MAX_SIZE_MB} Mo`}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:font-medium hover:file:bg-foreground/90"
          />
          {file && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              {file.name} · {formatBytes(file.size)}
            </p>
          )}
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button type="submit" loading={busy}>
            <Upload className="h-4 w-4" /> Importer
          </Button>
        </div>
      </form>
    </div>
  );
}

function PreviewModal({
  doc,
  url,
  onClose,
}: {
  doc: DocWithVehicle;
  url?: string;
  onClose: () => void;
}) {
  const isImage = doc.mime_type.startsWith("image/");
  const isVideo = doc.mime_type.startsWith("video/");
  const isPdf = doc.mime_type === "application/pdf";

  if (!url) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <div className="rounded-xl bg-background p-8 text-center text-sm">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Chargement…
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-5xl overflow-hidden rounded-xl bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <p className="truncate text-sm font-medium">{doc.name}</p>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
        <div className="flex max-h-[80vh] items-center justify-center bg-black/20 p-2">
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={doc.name} className="max-h-[78vh] w-auto object-contain" />
          )}
          {isVideo && <video src={url} controls className="max-h-[78vh] w-full" />}
          {isPdf && <iframe src={url} title={doc.name} className="h-[78vh] w-[80vw] bg-white" />}
          {!isImage && !isVideo && !isPdf && (
            <div className="p-8 text-center text-sm">
              <a
                href={url}
                className="text-primary underline"
                target="_blank"
                rel="noreferrer"
              >
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
