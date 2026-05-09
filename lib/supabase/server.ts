import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component context — cookies are read-only here.
            // Refresh handling happens in middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // ignore
          }
        },
      },
    },
  );
}

/**
 * Auth rapide côté serveur : lit la session depuis les cookies sans appel réseau
 * vers l’API Auth Supabase (contrairement à `getUser()`).
 * À utiliser dans les Server Components / route handlers pour navigation fluide.
 * Pour une action très sensible, préférer `supabase.auth.getUser()` ponctuellement.
 */
export async function getServerAuth(): Promise<{
  supabase: ReturnType<typeof createClient>;
  user: User | null;
}> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}
