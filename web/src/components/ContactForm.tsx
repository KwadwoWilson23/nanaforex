"use client";

import { useState } from "react";

const SERVICES = [
  { value: "", label: "Select a service" },
  { value: "mentorship", label: "Forex Mentorship" },
  { value: "copy-trading", label: "Copy Trading" },
  { value: "funded", label: "Funded Trader Program" },
  { value: "analysis", label: "Market Analysis" },
  { value: "other", label: "Other" },
];

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      service: String(fd.get("service") || ""),
      message: String(fd.get("message") || "").trim(),
    };

    if (!data.name || !data.email || !data.message) {
      setStatus({ kind: "error", message: "Please fill name, email, and message." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setStatus({ kind: "error", message: "Please enter a valid email." });
      return;
    }

    setStatus({ kind: "sending" });

    // MVP: open a pre-filled email. Swap to fetch("/api/contact") once the
    // serverless email endpoint is wired.
    const subject = `Nana Forex contact — ${data.name}${data.service ? " · " + data.service : ""}`;
    const body =
      `Name: ${data.name}\n` +
      `Email: ${data.email}\n` +
      (data.phone ? `Phone: ${data.phone}\n` : "") +
      (data.service ? `Service: ${data.service}\n` : "") +
      `\n${data.message}`;
    const mailto = `mailto:info@nanaforex.com?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    setStatus({ kind: "sent" });
    (e.currentTarget as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/75 font-semibold">Full Name *</span>
          <input
            name="name"
            required
            className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/75 font-semibold">Email *</span>
          <input
            name="email"
            type="email"
            required
            className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/75 font-semibold">Phone (optional)</span>
          <input
            name="phone"
            type="tel"
            className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-white/75 font-semibold">Interested in</span>
          <select
            name="service"
            className="rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all"
            defaultValue=""
          >
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-white/75 font-semibold">Message *</span>
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all resize-y"
        />
      </label>

      <button
        type="submit"
        disabled={status.kind === "sending"}
        className="btn-primary justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status.kind === "sending" ? (
          <>
            <i className="fas fa-spinner fa-spin" /> Sending…
          </>
        ) : (
          <>
            Send Message <i className="fas fa-paper-plane" />
          </>
        )}
      </button>

      {status.kind === "error" && (
        <p className="text-danger text-sm">{status.message}</p>
      )}
      {status.kind === "sent" && (
        <p className="text-profit-green text-sm">
          Opening your email app… If nothing happens, email us directly at{" "}
          <a href="mailto:info@nanaforex.com" className="underline">
            info@nanaforex.com
          </a>
          .
        </p>
      )}
    </form>
  );
}
