export const leadStatuses = [
  "NEW",
  "WHATSAPP_SENT",
  "REPLIED",
  "CALL_TRIED",
  "AGREED_TO_REGISTER",
  "REGISTERED",
  "NOT_INTERESTED",
  "NOT_REACHABLE",
  "WRONG_NUMBER",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type SuperHelperLead = {
  id: number;
  name: string | null;
  phone_number: string;
  service_interest: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  last_contacted_at: string | null;
  reply_received_at: string | null;
  agreed_at: string | null;
  registered_assistant_id: number | null;
  created_at: string;
  updated_at: string | null;
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && leadStatuses.includes(value as LeadStatus);
}

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

export function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toOptionalString(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
