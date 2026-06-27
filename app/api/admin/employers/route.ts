import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { mapEmployerRow, type EmployerRow } from "@/lib/employers";
import { getPrisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 300;

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const limit = parseLimit(url.searchParams.get("limit"));
  const searchFilter = search ? `%${search}%` : null;

  try {
    const prisma = getPrisma();
    const [countRows, rows] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint | number }>>`SELECT COUNT(*) AS count FROM employee`,
      prisma.$queryRaw<EmployerRow[]>`
        SELECT
          e.id,
          e.email,
          e.name,
          e.mobile,
          e.created_at,
          e.updated_at,
          COUNT(DISTINCT r.id) AS review_count,
          COUNT(DISTINCT sl.assitant_id) AS shortlist_count,
          COUNT(DISTINCT cl.assistant_id) AS contact_count,
          COUNT(DISTINCT ch.assistant_id) AS chat_count
        FROM employee e
        LEFT JOIN reviews r ON r.employee_id = e.id
        LEFT JOIN "assistantShortList" sl ON sl.employee_id = e.id
        LEFT JOIN "assistantContactList" cl ON cl.employee_id = e.id
        LEFT JOIN "employerChatList" ch ON ch.employee_id = e.id
        WHERE (
          ${searchFilter}::text IS NULL
          OR e.name ILIKE ${searchFilter}
          OR e.email ILIKE ${searchFilter}
          OR e.mobile ILIKE ${searchFilter}
        )
        GROUP BY e.id
        ORDER BY e.created_at DESC
        LIMIT ${limit}
      `,
    ]);

    const employers = rows.map(mapEmployerRow);
    const totalCount = Number(countRows[0]?.count ?? 0);

    return NextResponse.json({
      status: 1,
      message: "Employers fetched",
      data: employers,
      totalCount,
      resultCount: employers.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to fetch employers",
        error: error instanceof Error ? error.message : "Unknown Prisma error",
      },
      { status: 500 },
    );
  }
}

function parseLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
}
