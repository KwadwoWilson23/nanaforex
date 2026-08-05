"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import GoogleButton from "./GoogleButton";
import PasswordInput from "./PasswordInput";

type Tab = "login" | "register";

const strengthMap = [
  { label: "Weak", color: "bg-danger" },
  { label: "Weak", color: "bg-danger" },
  { label: "Fair", color: "bg-gold" },
  { label: "Good", color: "bg-secondary" },
  { label: "Strong", color: "bg-profit-green" },
];

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

// Fire the welcome-email endpoint using the fresh access token in a
// Bearer header, so the send doesn't race the SSR cookie propagation.
// Endpoint is idempotent — no-ops if the user already got a welcome.
async function fireWelcome(supabase: ReturnType<typeof createSupabaseBrowser>) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch("/api/emails/welcome", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
  } catch (e) {
    console.warn("[welcome] fire failed", e);
  }
}

export default function AuthCard({
  initialError,
  nextUrl,
}: {
  initialError?: string;
  nextUrl?: string;
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [tab, setTab] = useState<Tab>("login");
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "info" | "success" | "error"; message: string }
  >(
    initialError
      ? { kind: "error", message: decodeURIComponent(initialError) }
      : { kind: "idle" },
  );
  const [busy, setBusy] = useState(false);

  // ---- LOGIN state ----
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [remember, setRemember] = useState(true);

  // ---- REGISTER state ----
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const score = scorePassword(regPassword);

  function setError(m: string) {
    setStatus({ kind: "error", message: m });
  }
  function setSuccess(m: string) {
    setStatus({ kind: "success", message: m });
  }
  function setInfo(m: string) {
    setStatus({ kind: "info", message: m });
  }

  // ---- LOGIN submit ----
  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!loginEmail || !loginPassword) return setError("Fill in email and password.");
    setBusy(true);
    setInfo("Signing you in…");
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setBusy(false);
    if (error) {
      return setError(error.message);
    }
    setSuccess("Success — redirecting…");
    router.push(nextUrl || "/users/client-dashboard");
    router.refresh();
  }

  // ---- REGISTER submit ----
  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!regName || !regEmail || !regPassword || !regConfirm)
      return setError("Please fill in all required fields.");
    if (regName.trim().length < 2) return setError("Name must be at least 2 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail))
      return setError("Please enter a valid email address.");
    if (regPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (regPassword !== regConfirm) return setError("Passwords do not match.");

    setBusy(true);
    setInfo("Creating your account…");
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: {
        data: { full_name: regName.trim(), phone: regPhone.trim() || "" },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    setBusy(false);
    if (error) return setError(error.message);

    // Verification ON → session is null, user must confirm email.
    if (!data.session) {
      setSuccess("Account created! Check your email to verify, then log in.");
      setTimeout(() => setTab("login"), 2000);
      return;
    }

    // Fire the welcome email. Pass the fresh access token via Bearer
    // header so the endpoint can auth immediately — the SSR cookie
    // hasn't necessarily propagated by the time this fetch fires.
    fireWelcome(supabase);

    setSuccess("Account created — redirecting…");
    router.push(nextUrl || "/users/client-dashboard");
    router.refresh();
  }

  // ---- FORGOT ----
  async function onForgot() {
    if (!loginEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail))
      return setError("Enter your email above first, then click Forgot.");
    setBusy(true);
    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
    } catch {
      /* silent — endpoint always returns 200 anyway */
    }
    setBusy(false);
    // Always show generic success to avoid revealing whether the email exists.
    setSuccess(`If ${loginEmail} has an account, a reset link is on its way.`);
  }

  // ---- GOOGLE SIGN-IN ----
  const nonceRef = useRef<{ raw: string; hashed: string } | null>(null);

  async function makeNoncePair() {
    const raw =
      (crypto.randomUUID?.() || Math.random().toString(36)) +
      (crypto.randomUUID?.() || Math.random().toString(36));
    const bytes = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hashed = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return { raw, hashed };
  }

  async function onGoogleCredential(idToken: string) {
    setBusy(true);
    setInfo("Signing you in…");
    const nonce = nonceRef.current?.raw;
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce,
    });
    setBusy(false);
    if (error) return setError("Google sign-in failed: " + error.message);
    // First-time Google users get a welcome. Endpoint no-ops on repeat.
    fireWelcome(supabase);
    setSuccess("Success — redirecting…");
    router.push(nextUrl || "/users/client-dashboard");
    router.refresh();
  }

  // Prep the nonce pair ONCE so both the Google init and the callback share it.
  useEffect(() => {
    let cancelled = false;
    makeNoncePair().then((pair) => {
      if (!cancelled) nonceRef.current = pair;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur-xl p-6 md:p-8 shadow-elevated"
    >
      {/* Tabs */}
      <div className="relative grid grid-cols-2 gap-0 rounded-2xl bg-white/[0.04] border border-white/6 p-1.5 mb-6 overflow-hidden">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-primary shadow-[0_6px_18px_rgba(0,200,150,0.35)]"
          style={{ left: tab === "login" ? 6 : "calc(50% + 0px)" }}
        />
        {(["login", "register"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setStatus({ kind: "idle" });
            }}
            className={`relative z-10 py-2.5 text-sm font-bold rounded-xl transition-colors ${
              tab === t ? "text-dark" : "text-white/70 hover:text-white"
            }`}
          >
            <i className={`fas ${t === "login" ? "fa-sign-in-alt" : "fa-user-plus"} mr-1.5`} />
            {t === "login" ? "Login" : "Register"}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <form onSubmit={onLogin} className="grid gap-4">
          <h2 className="font-display font-bold text-2xl">Welcome back</h2>
          <p className="text-white/60 text-sm -mt-2">
            Sign in to your Nana Forex account.
          </p>

          <Field
            label="Email"
            icon="fa-envelope"
            input={
              <input
                type="email"
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputCls}
              />
            }
          />
          <Field
            label="Password"
            icon="fa-lock"
            input={
              <PasswordInput
                value={loginPassword}
                onChange={setLoginPassword}
                autoComplete="current-password"
              />
            }
          />

          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-1.5 text-white/65">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-secondary"
              />
              Remember Me
            </label>
            <button
              type="button"
              onClick={onForgot}
              className="text-secondary hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Submit busy={busy} label="Sign In" icon="fa-sign-in-alt" />

          <Divider />
          <GoogleButton
            clientId={GOOGLE_CLIENT_ID}
            onCredential={onGoogleCredential}
            nonce={nonceRef}
          />

          <p className="text-center text-sm text-white/60 mt-2">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="text-secondary font-semibold hover:underline"
              onClick={() => setTab("register")}
            >
              Create one
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={onRegister} className="grid gap-4">
          <h2 className="font-display font-bold text-2xl">Create your account</h2>
          <p className="text-white/60 text-sm -mt-2">
            Join Nana Forex — it only takes a minute.
          </p>

          <Field
            label="Full Name"
            icon="fa-user"
            input={
              <input
                type="text"
                autoComplete="name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="John Mensah"
                required
                className={inputCls}
              />
            }
          />
          <Field
            label="Email"
            icon="fa-envelope"
            input={
              <input
                type="email"
                autoComplete="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputCls}
              />
            }
          />
          <Field
            label="Phone (optional)"
            icon="fa-phone"
            input={
              <input
                type="tel"
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+233 …"
                className={inputCls}
              />
            }
          />
          <div>
            <Field
              label="Password"
              icon="fa-lock"
              input={
                <PasswordInput
                  value={regPassword}
                  onChange={setRegPassword}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              }
            />
            {regPassword && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthMap[score].color}`}
                    style={{ width: `${(score / 4) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-white/60">
                  {strengthMap[score].label}
                </span>
              </div>
            )}
          </div>
          <Field
            label="Confirm Password"
            icon="fa-check-circle"
            input={
              <PasswordInput
                value={regConfirm}
                onChange={setRegConfirm}
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
            }
          />

          <Submit busy={busy} label="Create Account" icon="fa-user-plus" />

          <Divider />
          <GoogleButton
            clientId={GOOGLE_CLIENT_ID}
            onCredential={onGoogleCredential}
            nonce={nonceRef}
          />

          <p className="text-center text-sm text-white/60 mt-2">
            Already have an account?{" "}
            <button
              type="button"
              className="text-secondary font-semibold hover:underline"
              onClick={() => setTab("login")}
            >
              Sign in
            </button>
          </p>
        </form>
      )}

      {status.kind !== "idle" && (
        <p
          className={`mt-4 text-sm text-center min-h-[1.2rem] ${
            status.kind === "error"
              ? "text-danger"
              : status.kind === "success"
                ? "text-profit-green"
                : "text-white/70"
          }`}
        >
          {status.message}
        </p>
      )}

      <p className="text-center text-xs text-white/40 mt-6">
        <Link href="/" className="hover:text-secondary">
          ← Back to homepage
        </Link>
      </p>
    </motion.div>
  );
}

// ---------- tiny UI primitives ----------
const inputCls =
  "w-full bg-transparent outline-none text-white placeholder:text-white/30 py-3.5 pl-11 pr-4";

function Field({
  label,
  icon,
  input,
}: {
  label: string;
  icon: string;
  input: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-white/75 mb-1.5">
        {label}
      </span>
      <div className="relative rounded-xl bg-white/[0.03] border border-white/8 transition-all focus-within:border-secondary/55 focus-within:ring-4 focus-within:ring-secondary/15">
        <i
          className={`fas ${icon} absolute left-4 top-1/2 -translate-y-1/2 text-white/45`}
        />
        {input}
      </div>
    </label>
  );
}

function Divider() {
  return (
    <div className="relative my-2 text-center">
      <span className="relative z-10 px-3 text-xs uppercase tracking-wider text-white/50 bg-transparent">
        or continue with
      </span>
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 -z-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
    </div>
  );
}

function Submit({
  busy,
  label,
  icon,
}: {
  busy: boolean;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="btn-primary justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {busy ? (
        <>
          <i className="fas fa-spinner fa-spin" /> Please wait…
        </>
      ) : (
        <>
          <i className={`fas ${icon}`} /> {label}
        </>
      )}
    </button>
  );
}
