import { EmployersPanel } from "@/components/employers-panel";
import { requireAdmin } from "@/lib/auth";

export default async function EmployersPage() {
  await requireAdmin();

  return <EmployersPanel />;
}
