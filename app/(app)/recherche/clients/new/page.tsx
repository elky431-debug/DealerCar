"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ComponentType, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Car, Loader2, Lock, Save, User, Wallet } from "lucide-react";
import { PageBody } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CS_CARD, CS_EYEBROW, CS_PAGE_GUTTER } from "@/lib/client-search-ui";
import { cn } from "@/lib/utils";

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(CS_CARD, "overflow-hidden p-6 sm:p-8")}>
      <div className="mb-6 flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function NewClientSearchPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      client_name: String(fd.get("client_name") ?? "").trim(),
      client_phone: String(fd.get("client_phone") ?? "").trim() || null,
      client_notes: String(fd.get("client_notes") ?? "").trim() || null,
      brand: String(fd.get("brand") ?? "").trim(),
      model: String(fd.get("model") ?? "").trim(),
      version: String(fd.get("version") ?? "").trim() || null,
      fuel: String(fd.get("fuel") ?? "").trim() || null,
      gearbox: (() => {
        const g = String(fd.get("gearbox") ?? "");
        if (g === "automatic" || g === "manual") return g;
        return null;
      })(),
      budget_min: fd.get("budget_min") ? Number(fd.get("budget_min")) : null,
      budget_max: fd.get("budget_max") ? Number(fd.get("budget_max")) : null,
      mileage_max: fd.get("mileage_max") ? parseInt(String(fd.get("mileage_max")), 10) : null,
      year_min: fd.get("year_min") ? parseInt(String(fd.get("year_min")), 10) : null,
      geo_zone: String(fd.get("geo_zone") ?? "").trim() || null,
      distance_max_km: fd.get("distance_max_km") ? parseInt(String(fd.get("distance_max_km")), 10) : null,
      priority: String(fd.get("priority") ?? "normal"),
      internal_notes: String(fd.get("internal_notes") ?? "").trim() || null,
    };

    if (!payload.client_name || !payload.brand || !payload.model) {
      toast.error("Champs requis", "Nom client, marque et modèle.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/client-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      toast.success("Recherche créée");
      router.push(`/recherche/clients/${data.search.id}`);
    } catch (err) {
      toast.error("Échec", err instanceof Error ? err.message : "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageBody className="min-w-0 max-w-full overflow-x-hidden px-0 pb-12 pt-0">
      <div className={`border-b page-header-bar ${CS_PAGE_GUTTER} py-8`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-3">
            <Link
              href="/recherche/clients"
              className={`inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground`}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux recherches
            </Link>
            <div>
              <p className={CS_EYEBROW}>Nouvelle fiche</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-[2rem]">
                Recherche client
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                Une fois enregistrée, la fiche active le matching sur votre stock et le réseau, la shortlist
                et les sources pro.
              </p>
            </div>
          </div>
          <Button variant="outline" size="lg" className="h-12 shrink-0 rounded-xl" href="/recherche/clients">
            Annuler
          </Button>
        </div>
      </div>

      <div className={`${CS_PAGE_GUTTER} mx-auto max-w-3xl py-8 md:py-10`}>
        <form onSubmit={onSubmit} className="flex flex-col gap-6 md:gap-8">
          <FormSection
            icon={User}
            title="Client"
            description="Identité et notes visibles sur la fiche (hors notes internes)."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nom client" required>
                <Input name="client_name" required placeholder="ex. Mme Dupont" className="h-11 rounded-xl" />
              </Field>
              <Field label="Téléphone">
                <Input name="client_phone" type="tel" placeholder="06 …" className="h-11 rounded-xl" />
              </Field>
              <Field label="Notes client" className="sm:col-span-2">
                <Textarea
                  name="client_notes"
                  placeholder="Préférences, délais, contraintes…"
                  className="min-h-[100px] rounded-xl"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={Car}
            title="Véhicule recherché"
            description="Critères utilisés pour le scoring et les suggestions."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Marque" required>
                <Input name="brand" required placeholder="BMW" className="h-11 rounded-xl" />
              </Field>
              <Field label="Modèle" required>
                <Input name="model" required placeholder="X3" className="h-11 rounded-xl" />
              </Field>
              <Field label="Version">
                <Input name="version" placeholder="xDrive20d" className="h-11 rounded-xl" />
              </Field>
              <Field label="Carburant">
                <Input name="fuel" placeholder="Diesel, essence…" className="h-11 rounded-xl" />
              </Field>
              <Field label="Boîte">
                <Select name="gearbox" defaultValue="" className="h-11 rounded-xl">
                  <option value="">Indifférent</option>
                  <option value="automatic">Automatique</option>
                  <option value="manual">Manuelle</option>
                </Select>
              </Field>
              <Field label="Priorité">
                <Select name="priority" defaultValue="normal" className="h-11 rounded-xl">
                  <option value="normal">Normale</option>
                  <option value="urgent">Urgente</option>
                  <option value="premium">Premium</option>
                </Select>
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={Wallet}
            title="Budget & périmètre"
            description="Affine le matching (prix, kilométrage, zone)."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Budget min (€)">
                <Input name="budget_min" type="number" min={0} step={100} placeholder="15 000" className="h-11 rounded-xl" />
              </Field>
              <Field label="Budget max (€)">
                <Input name="budget_max" type="number" min={0} step={100} placeholder="28 000" className="h-11 rounded-xl" />
              </Field>
              <Field label="Kilométrage max">
                <Input name="mileage_max" type="number" min={0} step={1000} placeholder="120 000" className="h-11 rounded-xl" />
              </Field>
              <Field label="Année minimum">
                <Input
                  name="year_min"
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  placeholder="2018"
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label="Zone géographique">
                <Input name="geo_zone" placeholder="Lyon, région…" className="h-11 rounded-xl" />
              </Field>
              <Field label="Distance max (km)">
                <Input name="distance_max_km" type="number" min={0} placeholder="150" className="h-11 rounded-xl" />
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={Lock}
            title="Notes internes"
            description="Mémo terrain — non partagée avec le client."
          >
            <Field label="Visible uniquement par vous">
              <Textarea
                name="internal_notes"
                placeholder="ex. doit absolument avoir la caméra 360°."
                className="min-h-[100px] rounded-xl"
              />
            </Field>
          </FormSection>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" className="h-12 rounded-xl px-8" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Créer la recherche
            </Button>
            <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl" href="/recherche/clients">
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </PageBody>
  );
}
