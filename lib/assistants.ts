export const assistantStatuses = ["PENDING", "APPROVED", "REJECTED", "BLOCKED"] as const;

export type AssistantStatus = (typeof assistantStatuses)[number];

export type AssistantRegistrationSummary = {
  totalRegistered: number;
  allTimeRegistered: number;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
  countsByStatus: Array<{
    status: AssistantStatus;
    count: number;
  }>;
  recentAssistants: AssistantRegistrationItem[];
};

export type AssistantRegistrationItem = {
  id: number;
  name: string | null;
  mobile: string;
  city: string | null;
  pincode: number | null;
  status: AssistantStatus;
  created_at: string;
};

export type AssistantRegistrationRow = {
  id: number;
  name: string | null;
  mobile: string;
  city: string | null;
  pincode: number | null;
  status: AssistantStatus;
  created_at: Date;
};

export function isAssistantStatus(value: unknown): value is AssistantStatus {
  return typeof value === "string" && assistantStatuses.includes(value as AssistantStatus);
}

export function parseDateFilter(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function getExclusiveEndDate(value: string | null) {
  const date = parseDateFilter(value);

  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + 1);
  return date;
}

export function mapAssistantRegistrationRow(row: AssistantRegistrationRow): AssistantRegistrationItem {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    city: row.city,
    pincode: row.pincode,
    status: row.status,
    created_at: row.created_at.toISOString(),
  };
}
