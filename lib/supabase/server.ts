import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

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
 * Auth lecture rapide pour Server Components : une seule lecture cookie par requête
 * (React.cache déduplique entre layout + pages). Préfère `getSession` à `getUser`
 * pour éviter un aller-retour réseau vers le serveur Auth à chaque segment RSC.
 *
 * Pour les opérations sensibles (paiement, etc.), utiliser `getUser()` explicitement.
 */
export const getServerAuth = cache(async () => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  return { supabase, user };
});

/** Route Handlers / API : session cookie sans `cache()` (hors arbre React). */
export async function getApiUser() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
}
