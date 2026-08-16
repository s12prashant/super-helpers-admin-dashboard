import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  buildUserFilterSearchWhere,
  parseUserFilterSearchFilters,
} from "@/lib/server/user-filter-search-filters";
import {
  mapUserFilterSearchRow,
  userFilterSearchPageSizeOptions,
  type UserFilterOption,
  type UserFilterSearchRow,
} from "@/lib/user-filter-search";

const DEFAULT_PAGE_SIZE = 25;

type CountRow = { count: bigint | number };
type GenderRow = { gender: string | null };

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ status: 0, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const filters = parseUserFilterSearchFilters(url);
  const requestedPage = parsePositiveInteger(url.searchParams.get("page")) ?? 1;
  const pageSize = parsePageSize(url.searchParams.get("pageSize"));
  const where = buildUserFilterSearchWhere(filters);

  try {
    const prisma = getPrisma();
    const [countRows, workCategories, workTimes, genderRows] = await Promise.all([
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM "UserFilterSearch" ufs
        ${where}
      `),
      prisma.$queryRaw<UserFilterOption[]>`
        SELECT id, name
        FROM "workCategory"
        ORDER BY name ASC
      `,
      prisma.$queryRaw<UserFilterOption[]>`
        SELECT id, name
        FROM "workTime"
        ORDER BY name ASC
      `,
      prisma.$queryRaw<GenderRow[]>`
        SELECT DISTINCT gender::text AS gender
        FROM "UserFilterSearch"
        WHERE gender IS NOT NULL
        ORDER BY gender ASC
      `,
    ]);
    const totalItems = Number(countRows[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const rows = await prisma.$queryRaw<UserFilterSearchRow[]>(Prisma.sql`
      SELECT
        ufs.id,
        ufs."workCat" AS "workCategoryId",
        work_category_names.name AS "workCategoryName",
        ufs."workTime" AS "workTimeId",
        work_time_names.name AS "workTimeName",
        ufs.gender::text AS gender,
        ufs.pincode::text AS pincode,
        ufs."createdAt" AS "createdAt"
      FROM "UserFilterSearch" ufs
      LEFT JOIN LATERAL (
        SELECT string_agg(
          COALESCE(wc.name, 'Unknown (#' || btrim(category_id.value) || ')'),
          ', ' ORDER BY category_id.position
        ) AS name
        FROM unnest(string_to_array(COALESCE(ufs."workCat", ''), ','))
          WITH ORDINALITY AS category_id(value, position)
        LEFT JOIN "workCategory" wc ON wc.id::text = btrim(category_id.value)
        WHERE btrim(category_id.value) <> ''
      ) work_category_names ON TRUE
      LEFT JOIN LATERAL (
        SELECT string_agg(
          COALESCE(wt.name, 'Unknown (#' || btrim(work_time_id.value) || ')'),
          ', ' ORDER BY work_time_id.position
        ) AS name
        FROM unnest(string_to_array(COALESCE(ufs."workTime", ''), ','))
          WITH ORDINALITY AS work_time_id(value, position)
        LEFT JOIN "workTime" wt ON wt.id::text = btrim(work_time_id.value)
        WHERE btrim(work_time_id.value) <> ''
      ) work_time_names ON TRUE
      ${where}
      ORDER BY ufs."createdAt" DESC NULLS LAST, ufs.id DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    return NextResponse.json({
      status: 1,
      message: "User filter searches fetched",
      data: {
        items: rows.map(mapUserFilterSearchRow),
        workCategories: workCategories.map(mapOption),
        workTimes: workTimes.map(mapOption),
        genders: genderRows.map((row) => row.gender).filter((value): value is string => Boolean(value)),
        pagination: { page, pageSize, totalPages, totalItems },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 0,
        message: "Unable to fetch user filter searches",
        error: error instanceof Error ? error.message : "Unknown Prisma error",
      },
      { status: 500 },
    );
  }
}

function mapOption(option: UserFilterOption): UserFilterOption {
  return { id: Number(option.id), name: option.name };
}

function parsePositiveInteger(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePageSize(value: string | null) {
  const parsed = Number(value);
  return userFilterSearchPageSizeOptions.includes(parsed as (typeof userFilterSearchPageSizeOptions)[number])
    ? parsed
    : DEFAULT_PAGE_SIZE;
}
