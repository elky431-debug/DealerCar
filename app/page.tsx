import { redirect } from "next/navigation";
import { MarketingLanding } from "@/components/landing/marketing-page";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  }

  return <MarketingLanding />;
}
