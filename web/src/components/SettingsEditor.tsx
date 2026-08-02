"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Settings = {
  language?: string;
  emailNotifications?: boolean;
  tradeAlerts?: boolean;
  weeklySummary?: boolean;
  marketing?: boolean;
  timezone?: string;
};

type Preferences = { settings?: Settings } & Record<string, unknown>;

export default function SettingsEditor({
  email,
  initialPreferences,
}: {
  email: string;
  initialPreferences: Preferences;
}) {
  const supabase = createSupabaseBrowser();
  const s0: Settings = initialPreferences?.settings || {};

  const [language, setLanguage] = useState(s0.language ?? "en");
  const [timezone, setTimezone] = useState(s0.timezone ?? "GMT");
  const [emailNotif, setEmailNotif] = useState(s0.emailNotifications ?? true);
  const [tradeAlerts, setTradeAlerts] = useState(s0.tradeAlerts ?? true);
  const [weekly, setWeekly] = useState(s0.weeklySummary ?? false);
  const [marketing, setMarketing] = useState(s0.marketing ?? false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "success" | "error" | "info"; message: string }
  >({ kind: "idle" });

  async function save() {
    if (busy) return;
    setBusy(true);
    setStatus({ kind: "info", message: "Saving…" });

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      setBusy(false);
      return setStatus({ kind: "error", message: "Not signed in." });
    }

    const nextPrefs: Preferences = {
      ...(initialPreferences || {}),
      settings: {
        ...(initialPreferences?.settings || {}),
        language,
        timezone,
        emailNotifications: emailNotif,
        tradeAlerts,
        weeklySummary: weekly,
        marketing,
      },
    };

    const { error } = await supabase
      .from("profiles")
      .update({ preferences: nextPrefs })
      .eq("id", uid);

    setBusy(false);
    if (error) return setStatus({ kind: "error", message: error.message });
    setStatus({ kind: "success", message: "✅ Settings saved." });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-6">
        <h2 className="font-display font-bold text-xl mb-1">Settings</h2>
        <p className="text-white/60 text-sm">
          Signed in as <span className="text-white">{email}</span>.
        </p>
      </section>

      {/* Preferences */}
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-6 space-y-4">
        <h3 className="font-bold text-lg">Preferences</h3>

        <Row label="Language">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={selectCls}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="tw">Twi</option>
          </select>
        </Row>

        <Row label="Timezone">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className={selectCls}
          >
            <option value="GMT">GMT (Accra)</option>
            <option value="UTC">UTC</option>
            <option value="EST">EST</option>
            <option value="CET">CET</option>
          </select>
        </Row>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-6 space-y-3">
        <h3 className="font-bold text-lg mb-1">Notifications</h3>

        <Toggle
          label="Email notifications"
          hint="Account activity, security alerts, receipts."
          checked={emailNotif}
          onChange={setEmailNotif}
        />
        <Toggle
          label="Trade alerts"
          hint="Get pinged when your positions hit key levels."
          checked={tradeAlerts}
          onChange={setTradeAlerts}
        />
        <Toggle
          label="Weekly summary"
          hint="Every Monday — your last week at a glance."
          checked={weekly}
          onChange={setWeekly}
        />
        <Toggle
          label="Marketing emails"
          hint="New programs, promos and events. Off by default."
          checked={marketing}
          onChange={setMarketing}
        />
      </section>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={save}
          disabled={busy}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Saving…
            </>
          ) : (
            <>
              <i className="fas fa-check" /> Save Settings
            </>
          )}
        </button>
        {status.kind !== "idle" && (
          <p
            className={`text-sm ${
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
      </div>
    </div>
  );
}

const selectCls =
  "bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all min-w-[180px]";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <span className="text-sm font-semibold text-white/85">{label}</span>
      {children}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white/90">{label}</p>
        {hint && <p className="text-xs text-white/50 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-gradient-primary" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
