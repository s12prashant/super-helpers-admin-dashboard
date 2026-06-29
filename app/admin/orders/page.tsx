import { OrdersPanel } from "@/components/orders-panel";
import { requireAdmin } from "@/lib/auth";

export default async function OrdersPage() {
  await requireAdmin();

  return <OrdersPanel />;
}
