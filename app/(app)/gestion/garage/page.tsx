import { redirect } from "next/navigation";
import { PageBody, PageHeader } from "@/components/page-header";
import { GarageForm } from "./garage-form";
import { DownloadProjectContextLink } from "@/components/download-project-context-link";
import { getServerAuth } from "@/lib/supabase/server";
import { PROFILE_APP_SELECT } from "@/lib/data/profile-select";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GarageProfilePage() {
  const { supabase, user } = await getServerAuth();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(PROFILE_APP_SELECT)
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
            tagline: profile?.tagline ?? "",
            website_url: profile?.website_url ?? "",
            social_facebook_url: profile?.social_facebook_url ?? "",
            social_instagram_url: profile?.social_instagram_url ?? "",
            social_linkedin_url: profile?.social_linkedin_url ?? "",
            social_x_url: profile?.social_x_url ?? "",
            logo_storage_path: profile?.logo_storage_path ?? "",
            banner_storage_path: profile?.banner_storage_path ?? "",
          }}
        />
        <div className="mt-8 flex justify-center border-t border-border/60 pt-6">
          <DownloadProjectContextLink variant="text" />
        </div>
      </PageBody>
    </>
  );
}
