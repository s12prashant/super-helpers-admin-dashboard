import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import {
  assistantStatuses,
  getExclusiveEndDate,
  isAssistantStatus,
  mapAssistantRegistrationRow,
  parseDateFilter,
  type AssistantRegistrationRow,
  type AssistantStatus,
} from "@/lib/assistants";
import { getPrisma } from "@/lib/prisma";

type CountRow = {
  count: bigint | number;
};

type StatusCountRow = {
  status: AssistantStatus;
  count: bigint | number;
};

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedStatus = url.searchParams.get("status");
  const selectedStatus = isAssistantStatus(requestedStatus) ? requestedStatus : null;
  const from = parseDateFilter(url.searchParams.get("from"));
  const toExclusive = getExclusiveEndDate(url.searchParams.get("to"));
  const pageSize = parsePageSize(url.searchParams.get("pageSize"));
  const requestedPage = parsePage(url.searchParams.get("page"));
  const filters = buildAssistantFilters({ status: selectedStatus, from, toExclusive });
  const dateOnlyFilters = buildAssistantFilters({ status: null, from, toExclusive });

  try {
    const prisma = getPrisma();
    const [allTimeRows, filteredRows, statusRows] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) AS count FROM assistant`,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM assistant
        ${filters}
      `,
      prisma.$queryRaw<StatusCountRow[]>`
        SELECT status::text AS status, COUNT(*) AS count
        FROM assistant
        ${dateOnlyFilters}
        GROUP BY status
      `,
    ]);
    const totalRegistered = Number(filteredRows[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalRegistered / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const recentRows = await prisma.$queryRaw<AssistantRegistrationRow[]>`
      SELECT id, name, mobile, city, pincode, status::text AS status, created_at
      FROM assistant
      ${filters}
      ORDER BY created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const countsByStatus = assistantStatuses.map((assistantStatus) => ({
      status: assistantStatus,
      count: Number(statusRows.find((row) => row.status === assistantStatus)?.count ?? 0),
    }));

    return NextResponse.json({
      status: 1,
      message: "Assistant registration summary fetched",
      data: {
        totalRegistered,
        allTimeRegistered: Number(allTimeRows[0]?.count ?? 0),
        pagination: {
          page,
          pageSize,
          totalPages,
        },
        countsByStatus,
        recentAssistants: recentRows.map(mapAssistantRegistrationRow),
      },
      filters: {
        status: selectedStatus,
        from: from?.toISOString() ?? null,
        to: toExclusive?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to fetch assistant registration summary",
        error: error instanceof Error ? error.message : "Unknown Prisma error",
      },
      { status: 500 },
    );
  }
}

function parsePage(value: string | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(parsed, MAX_PAGE_SIZE);
}

function buildAssistantFilters({
  status,
  from,
  toExclusive,
}: {
  status: AssistantStatus | null;
  from: Date | null;
  toExclusive: Date | null;
}) {
  const filters: Prisma.Sql[] = [];

  if (status) {
    filters.push(Prisma.sql`status = ${status}::"ProfileStatus"`);
  }

  if (from) {
    filters.push(Prisma.sql`created_at >= ${from}`);
  }

  if (toExclusive) {
    filters.push(Prisma.sql`created_at < ${toExclusive}`);
  }

  if (filters.length === 0) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`;
}
