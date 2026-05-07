"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Plus, Phone, Mail, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LeadFormDialog } from "@/components/lead-form";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import {
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatus,
  type LeadWithVehicle,
  type Vehicle,
} from "@/lib/types";

interface Props {
  userId: string;
  leads: LeadWithVehicle[];
  vehicles: Pick<Vehicle, "id" | "brand" | "model" | "year">[];
  emptyMode?: boolean;
}

export function ClientsList({ userId, leads, vehicles, emptyMode = false }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | LeadStatus>("");

  const filtered = useMemo(() => {
    let xs = leads;
    if (statusFilter) xs = xs.filter((l) => l.status === statusFilter);
    if (q) {
      const needle = q.toLowerCase();
      xs = xs.filter(
        (l) =>
          l.name.toLowerCase().includes(needle) ||
          (l.phone ?? "").toLowerCase().includes(needle) ||
          (l.email ?? "").toLowerCase().includes(needle),
      );
    }
    return xs;
  }, [leads, q, statusFilter]);

  async function handleDelete(lead: Lead) {
    if (!confirm(`Supprimer ${lead.name} ?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("vehicle_leads").delete().eq("id", lead.id);
    if (error) {
      toast.error("Suppression impossible", error.message);
      return;
    }
    toast.success("Supprimé");
    startTransition(() => router.refresh());
  }

  if (emptyMode) {
    return (
      <>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Ajouter un client
        </Button>
        <LeadFormDialog
          open={creating}
          onClose={() => setCreating(false)}
          userId={userId}
          vehicles={vehicles}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="field-label">Recherche</label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              placeholder="Nom, téléphone, email…"
            />
          </div>
        </div>
        <div className="min-w-[180px]">
          <label className="field-label">Statut</label>
          <Select
            className="mt-1.5"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
          >
            <option value="">Tous</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun client ne correspond à ces filtres.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{lead.name}</p>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <Mail className="h-3 w-3" /> {lead.email}
                      </a>
                    )}
                    <span>Ajouté le {formatDate(lead.created_at)}</span>
                  </div>
                  {lead.vehicles && (
                    <Link
                      href={`/garage/vehicules/${lead.vehicles.id}`}
                      className="inline-flex text-xs font-medium text-primary hover:underline"
                    >
                      → {lead.vehicles.brand} {lead.vehicles.model} ({lead.vehicles.year})
                    </Link>
                  )}
                  {lead.message && (
                    <p className="mt-1 text-sm text-foreground/80">{lead.message}</p>
                  )}
                  {lead.notes && (
                    <p className="mt-1 text-xs italic text-muted-foreground">{lead.notes}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(lead)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(lead)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeadFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        userId={userId}
        vehicles={vehicles}
      />
      <LeadFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        userId={userId}
        vehicles={vehicles}
        initial={editing ?? undefined}
      />
    </div>
  );
}
