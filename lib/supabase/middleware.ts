import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { getSupabaseServerAuthEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  let supabaseAuthEnv: ReturnType<typeof getSupabaseServerAuthEnv>;

  try {
    supabaseAuthEnv = getSupabaseServerAuthEnv();
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseAuthEnv.supabaseUrl, supabaseAuthEnv.supabaseAuthKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}
