import { redirect } from "next/navigation";
import { PageBody, PageHeader } from "@/components/page-header";
import { GarageForm } from "./garage-form";
import { getServerAuth } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GarageProfilePage() {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Mon garage"
        description="Profil marchand affiché sur vos fiches véhicule et dans le réseau."
      />
      <PageBody>
        <GarageForm
          userId={user.id}
          email={user.email ?? ""}
          defaults={{
            company_name: profile?.company_name ?? "",
            phone: profile?.phone ?? "",
            location: profile?.location ?? "",
            siret: profile?.siret ?? "",
            specialties: profile?.specialties ?? "",
          }}
        />
      </PageBody>
    </>
  );
}
