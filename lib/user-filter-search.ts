export const userFilterSearchPageSizeOptions = [10, 25, 50, 100] as const;

export type UserFilterOption = {
  id: number;
  name: string;
};

export type UserFilterSearchItem = {
  id: number;
  workCategoryId: number | null;
  workCategory: string | null;
  workTimeId: number | null;
  workTime: string | null;
  gender: string | null;
  pincode: string | null;
  createdAt: string | null;
};

export type UserFilterSearchRow = {
  id: number;
  workCategoryId: number | null;
  workCategoryName: string | null;
  workTimeId: number | null;
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

export function mapUserFilterSearchRow(row: UserFilterSearchRow): UserFilterSearchItem {
  return {
    id: Number(row.id),
    workCategoryId: row.workCategoryId === null ? null : Number(row.workCategoryId),
    workCategory: lookupLabel(row.workCategoryName, row.workCategoryId),
    workTimeId: row.workTimeId === null ? null : Number(row.workTimeId),
    workTime: lookupLabel(row.workTimeName, row.workTimeId),
    gender: row.gender,
    pincode: row.pincode === null ? null : String(row.pincode),
    createdAt: toIso(row.createdAt),
  };
}

function lookupLabel(name: string | null, id: number | null) {
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
