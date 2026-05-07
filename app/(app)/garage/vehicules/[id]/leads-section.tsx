"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadFormDialog } from "@/components/lead-form";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/lib/types";

interface Props {
  vehicleId: string;
  userId: string;
  leads: Lead[];
}

export function LeadsSection({ vehicleId, userId, leads }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Lead | null>(null);
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {leads.length} client{leads.length > 1 ? "s" : ""} intéressé{leads.length > 1 ? "s" : ""}
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Ajouter un client
        </Button>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun client intéressé pour ce véhicule.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
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
        vehicleId={vehicleId}
      />
      <LeadFormDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        userId={userId}
        vehicleId={vehicleId}
        initial={editing ?? undefined}
      />
    </div>
  );
}
