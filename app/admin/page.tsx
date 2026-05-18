import { Activity, Database, ShieldCheck, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

async function getSupabaseSummary() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (error) {
      return {
        status: "Needs attention",
        userCount: null,
        message: error.message,
      };
    }

    return {
      status: "Connected",
      userCount: data.total ?? data.users.length,
      message: "Service role can reach the SuperHelper Supabase project.",
    };
  } catch (error) {
    return {
      status: "Not configured",
      userCount: null,
      message: error instanceof Error ? error.message : "Unknown Supabase configuration issue.",
    };
  }
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const summary = await getSupabaseSummary();

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="header-meta">
          <ShieldCheck size={18} />
          {admin.email}
        </div>
      </header>

      <section className="metric-grid" aria-label="Admin metrics">
        <div className="metric-card">
          <div className="metric-icon success">
            <Database size={20} />
          </div>
          <p className="metric-label">Supabase</p>
          <p className="metric-value">{summary.status}</p>
        </div>
        <div className="metric-card" id="users">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <p className="metric-label">Auth users</p>
          <p className="metric-value">{summary.userCount ?? "--"}</p>
        </div>
        <div className="metric-card" id="health">
          <div className="metric-icon">
            <Activity size={20} />
          </div>
          <p className="metric-label">Backend API</p>
          <p className="metric-value">Ready</p>
        </div>
      </section>

      <section className="content-band">
        <div>
          <p className="section-kicker">Supabase prod connection</p>
          <h2>Backend access is isolated to route handlers and server components.</h2>
        </div>
        <p>{summary.message}</p>
      </section>
    </div>
  );
}
