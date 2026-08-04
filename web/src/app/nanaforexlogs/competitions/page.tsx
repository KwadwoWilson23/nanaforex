import type { Metadata } from "next";
import Link from "next/link";
import { adminSupabase } from "@/lib/supabase-admin";

export const metadata: Metadata = { title: "Console · Competitions" };
export const dynamic = "force-dynamic";

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

type Counts = {
  total: number;
  connected: number;
  pending: number;
  disqualified: number;
  withdrawn: number;
  completed: number;
};

function emptyCounts(): Counts {
  return { total: 0, connected: 0, pending: 0, disqualified: 0, withdrawn: 0, completed: 0 };
}

function computeState(c: Comp): "active" | "upcoming" | "ended" | "cancelled" {
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ConsoleCompetitionsPage() {
  const sb = adminSupabase();
  const [{ data: compsData }, { data: partsData }] = await Promise.all([
    sb.from("competitions")
      .select("id, slug, name, description, status, start_date, end_date, prize_pool")
      .order("start_date", { ascending: false }),
    sb.from("participants").select("competition_id, status"),
  ]);

  const comps = (compsData || []) as Comp[];
  const parts = (partsData || []) as Array<{ competition_id: string; status: string }>;

  const counts = new Map<string, Counts>();
  for (const p of parts) {
    const c = counts.get(p.competition_id) || emptyCounts();
    c.total++;
    if (p.status === "connected") c.connected++;
    else if (p.status === "pending" || p.status === "connecting") c.pending++;
    else if (p.status === "disqualified") c.disqualified++;
    else if (p.status === "withdrawn") c.withdrawn++;
    else if (p.status === "completed") c.completed++;
    counts.set(p.competition_id, c);
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="section-eyebrow">
            <i className="fas fa-shield-halved" /> Console
          </span>
          <h1 className="font-display font-extrabold text-3xl mt-1">Competitions</h1>
          <p className="text-white/60 mt-1 text-sm">
            Manage every competition, monitor participants, and disqualify on rule breaches.
          </p>
        </div>
        <div className="text-xs text-white/45">
          {comps.length} competition{comps.length === 1 ? "" : "s"}
        </div>
      </header>

      {comps.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-10 text-center">
          <i className="fas fa-trophy text-gold/60 text-3xl mb-3 block" />
          <h2 className="font-bold text-lg">No competitions yet</h2>
          <p className="text-white/60 mt-1">
            Seed one with <code className="text-secondary">supabase/seed-july-challenge.sql</code>{" "}
            or insert into the <code>competitions</code> table directly.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {comps.map((c) => {
            const st = computeState(c);
            const style = stateStyle[st];
            const cn = counts.get(c.id) || emptyCounts();
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
                    {c.prize_pool ? "$" + Number(c.prize_pool).toLocaleString() : "—"} prize
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg">{c.name}</h3>
                {c.description && (
                  <p className="text-white/60 text-sm line-clamp-2">{c.description}</p>
                )}
                <dl className="grid grid-cols-4 gap-2 text-center border-t border-white/6 pt-3">
                  <Metric label="Total" value={cn.total} />
                  <Metric label="Live" value={cn.connected} tone="green" />
                  <Metric label="Pending" value={cn.pending} tone="gold" />
                  <Metric label="DQ" value={cn.disqualified} tone="red" />
                </dl>
                <div className="text-xs text-white/50 border-t border-white/6 pt-3">
                  {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                </div>
                <div className="mt-auto flex gap-2 pt-2">
                  <Link
                    href={`/nanaforexlogs/competitions/${c.slug}`}
                    className="btn-primary flex-1 justify-center text-sm py-2.5"
                  >
                    <i className="fas fa-gear" /> Manage
                  </Link>
                  <Link
                    href={`/competitions/${c.slug}/leaderboard`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/12 text-white/85 hover:border-secondary/40 hover:bg-secondary/8 transition-all text-sm"
                  >
                    <i className="fas fa-chart-line" /> Public
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

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "gold" | "red";
}) {
  const valueCls =
    tone === "green"
      ? "text-profit-green"
      : tone === "gold"
        ? "text-gold"
        : tone === "red"
          ? "text-danger"
          : "text-white";
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div className={`font-black text-lg ${valueCls}`}>{value}</div>
    </div>
  );
}
