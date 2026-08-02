import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal Nana Forex dashboard.",
};

const STATS = [
  { icon: "fa-wallet", tone: "green" as const, label: "Account Balance", value: "$0.00", change: "—" },
  { icon: "fa-chart-line", tone: "red" as const, label: "Profit / Loss", value: "$0.00", change: "—" },
  { icon: "fa-exchange-alt", tone: "gold" as const, label: "Active Trades", value: "0", change: "no open positions" },
  { icon: "fa-bell", tone: "blue" as const, label: "Notifications", value: "0", change: "all caught up" },
];

const ACTIONS = [
  { icon: "fa-trophy", label: "Competitions", href: "/users/competitions" },
  { icon: "fa-graduation-cap", label: "Go to Academy", href: "/users/academy" },
  { icon: "fa-copy", label: "Copy Trading", href: "/users/copy-trading" },
  { icon: "fa-signal", label: "View Signals", href: "/users/signals" },
  { icon: "fa-chart-pie", label: "Market Analysis", href: "/users/market-analysis" },
  { icon: "fa-users", label: "Refer a Friend", href: "/users/ib-partnership" },
];

function toneClasses(tone: "green" | "red" | "gold" | "blue") {
  switch (tone) {
    case "green": return "bg-secondary/12 text-secondary";
    case "red":   return "bg-danger/12 text-danger";
    case "gold":  return "bg-gold/12 text-gold";
    case "blue":  return "bg-[#229ED9]/12 text-[#229ED9]";
  }
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

      {/* Stats widgets */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:border-secondary/25 transition-all"
          >
            <div className={`w-11 h-11 rounded-xl grid place-items-center ${toneClasses(s.tone)}`}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.6px] text-white/55 truncate">
                {s.label}
              </div>
              <div className="font-display font-extrabold text-2xl mt-0.5">{s.value}</div>
            </div>
            <div className="text-[11px] font-semibold text-white/50 whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1">
              {s.change}
            </div>
          </div>
        ))}
      </section>

      {/* Charts row (empty state, connects when trades exist) */}
      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Equity Curve", sub: "Last 30 days", icon: "fa-chart-area", body: "Connect your trading account to see your equity curve." },
          { title: "Performance Graph", sub: "Weekly returns", icon: "fa-chart-column", body: "Once you have trades, weekly returns will show here." },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 min-h-[280px] flex flex-col">
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="font-bold">{c.title}</h3>
              <span className="text-xs text-white/50">{c.sub}</span>
            </div>
            <div className="flex-1 grid place-items-center text-center px-4 py-8 text-white/55">
              <div>
                <i className={`fas ${c.icon} text-3xl text-secondary/60 block mb-2`} />
                <p className="font-semibold text-white/85">No data yet</p>
                <p className="text-sm text-white/50 mt-1 max-w-xs mx-auto">{c.body}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Bottom row: recent activity + quick actions */}
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 min-h-[260px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Recent Activity</h3>
            <span className="text-xs text-white/45">Empty for now</span>
          </div>
          <div className="flex-1 grid place-items-center text-center py-6">
            <div className="text-white/55">
              <i className="fas fa-inbox text-2xl text-secondary/50 block mb-2" />
              <p className="font-semibold text-white/85">No activity yet</p>
              <p className="text-sm text-white/50 mt-1">
                Your trades, deposits, and account events will appear here.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
          <h3 className="font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
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
        </div>
      </section>

      {/* Trading statistics (empty state — real values populate from real trades) */}
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
        <h3 className="font-bold mb-4">Trading Statistics</h3>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            "Total Trades", "Winning Trades", "Losing Trades", "Win Rate",
            "Average Win", "Average Loss", "Profit Factor", "Best Trade",
          ].map((label) => (
            <div key={label} className="rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.6px] text-white/50">{label}</div>
              <div className="font-bold text-white/75 mt-0.5">—</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
