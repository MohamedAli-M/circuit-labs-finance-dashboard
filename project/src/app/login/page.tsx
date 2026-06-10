"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { storeUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      const u = data.user;
      storeUser({ id: u.id, name: u.name, role: u.role, allowedTabs: u.allowedTabs });
      router.replace("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0c1018] to-bg px-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col items-center gap-5">
        <h1 className="mb-3 text-3xl font-light tracking-[0.18em] text-white/90">
          WELCOME BACK!
        </h1>

        <Field icon={<User className="h-4 w-4" />}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </Field>

        <Field icon={<Lock className="h-4 w-4" />}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </Field>

        {error && (
          <p className="w-full text-center text-xs text-cashout">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-md bg-white py-2.5 text-sm font-semibold tracking-wide text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "SIGNING IN…" : "LOGIN"}
        </button>

        <button type="button" className="text-xs text-white/70 hover:text-white">
          Forgot password?
        </button>
      </form>
    </main>
  );
}

function Field({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-2 rounded-md border border-line bg-white/5 px-3 py-2.5 focus-within:border-brand/60">
      <span className="text-muted">{icon}</span>
      {children}
    </div>
  );
}
