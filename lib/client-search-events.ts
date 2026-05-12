import type { SupabaseClient } from "@supabase/supabase-js";

export async function logClientSearchEvent(
  supabase: SupabaseClient,
  searchId: string,
  eventType: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  await supabase.from("client_search_events").insert({
    search_id: searchId,
    event_type: eventType,
    payload,
  });
}
