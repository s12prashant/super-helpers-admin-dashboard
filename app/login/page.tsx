import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">SuperHelper</p>
          <h1 id="login-title">Admin Sign In</h1>
          <p className="muted">
            Use an authorized admin account for the production SuperHelper Supabase project.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
