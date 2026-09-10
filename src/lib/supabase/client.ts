import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-supabase.supabase.co"
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  return createClient<Database>(url, key)
}
