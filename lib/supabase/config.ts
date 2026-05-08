/**
 * True when public Supabase env vars are set (local dev / production).
 * When false, middleware skips the Supabase client and auth routes behave as logged-out.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}
