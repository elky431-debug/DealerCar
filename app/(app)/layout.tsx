import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getServerAuth } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getServerAuth();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,company_name,phone,location,siret,specialties,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return <AppShell profile={profile ?? null}>{children}</AppShell>;
}
