import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal Nana Forex dashboard.",
};

export const dynamic = "force-dynamic";

const ACTIONS = [
  { icon: "fa-trophy", label: "Competitions", href: "/users/competitions" },
  { icon: "fa-graduation-cap", label: "Go to Academy", href: "/users/academy" },
  { icon: "fa-copy", label: "Copy Trading", href: "/users/copy-trading" },
  { icon: "fa-signal", label: "View Signals", href: "/users/signals" },
  { icon: "fa-chart-pie", label: "Market Analysis", href: "/users/market-analysis" },
  { icon: "fa-users", label: "Refer a Friend", href: "/users/ib-partnership" },
];

type ParticipationRow = {
  id: string;
  status: string;
  starting_balance: number | null;
  current_equity: number | null;
  current_balance: number | null;
  max_drawdown_pct: number | null;
  trade_count: number | null;
  last_sync_at: string | null;
  mt_login: string | null;
  mt_server: string | null;
  broker_name: string | null;
  competition_id: string;
  competitions: {
    id: string;
    slug: string;
    name: string;
    status: string;
    end_date: string;
  } | null;
};

function money(n: number | null | undefined) {
  if (n == null) return "$0.00";
  return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function pctSigned(n: number | null | undefined) {
  if (n == null) return "—";
  const v = Number(n);
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function since(iso: string | null | undefined) {
  if (!iso) return "not yet";
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return s + "s ago";
  if (s < 3600) return Math.round(s / 60) + "m ago";
  return Math.round(s / 3600) + "h ago";
}

export default async function ClientDashboardPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email?.split("@")[0] ||
    "Trader";

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const { data: participations } = user
    ? await supabase
        .from("participants")
        .select(
          `id, status, starting_balance, current_equity, current_balance,
           max_drawdown_pct, trade_count, last_sync_at, mt_login, mt_server,
           broker_name, competition_id,
           competitions:competition_id ( id, slug, name, status, end_date )`,
        )
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false })
    : { data: [] };

  const rows = (participations || []) as unknown as ParticipationRow[];

  // Pick the most useful entry to headline: prefer connected, then connecting,
  // then most recent.
  const active =
    rows.find((r) => r.status === "connected") ||
    rows.find((r) => r.status === "connecting") ||
    rows[0] ||
    null;

  const pl =
    active && active.starting_balance != null && active.current_equity != null
      ? active.current_equity - active.starting_balance
      : null;
  const plPct =
    active && active.starting_balance
      ? ((active.current_equity ?? active.starting_balance) - active.starting_balance) /
        active.starting_balance *
        100
      : null;

  const stats = [
    {
      icon: "fa-wallet",
      tone: "green" as const,
      label: "Account Balance",
      value: money(active?.current_balance ?? active?.current_equity ?? null),
      change: active ? `Starting: ${money(active.starting_balance)}` : "not connected",
    },
    {
      icon: "fa-chart-line",
      tone: pl != null && pl < 0 ? ("red" as const) : ("green" as const),
      label: "Profit / Loss",
      value: pl != null ? (pl >= 0 ? "+" : "") + money(pl).replace("$-", "$") : "$0.00",
      change: pctSigned(plPct),
    },
    {
      icon: "fa-exchange-alt",
      tone: "gold" as const,
      label: "Trades",
      value: String(active?.trade_count ?? 0),
      change: active?.status === "connected" ? "live tracking" : "no data yet",
    },
    {
      icon: "fa-shield-halved",
      tone: "blue" as const,
      label: "Max Drawdown",
      value: active?.max_drawdown_pct != null ? `${Number(active.max_drawdown_pct).toFixed(2)}%` : "—",
      change: active?.last_sync_at ? `Synced ${since(active.last_sync_at)}` : "not synced",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Welcome banner */}
      <section className="rounded-2xl border border-white/6 bg-gradient-to-br from-secondary/10 via-black/40 to-transparent p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl md:text-3xl">
            Welcome back, <span className="gold-text">{displayName}</span> 👋
          </h2>
          <p className="text-white/60 mt-1">Here&apos;s your trading overview for today.</p>
        </div>
        <div className="text-sm text-white/60 inline-flex items-center gap-2">
          <i className="fas fa-calendar-alt" /> {today}
        </div>
      </section>

      {/* Empty state / connect prompt */}
      {rows.length === 0 && (
        <section className="rounded-2xl border border-secondary/25 bg-secondary/6 p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">You haven&apos;t joined a competition yet</h3>
            <p className="text-white/70 mt-1">
              Join a live challenge and link your MT5 investor password —
              we&apos;ll show your equity, drawdown, and rank right here.
            </p>
          </div>
          <Link href="/users/competitions" className="btn-primary">
            <i className="fas fa-trophy" /> Browse Competitions
          </Link>
        </section>
      )}

      {rows.length > 0 && active && active.status !== "connected" && (
        <section className="rounded-2xl border border-gold/25 bg-gold/6 p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold">
              {active.status === "connecting"
                ? "Linking your MT account…"
                : "Finish setting up your competition"}
            </h3>
            <p className="text-white/70 text-sm mt-0.5">
              {active.competitions?.name || "Your competition"} — connect your
              MT5 investor password to go live on the leaderboard.
            </p>
          </div>
          {active.competitions?.slug && (
            <Link
              href={`/users/competitions/${active.competitions.slug}`}
              className="btn-primary"
            >
              <i className="fas fa-link" /> Continue
            </Link>
          )}
        </section>
      )}

      {/* Stats widgets */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const toneCls =
            s.tone === "green"
              ? "bg-secondary/12 text-secondary"
              : s.tone === "red"
                ? "bg-danger/12 text-danger"
                : s.tone === "gold"
                  ? "bg-gold/12 text-gold"
                  : "bg-[#229ED9]/12 text-[#229ED9]";
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:border-secondary/25 transition-all"
            >
              <div className={`w-11 h-11 rounded-xl grid place-items-center ${toneCls}`}>
                <i className={`fas ${s.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.6px] text-white/55 truncate">
                  {s.label}
                </div>
                <div className="font-display font-extrabold text-2xl mt-0.5">{s.value}</div>
              </div>
              <div className="text-[11px] font-semibold text-white/50 whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1 max-w-[9rem] truncate">
                {s.change}
              </div>
            </div>
          );
        })}
      </section>

      {/* My competitions */}
      {rows.length > 0 && (
        <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">My competitions</h3>
            <Link
              href="/users/competitions"
              className="text-xs font-semibold text-secondary hover:text-secondary/80"
            >
              See all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-white/50">
                <tr>
                  <th className="text-left px-3 py-2">Competition</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Equity</th>
                  <th className="text-right px-3 py-2">P/L %</th>
                  <th className="text-right px-3 py-2">Drawdown</th>
                  <th className="text-right px-3 py-2">Trades</th>
                  <th className="text-right px-3 py-2">Last sync</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rp =
                    r.starting_balance
                      ? ((r.current_equity ?? r.starting_balance) - r.starting_balance) /
                        r.starting_balance *
                        100
                      : null;
                  const rpCls =
                    rp == null
                      ? "text-white/60"
                      : rp >= 0
                        ? "text-profit-green"
                        : "text-danger";
                  return (
                    <tr key={r.id} className="border-t border-white/6">
                      <td className="px-3 py-3">
                        <div className="font-semibold">
                          {r.competitions?.name || "—"}
                        </div>
                        {r.mt_login && (
                          <div className="text-[11px] text-white/45">
                            {r.broker_name ? r.broker_name + " · " : ""}
                            {r.mt_login}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border border-white/12 text-white/75">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {money(r.current_equity)}
                      </td>
                      <td className={`px-3 py-3 text-right font-bold ${rpCls}`}>
                        {pctSigned(rp)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {r.max_drawdown_pct != null
                          ? `${Number(r.max_drawdown_pct).toFixed(2)}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">{r.trade_count ?? 0}</td>
                      <td className="px-3 py-3 text-right text-white/60 text-xs">
                        {since(r.last_sync_at)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {r.competitions?.slug && (
                          <Link
                            href={`/users/competitions/${r.competitions.slug}`}
                            className="text-secondary hover:underline text-xs font-semibold"
                          >
                            Open →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-white/40 mt-3">
            Live values sync every minute from your broker. First data can take
            up to 2 minutes after connecting.
          </p>
        </section>
      )}

      {/* Quick actions */}
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
        <h3 className="font-bold mb-4">Quick Actions</h3>
        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl bg-white/[0.03] border border-white/6 hover:-translate-y-0.5 hover:bg-secondary/8 hover:border-secondary/35 transition-all text-center"
            >
              <i className={`fas ${a.icon} text-secondary`} />
              <span className="text-xs font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
