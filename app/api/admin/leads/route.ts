import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import {
  isLeadStatus,
  leadStatuses,
  normalizePhoneNumber,
  parseDate,
  toOptionalString,
  type SuperHelperLead,
} from "@/lib/leads";

const LEADS_TABLE = "superHelperLead";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = isLeadStatus(url.searchParams.get("status")) ? url.searchParams.get("status") : null;
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"));
  const search = url.searchParams.get("q")?.trim() ?? "";
  const supabase = createAdminClient();

  let query = supabase.from(LEADS_TABLE).select("*").order("created_at", { ascending: false }).limit(300);

  if (status) {
    query = query.eq("status", status);
  }

  if (from) {
    query = query.gte("created_at", from.toISOString());
  }

  if (to) {
    query = query.lte("created_at", to.toISOString());
  }

  if (search) {
    const escaped = search.replaceAll(",", "\\,");
    query = query.or(
      `phone_number.ilike.%${escaped}%,name.ilike.%${escaped}%,service_interest.ilike.%${escaped}%,source.ilike.%${escaped}%`,
    );
  }

  const [itemsResult, countsResult] = await Promise.all([
    query,
    supabase.from(LEADS_TABLE).select("status").returns<Array<Pick<SuperHelperLead, "status">>>(),
  ]);

  if (itemsResult.error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to fetch super helper leads",
        error: itemsResult.error.message,
      },
      { status: 500 },
    );
  }

  if (countsResult.error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to fetch super helper lead counts",
        error: countsResult.error.message,
      },
      { status: 500 },
    );
  }

  const counts = leadStatuses.map((leadStatus) => ({
    status: leadStatus,
    count: (countsResult.data ?? []).filter((item) => item.status === leadStatus).length,
  }));

  return NextResponse.json({
    status: 1,
    message: "Super helper leads fetched",
    data: itemsResult.data ?? [],
    counts,
    statuses: leadStatuses,
  });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phoneNumber = toOptionalString(body?.phoneNumber);

  if (!phoneNumber || phoneNumber.length < 8 || phoneNumber.length > 20) {
    return NextResponse.json({ status: 0, message: "Phone number must be 8 to 20 characters" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert({
      name: toOptionalString(body?.name) ?? null,
      phone_number: normalizePhoneNumber(phoneNumber),
      service_interest: toOptionalString(body?.serviceInterest) ?? null,
      source: toOptionalString(body?.source) ?? null,
      notes: toOptionalString(body?.notes) ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        status: 0,
        message: error.code === "23505" ? "This phone number already exists in the lead list" : "Unable to create lead",
        error: error.message,
      },
      { status: error.code === "23505" ? 409 : 500 },
    );
  }

  return NextResponse.json(
    {
      status: 1,
      message: "Super helper lead created",
      data,
    },
    { status: 201 },
  );
}
