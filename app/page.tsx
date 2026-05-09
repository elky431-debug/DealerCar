import { redirect } from "next/navigation";
import { MarketingLanding } from "@/components/landing/marketing-page";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerAuth } from "@/lib/supabase/server";

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const { user } = await getServerAuth();

    if (user) {
      redirect("/dashboard");
    }
  }

  return <MarketingLanding />;
}
