import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: "supabase",
          error: error.message,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      service: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "supabase",
        error: error instanceof Error ? error.message : "Unknown health check failure.",
      },
      { status: 503 },
    );
  }
}
