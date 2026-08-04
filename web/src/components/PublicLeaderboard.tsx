"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Comp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: number | null;
};

type Row = {
  participant_id: string;
  user_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  mt_platform: string | null;
  status: string | null;
  starting_balance: number | null;
  current_equity: number | null;
  profit_pct: number | null;
  max_drawdown_pct: number | null;
  trade_count: number | null;
  last_sync_at: string | null;
  rank: number | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stateOf(c: Comp): "active" | "upcoming" | "ended" | "cancelled" {
  if (c.status === "cancelled") return "cancelled";
  const now = new Date();
  if (c.status === "ended" || new Date(c.end_date) < now) return "ended";
  if (c.status === "upcoming" || new Date(c.start_date) > now) return "upcoming";
  return "active";
}

const stateStyle: Record<string, { cls: string; icon: string; label: string }> = {
  active:    { cls: "bg-profit-green/12 text-profit-green border-profit-green/35", icon: "fa-circle",         label: "Live" },
  upcoming:  { cls: "bg-gold/12 text-gold border-gold/35",                          icon: "fa-clock",          label: "Upcoming" },
  ended:     { cls: "bg-white/6 text-white/65 border-white/12",                     icon: "fa-flag-checkered", label: "Ended" },
  cancelled: { cls: "bg-danger/12 text-danger border-danger/35",                    icon: "fa-ban",            label: "Cancelled" },
};

function fmtMoney(n: number | null) {
  if (n == null) return "—";
  return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtSince(iso: string | null) {
  if (!iso) return "—";
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.round(s / 60) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  return Math.round(s / 86400) + "d ago";
}
function initialsFor(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PublicLeaderboard({ competition }: { competition: Comp }) {
  const supabase = createSupabaseBrowser();
  const state = stateOf(competition);
  const style = stateStyle[state];
  const [rows, setRows] = useState<Row[]>([]);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from("leaderboard_current")
        .select(
          "participant_id, user_id, display_name, avatar_url, mt_platform, status, starting_balance, current_equity, profit_pct, max_drawdown_pct, trade_count, last_sync_at, rank",
        )
        .eq("competition_id", competition.id)
        .order("rank", { ascending: true });
      if (mounted && data) {
        setRows(data as Row[]);
        setPulse((p) => p + 1);
      }
    }
    load();
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mounted = false;
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [supabase, competition.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-28 md:pt-32 pb-20">
      {/* Header */}
      <section
        className="rounded-3xl border border-white/6 p-6 md:p-8 mb-7"
        style={{
          background:
            "radial-gradient(600px 200px at 100% 0%, rgba(245,183,0,0.14), transparent 60%), linear-gradient(135deg, rgba(0,200,150,0.14), rgba(15,23,42,0.6))",
        }}
      >
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <Link
            href="/competitions"
            className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-secondary px-3 py-1.5 rounded-full border border-white/10 hover:border-secondary/40 hover:bg-secondary/8 transition-all"
          >
            <i className="fas fa-arrow-left" /> All competitions
          </Link>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${style.cls}`}
          >
            <i className={`fas ${style.icon} text-[8px]`} />
            {style.label}
          </span>
        </div>

        <h1 className="font-display font-extrabold text-2xl md:text-4xl">
          {competition.name}
        </h1>
        {competition.description && (
          <p className="text-white/70 mt-3 max-w-2xl">
            {competition.description}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-4 mt-6 pt-4 border-t border-white/8">
          <MetaCell k="Prize Pool" v={competition.prize_pool ? "$" + Number(competition.prize_pool).toLocaleString() : "—"} />
          <MetaCell k="Participants" v={String(rows.length)} />
          <MetaCell k="Starts" v={fmtDate(competition.start_date)} />
          <MetaCell k="Ends"   v={fmtDate(competition.end_date)} />
        </div>

        <div className="mt-6 inline-flex items-center gap-2 text-sm text-white/65 px-3 py-1.5 rounded-full bg-secondary/6 border border-secondary/25">
          <AnimatePresence mode="wait">
            <motion.span
              key={pulse}
              initial={{ scale: 1, boxShadow: "0 0 0 rgba(0,255,136,0.6)" }}
              animate={{ scale: [1, 1.6, 1], boxShadow: ["0 0 0 rgba(0,255,136,0.6)", "0 0 18px rgba(0,255,136,0.8)", "0 0 12px rgba(0,255,136,0.6)"] }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="w-2 h-2 rounded-full bg-profit-green"
            />
          </AnimatePresence>
          Auto-refreshes every 30 seconds
        </div>
      </section>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-10 text-center">
          <i className="fas fa-trophy text-3xl text-gold/60 block mb-3" />
          <h2 className="font-bold text-lg">No entries yet</h2>
          <p className="text-white/60 mt-1">
            Be the first to join and appear on the leaderboard.
          </p>
          <Link
            href={`/users/competitions/${competition.slug}`}
            className="btn-primary mt-5 inline-flex"
          >
            <i className="fas fa-trophy" /> Join Competition
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-white/6 bg-white/[0.03] overflow-hidden mb-7">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-white/[0.02] text-left text-[0.7rem] uppercase tracking-[0.7px] font-bold text-white/50 border-b border-white/6">
                <tr>
                  <Th w="80px">Rank</Th>
                  <Th>Trader</Th>
                  <Th w="110px">% Gain</Th>
                  <Th w="130px">Equity</Th>
                  <Th w="140px">Max DD</Th>
                  <Th w="80px">Trades</Th>
                  <Th w="110px">Last Sync</Th>
                  <Th w="100px">Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rank = r.rank || 0;
                  const gain = Number(r.profit_pct || 0);
                  const gainCls = gain > 0 ? "text-profit-green" : gain < 0 ? "text-danger" : "text-white/70";
                  const dd = Number(r.max_drawdown_pct || 0);
                  const badge =
                    r.status === "disqualified"
                      ? { icon: "fa-ban", cls: "bg-danger/12 text-danger border-danger/30", label: "DQ" }
                      : r.status === "connected"
                        ? { icon: "fa-circle", cls: "bg-profit-green/12 text-profit-green border-profit-green/30", label: "Live" }
                        : r.status === "completed"
                          ? { icon: "fa-flag-checkered", cls: "bg-white/6 text-white/70 border-white/12", label: "Done" }
                          : { icon: "fa-hourglass-half", cls: "bg-gold/12 text-gold border-gold/28", label: r.status || "—" };
                  return (
                    <tr
                      key={r.participant_id}
                      className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors ${
                        rank === 1 ? "bg-gold/[0.04]" : ""
                      }`}
                    >
                      <Td>
                        <div className="flex items-center gap-2 font-black text-lg">
                          {rank === 1 && <span className="text-xl">🥇</span>}
                          {rank === 2 && <span className="text-xl">🥈</span>}
                          {rank === 3 && <span className="text-xl">🥉</span>}
                          <span className={rank <= 3 ? "text-gold" : "text-white/75"}>
                            {rank || "—"}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          {r.avatar_url ? (
                            <Image src={r.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover border border-white/10" unoptimized />
                          ) : (
                            <span className="w-9 h-9 rounded-full grid place-items-center bg-gradient-primary text-dark text-xs font-black">
                              {initialsFor(r.display_name)}
                            </span>
                          )}
                          <div className="flex flex-col leading-tight">
                            <strong className="text-white text-sm">
                              {r.display_name || "Trader"}
                            </strong>
                            {r.mt_platform && (
                              <span className="text-[10px] uppercase tracking-wider text-white/45">
                                {r.mt_platform.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className={`font-black text-lg ${gainCls}`}>
                          {gain > 0 ? "+" : ""}
                          {gain.toFixed(2)}%
                        </span>
                      </Td>
                      <Td className="font-display font-bold">
                        {fmtMoney(r.current_equity)}
                      </Td>
                      <Td>
                        <div className="relative h-5 rounded-full bg-white/[0.05] overflow-hidden flex items-center justify-center">
                          <span
                            className="absolute left-0 top-0 bottom-0 rounded-full transition-[width] duration-500"
                            style={{
                              width: `${Math.min(100, dd)}%`,
                              background: "linear-gradient(90deg, rgba(255,209,102,0.35), rgba(255,107,107,0.55))",
                            }}
                          />
                          <em className="not-italic relative text-xs font-bold text-white z-10">
                            {dd.toFixed(2)}%
                          </em>
                        </div>
                      </Td>
                      <Td className="font-semibold text-white/80">
                        {r.trade_count ?? "—"}
                      </Td>
                      <Td className="text-[0.82rem] text-white/50">
                        {fmtSince(r.last_sync_at)}
                      </Td>
                      <Td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.cls}`}>
                          <i className={`fas ${badge.icon} text-[8px]`} />
                          {badge.label}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      {state !== "ended" && (
        <section className="rounded-2xl bg-gradient-to-r from-secondary/14 to-gold/8 border border-secondary/28 p-6 md:p-8 grid gap-5 md:grid-cols-[1fr_auto] items-center">
          <div>
            <h3 className="font-bold text-lg mb-1">Think you can top this?</h3>
            <p className="text-white/70 max-w-2xl">
              Join the challenge, connect your MT5 investor password, and enter
              the ranking. Read-only access — we never trade your account.
            </p>
          </div>
          <Link
            href={`/users/competitions/${competition.slug}`}
            className="btn-primary"
          >
            <i className="fas fa-trophy" /> Join Competition
          </Link>
        </section>
      )}
    </div>
  );
}

function MetaCell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/45">{k}</div>
      <div className="font-bold text-white mt-0.5">{v}</div>
    </div>
  );
}

function Th({ children, w }: { children: React.ReactNode; w?: string }) {
  return (
    <th className="px-4 md:px-5 py-3.5" style={w ? { width: w } : undefined}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 md:px-5 py-4 align-middle ${className}`}>{children}</td>;
}
