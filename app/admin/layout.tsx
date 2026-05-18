import Link from "next/link";
import { Activity, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SH</div>
          <div>
            <p className="brand-title">SuperHelper</p>
            <p className="brand-subtitle">Admin</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Admin navigation">
          <Link href="/admin" className="nav-item">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link href="/admin#users" className="nav-item">
            <Users size={18} />
            Users
          </Link>
          <Link href="/admin#health" className="nav-item">
            <Activity size={18} />
            Health
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-pill">
            <ShieldCheck size={16} />
            <span>{admin.email}</span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
