import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Performance",
  description:
    "Live challenge leaderboard — real Nana Forex traders competing on real accounts.",
};

// Fresh enough for a public performance page; refresh every 60s at the edge.
export const revalidate = 60;

type Trader = {
  id: string;
  name: string;
  account: string | null;
  return_pct: number;
  pips: number;
  win_rate: number;
  trades: number;
};

type Challenge = {
  id: number;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  prize_pool: number | null;
  status: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function challengeState(c: Challenge | null): "upcoming" | "active" | "ended" | "unknown" {
  if (!c || !c.start_date || !c.end_date) return "unknown";
  const now = new Date();
  const start = new Date(c.start_date);
  const end = new Date(c.end_date);
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

export default async function DashboardPage() {
  const [{ data: traders }, { data: challenge }] = await Promise.all([
    supabase
      .from("leaderboard_traders")
      .select("id, name, account, return_pct, pips, win_rate, trades")
      .order("return_pct", { ascending: false })
      .limit(50),
    supabase
      .from("challenge_config")
      .select("id, name, start_date, end_date, prize_pool, status")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const rows = (traders || []) as Trader[];
  const c = (challenge as Challenge | null) || null;
  const state = challengeState(c);
  const prize = c?.prize_pool ? `$${Number(c.prize_pool).toLocaleString()}` : "—";

  return (
    <PageShell
      header={
        <PageHero
          eyebrow="Live Performance"
          title={<>The Nana Forex <span className="gold-text">Leaderboard</span></>}
        >
          {c?.name || "Current Challenge"} — see who&apos;s topping the ranking
          in real time.
        </PageHero>
      }
    >
      {/* Challenge summary */}
      <section className="px-4 md:px-16 pb-8">
        <div className="max-w-5xl mx-auto rounded-3xl border border-white/6 bg-gradient-to-br from-secondary/10 to-gold/5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StateBadge state={state} />
            <h2 className="font-display font-bold text-2xl md:text-3xl">
              {c?.name || "Trading Challenge"}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <MetaCell label="Prize Pool" value={prize} />
            <MetaCell label="Start" value={fmtDate(c?.start_date || null)} />
            <MetaCell label="End" value={fmtDate(c?.end_date || null)} />
            <MetaCell label="Participants" value={String(rows.length)} />
          </div>
        </div>
      </section>

      {/* Leaderboard table */}
      <section className="px-4 md:px-16 pb-24">
        <div className="max-w-5xl mx-auto">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-12 text-center">
              <i className="fas fa-trophy text-gold text-3xl mb-3 block" />
              <h2 className="font-bold text-xl mb-2">No traders yet</h2>
              <p className="text-white/60 mb-5">
                The leaderboard will fill up as this challenge&apos;s traders
                start posting results.
              </p>
              <Link href="/services" className="btn-primary">
                See how to join
              </Link>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/6 bg-white/[0.03] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="text-left text-[0.7rem] uppercase tracking-[0.7px] font-bold text-white/50 bg-white/[0.02]">
                      <th className="px-5 py-4 w-20">Rank</th>
                      <th className="px-5 py-4">Trader</th>
                      <th className="px-5 py-4">Account</th>
                      <th className="px-5 py-4">Return</th>
                      <th className="px-5 py-4">Pips</th>
                      <th className="px-5 py-4">Win Rate</th>
                      <th className="px-5 py-4">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t, i) => {
                      const rank = i + 1;
                      const isTop = rank <= 3;
                      const medal =
                        rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
                      return (
                        <Reveal key={t.id} delay={Math.min(i, 8) * 0.03}>
                          <tr
                            className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                              rank === 1 ? "bg-gold/[0.04]" : ""
                            }`}
                          >
                            <td className="px-5 py-4 font-black text-lg">
                              <span className="flex items-center gap-2">
                                {medal && <span className="text-xl">{medal}</span>}
                                <span className={isTop ? "text-gold" : "text-white/75"}>
                                  {rank}
                                </span>
                              </span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-white">
                              {t.name}
                            </td>
                            <td className="px-5 py-4 text-white/75 text-sm">
                              {t.account || "—"}
                            </td>
                            <td className="px-5 py-4 font-bold text-profit-green">
                              +{Number(t.return_pct).toFixed(1)}%
                            </td>
                            <td className="px-5 py-4 text-profit-green font-semibold">
                              +{Number(t.pips || 0).toLocaleString()}
                            </td>
                            <td className="px-5 py-4 text-white/85">
                              {t.win_rate}%
                            </td>
                            <td className="px-5 py-4 text-white/85">
                              {t.trades}
                            </td>
                          </tr>
                        </Reveal>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-white/40 mt-6">
            Updates automatically every minute. Powered by verified broker data.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/6 px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display font-bold text-lg mt-0.5">{value}</div>
    </div>
  );
}

function StateBadge({ state }: { state: "upcoming" | "active" | "ended" | "unknown" }) {
  const map = {
    active: { icon: "fa-circle", label: "Active", cls: "bg-profit-green/12 text-profit-green border-profit-green/35" },
    upcoming: { icon: "fa-clock", label: "Upcoming", cls: "bg-gold/12 text-gold border-gold/35" },
    ended: { icon: "fa-flag-checkered", label: "Ended", cls: "bg-white/6 text-white/65 border-white/15" },
    unknown: { icon: "fa-circle-info", label: "Status", cls: "bg-white/6 text-white/65 border-white/15" },
  }[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${map.cls}`}
    >
      <i className={`fas ${map.icon} text-[0.6rem]`} />
      {map.label}
    </span>
  );
}
