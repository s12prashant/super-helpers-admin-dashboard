import { UserFilterSearchPanel } from "@/components/user-filter-search-panel";
import { requireAdmin } from "@/lib/auth";

export default async function UserFilterSearchPage() {
  await requireAdmin();

  const today = getTodayInIndia();
  const from = shiftDate(today, -29);

  return <UserFilterSearchPanel initialFrom={from} initialTo={today} />;
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

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
