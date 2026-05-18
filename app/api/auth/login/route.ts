import { NextResponse } from "next/server";
import { getAdminEmails } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({
    email: "",
    password: "",
  }));

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const isInvalidApiKey = error.message.toLowerCase().includes("invalid api key");

      return NextResponse.json(
        {
          error: isInvalidApiKey
            ? "Supabase API key is invalid. Check SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY."
            : error.message,
        },
        { status: isInvalidApiKey ? 500 : 401 },
      );
    }

    const userEmail = data.user?.email?.toLowerCase();
    const adminEmails = getAdminEmails();

    if (!userEmail || (adminEmails.length > 0 && !adminEmails.includes(userEmail))) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "This account is not authorized for admin access" }, { status: 403 });
    }

    return NextResponse.json({
      admin: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to sign in",
      },
      { status: 500 },
    );
  }
}
