export const userFilterSearchPageSizeOptions = [10, 25, 50, 100] as const;

export type UserFilterOption = {
  id: number;
  name: string;
};

export type UserFilterSearchItem = {
  id: string;
  workCategoryId: string | null;
  workCategory: string | null;
  workTimeId: string | null;
  workTime: string | null;
  gender: string | null;
  pincode: string | null;
  createdAt: string | null;
};

export type UserFilterSearchRow = {
  id: string;
  workCategoryId: string | null;
  workCategoryName: string | null;
  workTimeId: string | null;
  workTimeName: string | null;
  gender: string | null;
  pincode: string | number | null;
  createdAt: Date | string | null;
};

export type UserFilterSearchListData = {
  items: UserFilterSearchItem[];
  workCategories: UserFilterOption[];
  workTimes: UserFilterOption[];
  genders: string[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
};

export type UserFilterSearchAnalyticsData = {
  summary: {
    totalSearches: number;
    averagePerDay: number;
    activeDays: number;
    peakDay: { date: string | null; count: number };
    previousPeriodTotal: number | null;
    percentageChange: number | null;
  };
  dailyTrend: Array<{
    date: string;
    count: number;
    previousCount: number | null;
  }>;
  breakdowns: {
    workCategories: UserFilterSearchBreakdown[];
    workTimes: UserFilterSearchBreakdown[];
    genders: UserFilterSearchBreakdown[];
    pincodes: UserFilterSearchBreakdown[];
  };
  meta: {
    from: string;
    to: string;
    timezone: "Asia/Kolkata";
    compared: boolean;
  };
};

export type UserFilterSearchBreakdown = {
  id?: string;
  label: string;
  count: number;
};

export function mapUserFilterSearchRow(row: UserFilterSearchRow): UserFilterSearchItem {
  return {
    id: row.id,
    workCategoryId: row.workCategoryId,
    workCategory: lookupLabel(row.workCategoryName, row.workCategoryId),
    workTimeId: row.workTimeId,
    workTime: lookupLabel(row.workTimeName, row.workTimeId),
    gender: row.gender,
    pincode: row.pincode === null ? null : String(row.pincode),
    createdAt: toIso(row.createdAt),
  };
}

function lookupLabel(name: string | null, id: string | null) {
  if (name) {
    return name;
  }

  return id === null ? null : `Unknown (#${id})`;
}

function toIso(value: Date | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
