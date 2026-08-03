import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Competitions" };
export const dynamic = "force-dynamic";

type Rules = {
  starting_balance?: number;
  max_drawdown_pct?: number;
  allowed_platforms?: string[];
};

type Comp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: number | null;
  rules: Rules | null;
};

type Participation = { competition_id: string; status: string };

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

function myLabel(status: string) {
  switch (status) {
    case "pending":
    case "connecting":  return { icon: "fa-link", text: "Connect account" };
    case "connected":   return { icon: "fa-eye",  text: "View your entry" };
    case "disqualified":return { icon: "fa-eye",  text: "View (disqualified)" };
    case "withdrawn":   return { icon: "fa-eye",  text: "View (withdrawn)" };
    case "completed":   return { icon: "fa-eye",  text: "View results" };
    default:            return { icon: "fa-eye",  text: "View" };
  }
}

export default async function CompetitionsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: comps }, mine] = await Promise.all([
    supabase
      .from("competitions")
      .select("id, slug, name, description, status, start_date, end_date, prize_pool, rules")
      .order("start_date", { ascending: true }),
    user
      ? supabase
          .from("participants")
          .select("competition_id, status")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as Participation[] }),
  ]);

  const rows = (comps ?? []) as Comp[];
  const partByComp = new Map<string, string>();
  ((mine as { data?: Participation[] }).data || []).forEach((p) =>
    partByComp.set(p.competition_id, p.status),
  );

  return (
    <div className="p-4 md:p-8 space-y-8">
      <header className="max-w-3xl">
        <span className="section-eyebrow">
          <i className="fas fa-trophy" /> Live Trading Contests
        </span>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-2">
          Prove your edge. Win the <span className="gold-text">prize pool.</span>
        </h1>
        <p className="text-white/65 mt-2">
          Join a competition, connect your MT5 investor password, and you&apos;re
          on the live leaderboard. Read-only access — we never trade your account.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-10 text-center">
          <i className="fas fa-trophy text-3xl text-gold/60 block mb-3" />
          <h2 className="font-bold text-lg">No competitions yet</h2>
          <p className="text-white/60 mt-1">
            The next challenge will show up here — check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => {
            const st = stateOf(c);
            const style = stateStyle[st];
            const my = partByComp.get(c.id);
            const rules = c.rules || {};
            const platforms = (rules.allowed_platforms || ["mt5"])
              .map((s) => s.toUpperCase())
              .join(" / ");
            const startBal =
              rules.starting_balance != null
                ? "$" + Number(rules.starting_balance).toLocaleString()
                : "—";
            const dd =
              rules.max_drawdown_pct != null ? `${rules.max_drawdown_pct}%` : "—";
            const cta =
              st === "ended"
                ? { href: `/users/competitions/${c.slug}`, cls: "bg-white/5 border border-white/10 text-white/85 hover:bg-white/10", label: "View results", icon: "fa-eye" }
                : my
                  ? { href: `/users/competitions/${c.slug}`, cls: "bg-gradient-primary text-dark hover:brightness-105", ...myLabel(my), label: myLabel(my).text }
                  : { href: `/users/competitions/${c.slug}`, cls: "bg-gradient-primary text-dark hover:brightness-105", label: "Join Competition", icon: "fa-trophy" };

            return (
              <article
                key={c.id}
                className="rounded-2xl border border-white/6 bg-white/[0.03] p-6 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-secondary/25 hover:shadow-elevated transition-all"
              >
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.cls}`}
                  >
                    <i className={`fas ${style.icon} text-[8px]`} />
                    {style.label}
                  </span>
                  <span className="text-gold text-xs font-bold uppercase tracking-wider">
                    {c.prize_pool
                      ? "$" + Number(c.prize_pool).toLocaleString()
                      : "—"}{" "}
                    prize
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg">{c.name}</h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  {c.description || ""}
                </p>
                <dl className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-sm border-t border-white/6 pt-3">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/45">Starting</dt>
                    <dd className="font-bold">{startBal}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/45">Max drawdown</dt>
                    <dd className="font-bold">{dd}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/45">Platform</dt>
                    <dd className="font-bold">{platforms}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-white/45">Dates</dt>
                    <dd className="font-bold text-white/85">
                      {fmtDate(c.start_date)} – {fmtDate(c.end_date)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto pt-3">
                  <Link
                    href={cta.href}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all ${cta.cls}`}
                  >
                    <i className={`fas ${cta.icon}`} /> {cta.label}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
