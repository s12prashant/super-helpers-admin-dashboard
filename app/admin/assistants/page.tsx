import { AssistantRegistrationsPanel } from "@/components/assistant-registrations-panel";
import { requireAdmin } from "@/lib/auth";

export default async function AssistantRegistrationsPage() {
  await requireAdmin();

  return <AssistantRegistrationsPanel />;
}
