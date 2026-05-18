const requiredClientEnv = {
  supabaseUrl: getSupabaseUrlValue(),
  supabaseAnonKey: firstPresent(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY
  ),
};

export function getSupabaseBrowserEnv() {
  if (!requiredClientEnv.supabaseUrl || !requiredClientEnv.supabaseAnonKey) {
    throw new Error(
      "Missing Supabase URL or anon key. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  return requiredClientEnv as {
    supabaseUrl: string;
    supabaseAnonKey: string;
  };
}

export function getSupabaseServerAuthEnv() {
  const supabaseUrl = getSupabaseUrlValue();
  const supabaseAuthKey = firstPresent(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!supabaseUrl || !supabaseAuthKey) {
    throw new Error(
      "Missing Supabase URL or API key. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return {
    supabaseUrl,
    supabaseAuthKey,
  };
}

export function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return key;
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeSupabaseUrl(url?: string) {
  return url?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function getSupabaseUrlValue() {
  return normalizeSupabaseUrl(
    firstPresent(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL)
  );
}

function firstPresent(...values: Array<string | undefined>) {
  return values.find((value) => value && value.trim().length > 0);
}
