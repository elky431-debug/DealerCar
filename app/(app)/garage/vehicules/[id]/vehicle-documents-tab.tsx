"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Shield,
  ClipboardList,
  Receipt,
  FileCheck,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { DocumentCategory, VehicleDocument } from "@/lib/types";

type UploadKind =
  | "carte_grise"
  | "controle_technique"
  | "facture"
  | "assurance"
  | "cession";

const UPLOAD_KINDS: { id: UploadKind; label: string; category: DocumentCategory }[] = [
  { id: "carte_grise", label: "Carte grise", category: "carte_grise" },
  { id: "controle_technique", label: "Contrôle technique", category: "controle_technique" },
  { id: "facture", label: "Factures", category: "facture" },
  { id: "assurance", label: "Assurance", category: "admin" },
  { id: "cession", label: "Déclaration de cession", category: "declaration_cession" },
];

const TYPE_LABELS: Record<string, string> = {
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  facture: "Facture",
  declaration_cession: "Déclaration de cession",
  admin: "Assurance",
};

function typeIcon(category: string) {
  switch (category) {
    case "carte_grise":
      return FileText;
    case "controle_technique":
      return ClipboardList;
    case "facture":
      return Receipt;
    case "declaration_cession":
      return FileCheck;
    default:
      return Shield;
  }
}

interface Props {
  vehicleId: string;
  userId: string;
  documents: VehicleDocument[];
}

export function VehicleDocumentsTab({ vehicleId, userId, documents }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadKind, setUploadKind] = useState<UploadKind>("carte_grise");
  const [urls, setUrls] = useState<Record<string, string>>({});

  const adminDocs = documents.filter((d) =>
    ["carte_grise", "controle_technique", "facture", "declaration_cession", "admin"].includes(
      d.category,
    ),
  );

  useEffect(() => {
    if (!adminDocs.length) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("vehicle-documents")
        .createSignedUrls(
          adminDocs.map((d) => d.storage_path),
          60 * 60,
        );
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      data.forEach((entry, i) => {
        if (entry.signedUrl) map[adminDocs[i].id] = entry.signedUrl;
      });
      setUrls(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [adminDocs]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const kind = UPLOAD_KINDS.find((k) => k.id === uploadKind)!;
    setBusy(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
        const path = `${userId}/${vehicleId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vehicle-documents")
          .upload(path, file, { contentType: file.type || "application/pdf" });
        if (upErr) {
          toast.error("Upload échoué", upErr.message);
          continue;
        }
        const { error: dbErr } = await supabase.from("vehicle_documents").insert({
          vehicle_id: vehicleId,
          dealer_id: userId,
          name: file.name,
          storage_path: path,
          mime_type: file.type || "application/pdf",
          size_bytes: file.size,
          category: kind.category,
        });
        if (dbErr) {
          toast.error("Enregistrement impossible", dbErr.message);
          await supabase.storage.from("vehicle-documents").remove([path]);
        }
      }
      toast.success("Document ajouté");
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700">Type de document</label>
        <select
          value={uploadKind}
          onChange={(e) => setUploadKind(e.target.value as UploadKind)}
          className="dl-input mt-1.5 max-w-xs"
        >
          {UPLOAD_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {adminDocs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
            Aucun document pour ce véhicule.
          </p>
        ) : (
          adminDocs.map((doc) => {
            const Icon = typeIcon(doc.category);
            const url = urls[doc.id];
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-400">
                    {TYPE_LABELS[doc.category] ?? doc.category} · {formatDate(doc.created_at)}
                  </p>
                </div>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-brand hover:underline"
                  >
                    Voir
                  </a>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
            );
          })
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void handleUpload(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 py-2.5 text-sm text-gray-500 transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "+ Ajouter un document"}
      </button>
    </div>
  );
}
