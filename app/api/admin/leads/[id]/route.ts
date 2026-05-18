import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { isLeadStatus, parseDate, toOptionalString } from "@/lib/leads";

const LEADS_TABLE = "superHelperLead";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: Params) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ status: 0, message: "Invalid lead id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const data: Record<string, string | number | null> = {};

  if (Object.hasOwn(body ?? {}, "name")) {
    data.name = toOptionalString(body.name) ?? null;
  }

  if (Object.hasOwn(body ?? {}, "serviceInterest")) {
    data.service_interest = toOptionalString(body.serviceInterest) ?? null;
  }

  if (Object.hasOwn(body ?? {}, "source")) {
    data.source = toOptionalString(body.source) ?? null;
  }

  if (Object.hasOwn(body ?? {}, "status")) {
    if (!isLeadStatus(body.status)) {
      return NextResponse.json({ status: 0, message: "Invalid lead status" }, { status: 400 });
    }

    data.status = body.status;
  }

  if (Object.hasOwn(body ?? {}, "notes")) {
    data.notes = toOptionalString(body.notes) ?? null;
  }

  for (const [inputKey, columnName] of [
    ["lastContactedAt", "last_contacted_at"],
    ["replyReceivedAt", "reply_received_at"],
    ["agreedAt", "agreed_at"],
  ] as const) {
    if (!Object.hasOwn(body ?? {}, inputKey)) {
      continue;
    }

    if (body[inputKey] === null || body[inputKey] === "") {
      data[columnName] = null;
      continue;
    }

    const date = parseDate(body[inputKey]);

    if (!date) {
      return NextResponse.json({ status: 0, message: `Invalid ${inputKey}` }, { status: 400 });
    }

    data[columnName] = date.toISOString();
  }

  if (Object.hasOwn(body ?? {}, "registeredAssistantId")) {
    if (body.registeredAssistantId === null || body.registeredAssistantId === "") {
      data.registered_assistant_id = null;
    } else {
      const registeredAssistantId = Number(body.registeredAssistantId);

      if (!Number.isInteger(registeredAssistantId) || registeredAssistantId <= 0) {
        return NextResponse.json({ status: 0, message: "Invalid registered assistant id" }, { status: 400 });
      }

      data.registered_assistant_id = registeredAssistantId;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ status: 0, message: "No lead update fields provided" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: item, error } = await supabase.from(LEADS_TABLE).update(data).eq("id", id).select("*").single();

  if (error) {
    return NextResponse.json(
      {
        status: 0,
        message: error.code === "PGRST116" ? "Lead not found" : "Unable to update super helper lead",
        error: error.message,
      },
      { status: error.code === "PGRST116" ? 404 : 500 },
    );
  }

  return NextResponse.json({
    status: 1,
    message: "Super helper lead updated",
    data: item,
  });
}
