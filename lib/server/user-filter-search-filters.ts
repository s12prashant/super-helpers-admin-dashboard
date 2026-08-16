import "server-only";

import { Prisma } from "@prisma/client";

export type UserFilterSearchFilters = {
  workCategoryId: string | null;
  workTimeId: string | null;
  gender: string | null;
  pincode: string | null;
  fromLabel: string | null;
  toLabel: string | null;
  from: Date | null;
  toExclusive: Date | null;
};

export function parseUserFilterSearchFilters(url: URL): UserFilterSearchFilters {
  const fromLabel = parseDateLabel(url.searchParams.get("from"));
  const toLabel = parseDateLabel(url.searchParams.get("to"));

  return {
    workCategoryId: url.searchParams.get("workCat")?.trim() || null,
    workTimeId: url.searchParams.get("workTime")?.trim() || null,
    gender: url.searchParams.get("gender")?.trim() || null,
    pincode: url.searchParams.get("pincode")?.trim() || null,
    fromLabel,
    toLabel,
    from: fromLabel ? startOfIstDay(fromLabel) : null,
    toExclusive: toLabel ? addUtcDays(startOfIstDay(toLabel), 1) : null,
  };
}

export function buildUserFilterSearchWhere(
  filters: UserFilterSearchFilters,
  range: { from?: Date | null; toExclusive?: Date | null } = {},
) {
  const conditions: Prisma.Sql[] = [];
  const from = range.from === undefined ? filters.from : range.from;
  const toExclusive = range.toExclusive === undefined ? filters.toExclusive : range.toExclusive;

  if (filters.workCategoryId) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM unnest(string_to_array(COALESCE(ufs."workCat", ''), ',')) AS category_id(value)
        WHERE btrim(category_id.value) = ${filters.workCategoryId}
      )
    `);
  }

  if (filters.workTimeId) {
    conditions.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM unnest(string_to_array(COALESCE(ufs."workTime", ''), ',')) AS work_time_id(value)
        WHERE btrim(work_time_id.value) = ${filters.workTimeId}
      )
    `);
  }

  if (filters.gender) {
    conditions.push(Prisma.sql`ufs.gender::text = ${filters.gender}`);
  }

  if (filters.pincode) {
    conditions.push(Prisma.sql`ufs.pincode::text ILIKE ${`%${filters.pincode}%`}`);
  }

  if (from) {
    conditions.push(Prisma.sql`ufs."createdAt" >= ${from}`);
  }

  if (toExclusive) {
    conditions.push(Prisma.sql`ufs."createdAt" < ${toExclusive}`);
  }

  return conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
}

export function parseDateLabel(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));

  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return value;
}

export function startOfIstDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) - 330 * 60 * 1000);
}

export function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

