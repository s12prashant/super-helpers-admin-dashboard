import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  addUtcDays,
  buildUserFilterSearchWhere,
  parseUserFilterSearchFilters,
  startOfIstDay,
} from "@/lib/server/user-filter-search-filters";
import type {
  UserFilterSearchAnalyticsData,
  UserFilterSearchBreakdown,
} from "@/lib/user-filter-search";

const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

type DailyRow = { date: Date | string; count: bigint | number };
type BreakdownRow = { id?: string | number | null; label: string | null; count: bigint | number };

// Prisma models in deployments of this project may expose createdAt as either
// timestamp or timestamptz. This expression converts both representations to an
// Indian calendar date without relying on the database session timezone.
const istCalendarDay = Prisma.sql`
  CASE
    WHEN pg_typeof(ufs."createdAt")::text = 'timestamp with time zone'
      THEN (ufs."createdAt"::timestamptz AT TIME ZONE 'Asia/Kolkata')::date
    ELSE (ufs."createdAt"::timestamp + INTERVAL '5 hours 30 minutes')::date
  END
`;

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseUserFilterSearchFilters(url);
  const today = getTodayInIndia();
  const toLabel = filters.toLabel ?? today;
  const fromLabel = filters.fromLabel ?? formatIstDate(addUtcDays(startOfIstDay(toLabel), -(DEFAULT_RANGE_DAYS - 1)));
  const from = startOfIstDay(fromLabel);
  const toExclusive = addUtcDays(startOfIstDay(toLabel), 1);
  const rangeDays = Math.round((toExclusive.getTime() - from.getTime()) / 86_400_000);

  if (rangeDays < 1) {
    return NextResponse.json(
      { status: 0, message: "The start date must not be after the end date" },
      { status: 400 },
    );
  }

  if (rangeDays > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { status: 0, message: `Analytics date range cannot exceed ${MAX_RANGE_DAYS} days` },
      { status: 400 },
    );
  }

  const compare = url.searchParams.get("compare") !== "false";
  const currentWhere = buildUserFilterSearchWhere(filters, { from, toExclusive });
  const previousFrom = addUtcDays(from, -rangeDays);
  const previousToExclusive = from;
  const previousFromLabel = formatIstDate(previousFrom);
  const previousToLabel = formatIstDate(addUtcDays(previousToExclusive, -1));
  const previousWhere = buildUserFilterSearchWhere(filters, {
    from: previousFrom,
    toExclusive: previousToExclusive,
  });

  try {
    const prisma = getPrisma();
    // Keep analytics reads sequential to avoid consuming several connections
    // from a serverless Prisma pool for a single dashboard request.
    const dailyRows = await prisma.$queryRaw<DailyRow[]>(dailyTrendQuery(currentWhere, fromLabel, toLabel));
    const previousDailyRows = compare
      ? await prisma.$queryRaw<DailyRow[]>(dailyTrendQuery(previousWhere, previousFromLabel, previousToLabel))
      : [];
    const categoryRows = await prisma.$queryRaw<BreakdownRow[]>(Prisma.sql`
      SELECT
        btrim(category_id.value) AS id,
        COALESCE(wc.name, 'Unknown (#' || btrim(category_id.value) || ')') AS label,
        COUNT(*) AS count
      FROM "UserFilterSearch" ufs
      CROSS JOIN LATERAL unnest(string_to_array(COALESCE(ufs."workCat", ''), ',')) AS category_id(value)
      LEFT JOIN "workCategory" wc ON wc.id::text = btrim(category_id.value)
      ${currentWhere}
        AND btrim(category_id.value) <> ''
      GROUP BY btrim(category_id.value), wc.name
      ORDER BY count DESC, label ASC
      LIMIT 10
    `);
    const workTimeRows = await prisma.$queryRaw<BreakdownRow[]>(Prisma.sql`
      SELECT
        btrim(work_time_id.value) AS id,
        COALESCE(wt.name, 'Unknown (#' || btrim(work_time_id.value) || ')') AS label,
        COUNT(*) AS count
      FROM "UserFilterSearch" ufs
      CROSS JOIN LATERAL unnest(string_to_array(COALESCE(ufs."workTime", ''), ',')) AS work_time_id(value)
      LEFT JOIN "workTime" wt ON wt.id::text = btrim(work_time_id.value)
      ${currentWhere}
        AND btrim(work_time_id.value) <> ''
      GROUP BY btrim(work_time_id.value), wt.name
      ORDER BY count DESC, label ASC
      LIMIT 10
    `);
    const genderRows = await prisma.$queryRaw<BreakdownRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(ufs.gender::text, ''), 'Not provided') AS label,
        COUNT(*) AS count
      FROM "UserFilterSearch" ufs
      ${currentWhere}
      GROUP BY COALESCE(NULLIF(ufs.gender::text, ''), 'Not provided')
      ORDER BY count DESC, label ASC
    `);
    const pincodeRows = await prisma.$queryRaw<BreakdownRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF(ufs.pincode::text, ''), 'Not provided') AS label,
        COUNT(*) AS count
      FROM "UserFilterSearch" ufs
      ${currentWhere}
      GROUP BY COALESCE(NULLIF(ufs.pincode::text, ''), 'Not provided')
      ORDER BY count DESC, label ASC
      LIMIT 10
    `);

    const currentCounts = dailyRows.map((row) => Number(row.count));
    const previousCounts = previousDailyRows.map((row) => Number(row.count));
    const totalSearches = currentCounts.reduce((total, count) => total + count, 0);
    const previousPeriodTotal = compare
      ? previousCounts.reduce((total, count) => total + count, 0)
      : null;
    const peakIndex = currentCounts.reduce(
      (best, count, index) => (count > (currentCounts[best] ?? -1) ? index : best),
      0,
    );
    const percentageChange =
      previousPeriodTotal === null || previousPeriodTotal === 0
        ? null
        : ((totalSearches - previousPeriodTotal) / previousPeriodTotal) * 100;

    const data: UserFilterSearchAnalyticsData = {
      summary: {
        totalSearches,
        averagePerDay: totalSearches / rangeDays,
        activeDays: currentCounts.filter((count) => count > 0).length,
        peakDay: {
          date: totalSearches > 0 ? normalizeDate(dailyRows[peakIndex]?.date) : null,
          count: totalSearches > 0 ? currentCounts[peakIndex] ?? 0 : 0,
        },
        previousPeriodTotal,
        percentageChange,
      },
      dailyTrend: dailyRows.map((row, index) => ({
        date: normalizeDate(row.date),
        count: Number(row.count),
        previousCount: compare ? previousCounts[index] ?? 0 : null,
      })),
      breakdowns: {
        workCategories: mapBreakdowns(categoryRows),
        workTimes: mapBreakdowns(workTimeRows),
        genders: mapBreakdowns(genderRows),
        pincodes: mapBreakdowns(pincodeRows),
      },
      meta: { from: fromLabel, to: toLabel, timezone: "Asia/Kolkata", compared: compare },
    };

    return NextResponse.json({ status: 1, message: "User search analytics fetched", data });
  } catch (error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to fetch user search analytics",
        error: error instanceof Error ? error.message : "Unknown Prisma error",
      },
      { status: 500 },
    );
  }
}

function dailyTrendQuery(where: Prisma.Sql, fromLabel: string, toLabel: string) {
  return Prisma.sql`
    WITH dates AS (
      SELECT generate_series(${fromLabel}::date, ${toLabel}::date, INTERVAL '1 day')::date AS day
    ), daily_counts AS (
      SELECT ${istCalendarDay} AS day, COUNT(*) AS count
      FROM "UserFilterSearch" ufs
      ${where}
      GROUP BY ${istCalendarDay}
    )
    SELECT dates.day AS date, COALESCE(daily_counts.count, 0) AS count
    FROM dates
    LEFT JOIN daily_counts ON daily_counts.day = dates.day
    ORDER BY dates.day ASC
  `;
}

function mapBreakdowns(rows: BreakdownRow[]): UserFilterSearchBreakdown[] {
  return rows.map((row) => ({
    ...(row.id === undefined || row.id === null ? {} : { id: String(row.id) }),
    label: row.label || "Not provided",
    count: Number(row.count),
  }));
}

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatIstDate(value: Date) {
  const shifted = new Date(value.getTime() + 330 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function normalizeDate(value: Date | string | undefined) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}
