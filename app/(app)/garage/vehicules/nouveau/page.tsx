import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page-header";
import { VehicleForm } from "@/components/vehicle-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewVehiclePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <>
      <PageHeader
        title="Nouveau véhicule"
        description="Ajout rapide en moins d'une minute."
        actions={
          <Link href="/garage/vehicules">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          </Link>
        }
      />
      <PageBody>
        <VehicleForm userId={user.id} defaultLocation={profile?.location} />
      </PageBody>
    </>
  );
}
