import { cookies } from "next/headers";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerAuthEnv, getSupabaseServiceRoleKey } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAuthKey } = getSupabaseServerAuthEnv();

  return createServerClient(supabaseUrl, supabaseAuthKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot set cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

export function createAdminClient() {
  const { supabaseUrl } = getSupabaseServerAuthEnv();

  return createSupabaseClient(supabaseUrl, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
