const PLACEHOLDER_PATTERNS = [
  /^https:\/\/x+\.supabase\.co$/i,
  /^eyJhbGciOi\.\.\.$/i,
  /^your[-_]/i,
  /^xxx/i,
];

function isPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return false;
  return !isPlaceholder(url) && !isPlaceholder(key);
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url || isPlaceholder(url)) {
    throw new Error(missingEnvMessage());
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key || isPlaceholder(key)) {
    throw new Error(missingEnvMessage());
  }
  return key;
}

export function missingEnvMessage(): string {
  return [
    "Variables Supabase manquantes ou encore aux valeurs d'exemple.",
    "",
    "1. cp .env.example .env.local",
    "2. Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "   (Supabase → Project Settings → API)",
    "",
    "https://supabase.com/dashboard/project/_/settings/api",
  ].join("\n");
}
