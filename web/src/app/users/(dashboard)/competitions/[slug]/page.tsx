import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import CompetitionParticipation from "@/components/CompetitionParticipation";

export const dynamic = "force-dynamic";

type Rules = {
  starting_balance?: number;
  max_drawdown_pct?: number;
  min_trades?: number;
  allowed_platforms?: string[];
  account_type?: string[];
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

export type Participant = {
  id: string;
  status: string;
  status_reason: string | null;
  mt_platform: string | null;
  mt_login: string | null;
  mt_server: string | null;
  broker_name: string | null;
  starting_balance: number | null;
  current_equity: number | null;
  last_sync_at: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sb = await createSupabaseServer();
  const { data } = await sb
    .from("competitions")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return { title: data?.name || "Competition" };
}

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

export default async function CompetitionDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sb = await createSupabaseServer();

  const { data: comp } = await sb
    .from("competitions")
    .select(
      "id, slug, name, description, status, start_date, end_date, prize_pool, rules",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!comp) notFound();

  const c = comp as Comp;
  const st = stateOf(c);
  const badge = stateStyle[st];
  const rules = c.rules || {};
  const platforms = (rules.allowed_platforms || ["mt5"])
    .map((s) => s.toUpperCase())
    .join(" / ");

  const { data: { user } } = await sb.auth.getUser();
  let participant: Participant | null = null;
  if (user) {
    const { data: p } = await sb
      .from("participants")
      .select(
        "id, status, status_reason, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity, last_sync_at",
      )
      .eq("competition_id", c.id)
      .eq("user_id", user.id)
      .maybeSingle();
    participant = (p as Participant) || null;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/users/competitions"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-secondary px-3 py-1.5 rounded-full border border-white/10 hover:border-secondary/40 hover:bg-secondary/8 transition-all"
        >
          <i className="fas fa-arrow-left" /> All competitions
        </Link>
        <Link
          href={`/competitions/${c.slug}/leaderboard`}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-white/10 text-white/85 hover:border-secondary/40 hover:bg-secondary/8 transition-all"
        >
          <i className="fas fa-chart-line" /> View Public Leaderboard
        </Link>
      </div>

      {/* Hero */}
      <section
        className="rounded-3xl border border-white/6 p-6 md:p-8"
        style={{
          background:
            "radial-gradient(1200px 260px at 0% 0%, rgba(0,200,150,0.14), transparent 60%), linear-gradient(135deg, rgba(0,200,150,0.10), rgba(15,23,42,0.5))",
        }}
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badge.cls}`}
        >
          <i className={`fas ${badge.icon} text-[8px]`} />
          {badge.label}
        </span>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-3">
          {c.name}
        </h1>
        {c.description && (
          <p className="text-white/70 mt-3 max-w-2xl">{c.description}</p>
        )}
        <div className="grid gap-4 md:grid-cols-4 mt-6 pt-4 border-t border-white/8">
          {[
            {
              k: "Prize Pool",
              v: c.prize_pool ? "$" + Number(c.prize_pool).toLocaleString() : "—",
            },
            { k: "Starts", v: fmtDate(c.start_date) },
            { k: "Ends", v: fmtDate(c.end_date) },
            { k: "Platform", v: platforms },
          ].map((m) => (
            <div key={m.k}>
              <div className="text-[11px] uppercase tracking-wider text-white/45">
                {m.k}
              </div>
              <div className="font-bold text-white mt-0.5">{m.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Rules */}
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-6">
        <h3 className="font-bold flex items-center gap-2 mb-3">
          <i className="fas fa-scale-balanced text-gold" /> Rules
        </h3>
        <ul className="space-y-2 text-sm text-white/80">
          {rules.starting_balance != null && (
            <li>
              <i className="fas fa-check text-profit-green mr-2 text-xs" />
              Start with a ${Number(rules.starting_balance).toLocaleString()} account
            </li>
          )}
          {rules.max_drawdown_pct != null && (
            <li>
              <i className="fas fa-check text-profit-green mr-2 text-xs" />
              Max drawdown: {rules.max_drawdown_pct}% (auto-disqualify above this)
            </li>
          )}
          {rules.min_trades != null && (
            <li>
              <i className="fas fa-check text-profit-green mr-2 text-xs" />
              Minimum {rules.min_trades} trades to qualify at the end
            </li>
          )}
          {rules.allowed_platforms && (
            <li>
              <i className="fas fa-check text-profit-green mr-2 text-xs" />
              Accepted platforms: {rules.allowed_platforms.map((s) => s.toUpperCase()).join(", ")}
            </li>
          )}
          {rules.account_type && (
            <li>
              <i className="fas fa-check text-profit-green mr-2 text-xs" />
              Account types allowed: {rules.account_type.map((s) => s.toUpperCase()).join(" or ")}
            </li>
          )}
        </ul>
      </section>

      {/* Participation (client component handles join/connect/withdraw) */}
      <CompetitionParticipation
        competitionId={c.id}
        competitionSlug={c.slug}
        competitionState={st}
        allowedPlatforms={rules.allowed_platforms || ["mt5"]}
        initialParticipant={participant}
      />
    </div>
  );
}
