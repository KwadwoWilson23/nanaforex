"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PasswordInput from "./PasswordInput";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import type { Participant } from "@/app/users/(dashboard)/competitions/[slug]/page";

type Props = {
  competitionId: string;
  competitionSlug: string;
  competitionState: "active" | "upcoming" | "ended" | "cancelled";
  allowedPlatforms: string[];
  initialParticipant: Participant | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "info" | "success" | "error"; message: string };

async function apiPost<T>(path: string, body: unknown): Promise<{ ok: boolean; data?: T; error?: string; debug?: string; status?: number }> {
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    let data: unknown = null;
    try { data = await r.json(); } catch { /* ignore */ }
    const d = data as { error?: string; debug?: string } | null;
    if (!r.ok) return { ok: false, error: d?.error || r.statusText, debug: d?.debug, status: r.status };
    return { ok: true, data: data as T };
  } catch (e) {
    console.error("[CompetitionParticipation] request failed", { path, err: e });
    return { ok: false, error: "Network error. Please check your connection and try again." };
  }
}

function fmtMoney(n: number | null) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtSince(iso: string | null) {
  if (!iso) return "not yet";
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.round(s / 60) + "m ago";
  return Math.round(s / 3600) + "h ago";
}

export default function CompetitionParticipation({
  competitionId,
  competitionSlug,
  competitionState,
  allowedPlatforms,
  initialParticipant,
}: Props) {
  const router = useRouter();
  const [p, setP] = useState<Participant | null>(initialParticipant);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  // Live refresh: while the participant is connecting or connected, refetch
  // the participant row every 20s so equity, drawdown and last_sync_at
  // reflect what the cron worker has written since page load.
  const pIdRef = useRef<string | null>(p?.id ?? null);
  pIdRef.current = p?.id ?? null;
  useEffect(() => {
    if (!p) return;
    if (p.status !== "connected" && p.status !== "connecting") return;
    const sb = createSupabaseBrowser();
    let cancelled = false;
    async function refetch() {
      const id = pIdRef.current;
      if (!id || cancelled) return;
      const { data } = await sb
        .from("participants")
        .select(
          "id, status, status_reason, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity, last_sync_at",
        )
        .eq("id", id)
        .maybeSingle();
      if (!cancelled && data) setP(data as Participant);
    }
    const interval = window.setInterval(refetch, 20_000);
    const onVis = () => { if (document.visibilityState === "visible") refetch(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [p]);

  const finished = competitionState === "ended" || competitionState === "cancelled";
  if (finished) {
    return (
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-8 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-white/6 text-white/70 border-white/12 mb-3">
          <i className="fas fa-flag-checkered" /> Ended
        </span>
        <h3 className="font-bold text-xl">This competition has ended.</h3>
        <p className="text-white/60 mt-2">
          Head to the leaderboard to see final results.
        </p>
      </section>
    );
  }

  // ---- No participant yet → Join CTA ----
  if (!p) {
    return (
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-8">
        <h3 className="font-bold text-xl mb-1">Ready to enter?</h3>
        <p className="text-white/65 mb-5">
          Click Join, then paste your MT5 investor password to link your
          account. We only need read-only access — we can never trade,
          transfer, or change your account.
        </p>
        <button
          onClick={async () => {
            setBusy(true);
            setStatus({ kind: "info", message: "Joining…" });
            const res = await apiPost<{ participant: Participant }>(
              "/api/competitions/join",
              { slug: competitionSlug },
            );
            setBusy(false);
            if (!res.ok) return setStatus({ kind: "error", message: res.error || "Join failed" });
            const created = res.data?.participant;
            // Fetch full participant record (with all fields)
            setP({
              id: created?.id || "",
              status: created?.status || "pending",
              status_reason: null,
              mt_platform: null,
              mt_login: null,
              mt_server: null,
              broker_name: null,
              starting_balance: null,
              current_equity: null,
              last_sync_at: null,
            });
            router.refresh();
          }}
          disabled={busy}
          className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <><i className="fas fa-spinner fa-spin" /> Joining…</>
          ) : (
            <><i className="fas fa-trophy" /> Join Competition</>
          )}
        </button>
        <StatusLine status={status} />
      </section>
    );
  }

  // ---- Pending/Connecting → Connect form ----
  if (p.status === "pending" || p.status === "connecting") {
    return (
      <ConnectSection
        participant={p}
        allowedPlatforms={allowedPlatforms}
        onConnected={(updated) => {
          setP(updated);
          router.refresh();
        }}
        onWithdraw={async () => {
          if (!confirm("Withdraw from this competition?")) return;
          const res = await apiPost<{ participant: Participant }>(
            "/api/competitions/withdraw",
            { participant_id: p.id },
          );
          if (!res.ok) return alert("Could not withdraw: " + res.error);
          setP(res.data?.participant || null);
          router.refresh();
        }}
      />
    );
  }

  // ---- Connected → Live view ----
  if (p.status === "connected") {
    const startBal = Number(p.starting_balance || 0);
    const curEq = Number(p.current_equity || 0);
    const pl = startBal ? curEq - startBal : 0;
    const plPct = startBal ? (pl / startBal) * 100 : 0;
    const plCls = pl > 0 ? "text-profit-green" : pl < 0 ? "text-danger" : "text-white/60";
    return (
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 sm:p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-profit-green/12 text-profit-green border-profit-green/35">
            <i className="fas fa-circle text-[8px]" /> Live
          </span>
          <h3 className="font-bold text-base sm:text-lg">You&apos;re in the competition</h3>
        </div>

        {/* Big P/L headline — mobile-first hero number */}
        <div className="rounded-2xl bg-gradient-to-br from-secondary/8 to-white/[0.02] border border-white/6 p-5">
          <div className="text-[10px] uppercase tracking-wider text-white/50">Profit / Loss</div>
          <div className={`font-display font-extrabold text-3xl sm:text-4xl mt-1 ${plCls}`}>
            {pl >= 0 ? "+" : ""}{fmtMoney(pl)}
          </div>
          <div className={`text-sm font-semibold mt-0.5 ${plCls}`}>
            {plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%
          </div>
        </div>

        {/* Metric grid — 2 cols on all sizes so it never squishes */}
        <div className="grid gap-3 grid-cols-2">
          <MetricCard k="Starting" v={fmtMoney(p.starting_balance)} />
          <MetricCard k="Equity" v={fmtMoney(p.current_equity)} strong />
          <MetricCard k="MT Login" v={p.mt_login || "—"} />
          <MetricCard k="Server" v={p.mt_server || "—"} small />
        </div>

        {/* Sync + refresh row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/6 pt-4">
          <p className="text-white/55 text-xs inline-flex items-center gap-1.5">
            <i className="fas fa-clock text-[10px]" />
            {p.last_sync_at ? `Synced ${fmtSince(p.last_sync_at)}` : "Waiting for first sync…"}
          </p>
          <button
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setStatus({ kind: "info", message: "Refreshing from broker…" });
              const res = await apiPost<{ participant: Participant }>(
                "/api/competitions/refresh",
                { participant_id: p.id },
              );
              setBusy(false);
              if (!res.ok) {
                const debugSuffix = res.debug ? `\n\n[admin debug]  ${res.debug}` : "";
                return setStatus({
                  kind: "error",
                  message: (res.error || "Couldn't refresh.") + debugSuffix,
                });
              }
              const merged = { ...p, ...(res.data?.participant || {}) } as Participant;
              setP(merged);
              setStatus({ kind: "success", message: "Live data refreshed." });
              setTimeout(() => setStatus({ kind: "idle" }), 2500);
              router.refresh();
            }}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-secondary/35 text-secondary hover:bg-secondary/8 text-xs font-bold uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <><i className="fas fa-spinner fa-spin" /> Refreshing…</>
            ) : (
              <><i className="fas fa-rotate" /> Refresh now</>
            )}
          </button>
        </div>

        <AnimatePresence>
          {status.kind !== "idle" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-sm whitespace-pre-line break-words ${
                status.kind === "error"
                  ? "text-danger"
                  : status.kind === "success"
                    ? "text-profit-green"
                    : "text-white/70"
              }`}
            >
              {status.message}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-white/45 text-xs">
          <i className="fas fa-info-circle mr-1" /> Auto-syncs every minute in the background — this button forces it right now.
        </p>

        <button
          onClick={async () => {
            if (!confirm("Withdraw from this competition? Your MetaAPI link will be removed.")) return;
            const res = await apiPost<{ participant: Participant }>(
              "/api/competitions/withdraw",
              { participant_id: p.id },
            );
            if (!res.ok) return alert("Could not withdraw: " + res.error);
            setP(res.data?.participant || null);
            router.refresh();
          }}
          className="text-danger/85 hover:text-danger hover:underline text-sm bg-transparent border-none p-0 cursor-pointer"
        >
          Withdraw from this competition
        </button>
      </section>
    );
  }

  // ---- Withdrawn / disqualified / completed ----
  const finalMap = {
    disqualified: { icon: "fa-ban",       tone: "border-danger/35 bg-danger/12 text-danger", title: "You were disqualified from this competition." },
    withdrawn:    { icon: "fa-circle-info", tone: "border-gold/35 bg-gold/12 text-gold",     title: "You withdrew from this competition." },
    completed:    { icon: "fa-flag-checkered", tone: "border-white/12 bg-white/6 text-white/75", title: "You completed this competition." },
  } as const;
  const key = (p.status as keyof typeof finalMap);
  const meta = finalMap[key] || finalMap.completed;
  return (
    <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-8 text-center">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-3 ${meta.tone}`}>
        <i className={`fas ${meta.icon}`} /> {p.status}
      </span>
      <h3 className="font-bold text-xl">{meta.title}</h3>
      {p.status_reason && (
        <p className="text-white/60 mt-2">{p.status_reason}</p>
      )}
    </section>
  );
}

// -------------------- Connect subsection --------------------

function ConnectSection({
  participant,
  allowedPlatforms,
  onConnected,
  onWithdraw,
}: {
  participant: Participant;
  allowedPlatforms: string[];
  onConnected: (p: Participant) => void;
  onWithdraw: () => Promise<void>;
}) {
  const [login, setLogin] = useState("");
  const [server, setServer] = useState("");
  const [broker, setBroker] = useState("");
  const [platform, setPlatform] = useState<"mt4" | "mt5">(
    (allowedPlatforms[0] as "mt4" | "mt5") || "mt5",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus({
      kind: "info",
      message: "Provisioning MetaAPI account — this can take 10–30 seconds…",
    });
    const res = await apiPost<{ participant: Participant }>(
      "/api/competitions/connect",
      {
        participant_id: participant.id,
        login,
        server,
        platform,
        password,
        broker: broker || null,
      },
    );
    setBusy(false);
    if (!res.ok) return setStatus({ kind: "error", message: res.error || "Connect failed" });
    setStatus({ kind: "success", message: "Connected! Loading your live view…" });
    setTimeout(() => onConnected(res.data!.participant), 700);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/6 bg-white/[0.03] p-8 space-y-6"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-gold/12 text-gold border-gold/35">
          <i className="fas fa-hourglass-half" /> Awaiting connection
        </span>
        <h3 className="font-bold text-lg">Link your MT5 account</h3>
      </div>

      <div className="grid grid-cols-[40px_1fr] gap-4 rounded-xl border border-secondary/35 bg-secondary/8 p-4">
        <i className="fas fa-shield-halved text-secondary text-xl" />
        <div>
          <strong className="text-white block">
            Investor (read-only) password only.
          </strong>
          <p className="text-white/75 text-sm mt-1 leading-relaxed">
            We use it once to link your account with MetaAPI, then drop it.
            Nana Forex can never place trades, withdraw funds, or change
            your account. <strong>Never share your MASTER password.</strong>
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="MT5 Account Number">
            <input
              inputMode="numeric"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="e.g. 12345678"
              className={inputCls}
            />
          </Field>
          <Field label="Server">
            <input
              required
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="e.g. HFMarkets-Live"
              className={inputCls}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Broker (optional)">
            <input
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              placeholder="e.g. HFM"
              className={inputCls}
            />
          </Field>
          <Field label="Platform">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "mt4" | "mt5")}
              className={`${inputCls} bg-black/40`}
            >
              {allowedPlatforms.map((pl) => (
                <option key={pl} value={pl}>
                  {pl.toUpperCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Investor Password">
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="off"
            placeholder="Read-only password from your broker"
          />
        </Field>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <><i className="fas fa-spinner fa-spin" /> Connecting…</>
          ) : (
            <><i className="fas fa-link" /> Connect Account</>
          )}
        </button>

        <AnimatePresence>
          {status.kind !== "idle" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm ${
                status.kind === "error"
                  ? "text-danger"
                  : status.kind === "success"
                    ? "text-profit-green"
                    : "text-white/70"
              }`}
            >
              {status.message}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <button
        onClick={onWithdraw}
        className="text-danger/85 hover:text-danger hover:underline text-sm bg-transparent border-none p-0 cursor-pointer"
      >
        Change my mind — withdraw from this competition
      </button>
    </motion.section>
  );
}

// ---------- primitives ----------
const inputCls =
  "w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-white/75 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({
  k,
  v,
  strong,
  small,
}: {
  k: string;
  v: string;
  strong?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/6 px-3.5 py-3 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{k}</div>
      <div
        className={`mt-0.5 truncate ${
          small ? "text-sm font-semibold text-white/85" : strong ? "text-lg font-black" : "font-bold"
        }`}
      >
        {v}
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  const cls =
    status.kind === "error"
      ? "text-danger"
      : status.kind === "success"
        ? "text-profit-green"
        : "text-white/70";
  return <p className={`text-sm mt-3 ${cls}`}>{status.message}</p>;
}
