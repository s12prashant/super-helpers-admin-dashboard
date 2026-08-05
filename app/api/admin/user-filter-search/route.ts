import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
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
  const workCategoryId = parsePositiveInteger(url.searchParams.get("workCat"));
  const workTimeId = parsePositiveInteger(url.searchParams.get("workTime"));
  const gender = url.searchParams.get("gender")?.trim() || null;
  const pincode = url.searchParams.get("pincode")?.trim() || null;
  const from = parseDate(url.searchParams.get("from"));
  const to = parseDate(url.searchParams.get("to"), true);
  const requestedPage = parsePositiveInteger(url.searchParams.get("page")) ?? 1;
  const pageSize = parsePageSize(url.searchParams.get("pageSize"));
  const filters: Prisma.Sql[] = [];

  if (workCategoryId) {
    filters.push(Prisma.sql`ufs."workCat" = ${workCategoryId}`);
  }

  if (workTimeId) {
    filters.push(Prisma.sql`ufs."workTime" = ${workTimeId}`);
  }

  if (gender) {
    filters.push(Prisma.sql`ufs.gender::text = ${gender}`);
  }

  if (pincode) {
    filters.push(Prisma.sql`ufs.pincode::text ILIKE ${`%${pincode}%`}`);
  }

  if (from) {
    filters.push(Prisma.sql`ufs."createdAt" >= ${from}`);
  }

  if (to) {
    filters.push(Prisma.sql`ufs."createdAt" < ${to}`);
  }

  const where = filters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty;

  try {
    const prisma = getPrisma();
    const [countRows, workCategories, workTimes, genderRows] = await Promise.all([
      prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM "userFilterSearch" ufs
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
        FROM "userFilterSearch"
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
        wc.name AS "workCategoryName",
        ufs."workTime" AS "workTimeId",
        wt.name AS "workTimeName",
        ufs.gender::text AS gender,
        ufs.pincode::text AS pincode,
        ufs."createdAt" AS "createdAt"
      FROM "userFilterSearch" ufs
      LEFT JOIN "workCategory" wc ON wc.id = ufs."workCat"
      LEFT JOIN "workTime" wt ON wt.id = ufs."workTime"
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

function parseDate(value: string | null, nextDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (nextDay) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return date;
}
