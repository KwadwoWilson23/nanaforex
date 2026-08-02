"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import PasswordInput from "./PasswordInput";

export default function UpdatePasswordForm() {
  const supabase = createSupabaseBrowser();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "success" | "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (pw.length < 8) {
      setStatus({ kind: "error", message: "Password must be at least 8 characters." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({ kind: "success", message: "Password updated! Redirecting…" });
    setTimeout(() => {
      router.push("/users/login");
      router.refresh();
    }, 1200);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="block">
        <span className="block text-sm font-semibold text-white/75 mb-1.5">
          New Password
        </span>
        <div className="relative rounded-xl bg-white/[0.03] border border-white/8 focus-within:border-secondary/55 focus-within:ring-4 focus-within:ring-secondary/15 transition-all">
          <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
          <PasswordInput
            value={pw}
            onChange={setPw}
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
            <i className="fas fa-spinner fa-spin" /> Updating…
          </>
        ) : (
          <>
            <i className="fas fa-check" /> Update Password
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
