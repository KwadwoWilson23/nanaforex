"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordForm() {
  const supabase = createSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "success" | "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      setStatus({ kind: "error", message: "Enter your email." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?type=recovery`
          : undefined,
    });
    setBusy(false);
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({
      kind: "success",
      message: "If that email exists, a reset link is on its way.",
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="block">
        <span className="block text-sm font-semibold text-white/75 mb-1.5">
          Email
        </span>
        <div className="relative rounded-xl bg-white/[0.03] border border-white/8 focus-within:border-secondary/55 focus-within:ring-4 focus-within:ring-secondary/15 transition-all">
          <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-transparent outline-none text-white placeholder:text-white/30 py-3.5 pl-11 pr-4"
          />
        </div>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="btn-primary justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <i className="fas fa-spinner fa-spin" /> Sending…
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane" /> Send Reset Link
          </>
        )}
      </button>

      {status.kind !== "idle" && (
        <p
          className={`text-sm text-center ${
            status.kind === "error" ? "text-danger" : "text-profit-green"
          }`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}
