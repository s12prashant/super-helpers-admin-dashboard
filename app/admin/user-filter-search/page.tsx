import { UserFilterSearchPanel } from "@/components/user-filter-search-panel";
import { requireAdmin } from "@/lib/auth";

export default async function UserFilterSearchPage() {
  await requireAdmin();

  return <UserFilterSearchPanel />;
}
