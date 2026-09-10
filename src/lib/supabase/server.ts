import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-supabase.supabase.co"
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  return createClient<Database>(
    url,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
