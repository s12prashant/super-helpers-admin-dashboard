import { requireAdmin } from "@/lib/auth";
import { LeadsPanel } from "@/components/leads-panel";

export default async function LeadsPage() {
  await requireAdmin();

  return <LeadsPanel />;
}
