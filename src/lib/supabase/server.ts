import { createClient } from "@supabase/supabase-js";

// Database generic will be applied after running: npx supabase gen types typescript
// See src/types/supabase.ts for the placeholder types used at call sites

function createSupabaseServer() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabase = createSupabaseServer();
