import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import { isAssistantStatus, mapAssistantRegistrationRow, type AssistantRegistrationRow } from "@/lib/assistants";
import { getPrisma } from "@/lib/prisma";

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
    return NextResponse.json({ status: 0, message: "Invalid assistant id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);

  if (!isAssistantStatus(body?.status)) {
    return NextResponse.json({ status: 0, message: "Invalid assistant status" }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<AssistantRegistrationRow[]>`
      UPDATE assistant
      SET status = ${body.status}::"ProfileStatus",
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, mobile, city, pincode, status::text AS status, created_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ status: 0, message: "Assistant not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: 1,
      message: "Assistant status updated",
      data: mapAssistantRegistrationRow(rows[0]),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to update assistant status",
        error: error instanceof Prisma.PrismaClientKnownRequestError ? error.message : "Unknown Prisma error",
      },
      { status: 500 },
    );
  }
}
