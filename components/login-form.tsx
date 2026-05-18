"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    setIsLoading(false);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setMessage(result?.error ?? "Unable to sign in");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <div className="input-row">
          <Mail size={18} />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
      </label>

      <label className="field">
        <span>Password</span>
        <div className="input-row">
          <Lock size={18} />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
      </label>

      {message ? <p className="form-message">{message}</p> : null}

      <button className="primary-button" type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
