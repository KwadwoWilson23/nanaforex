import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminSupabase } from "@/lib/supabase-admin";
import AdminParticipantsTable, {
  type AdminParticipantRow,
  type CompetitionMeta,
} from "@/components/AdminParticipantsTable";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await adminSupabase()
    .from("competitions")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return { title: `Console · ${data?.name || "Competition"}` };
}

function computeState(status: string, endDate: string, startDate: string) {
  const now = new Date();
  if (status === "cancelled") return "cancelled" as const;
  if (status === "ended" || new Date(endDate) < now) return "ended" as const;
  if (status === "upcoming" || new Date(startDate) > now) return "upcoming" as const;
  return "active" as const;
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

type AuditRow = {
  id: string;
  action: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor_id: string | null;
};

export default async function ConsoleCompetitionDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sb = adminSupabase();

  const { data: comp } = await sb
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool")
    .eq("slug", slug)
    .maybeSingle();
  if (!comp) notFound();

  const [{ data: view }, { data: extra }] = await Promise.all([
    sb.from("leaderboard_current")
      .select(
        "participant_id, user_id, display_name, mt_platform, status, starting_balance, current_equity, profit_pct, max_drawdown_pct, trade_count, last_sync_at, rank",
      )
      .eq("competition_id", comp.id)
      .order("rank", { ascending: true }),
    sb.from("participants")
      .select("id, mt_login, mt_server, broker_name, status_reason, disqualified_at, joined_at")
      .eq("competition_id", comp.id),
  ]);

  type ViewRow = {
    participant_id: string;
    user_id: string | null;
    display_name: string | null;
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
  type ExtraRow = {
    id: string;
    mt_login: string | null;
    mt_server: string | null;
    broker_name: string | null;
    status_reason: string | null;
    disqualified_at: string | null;
    joined_at: string | null;
  };

  const extraById = new Map<string, ExtraRow>();
  for (const e of (extra || []) as ExtraRow[]) extraById.set(e.id, e);

  const seen = new Set(((view || []) as ViewRow[]).map((v) => v.participant_id));
  const missing = ((extra || []) as ExtraRow[]).filter((e) => !seen.has(e.id));

  const rows: AdminParticipantRow[] = [
    ...(((view || []) as ViewRow[]).map((v) => {
      const e = extraById.get(v.participant_id);
      return {
        participant_id: v.participant_id,
        user_id: v.user_id,
        display_name: v.display_name,
        mt_platform: v.mt_platform,
        status: v.status,
        starting_balance: v.starting_balance,
        current_equity: v.current_equity,
        profit_pct: v.profit_pct,
        max_drawdown_pct: v.max_drawdown_pct,
        trade_count: v.trade_count,
        last_sync_at: v.last_sync_at,
        rank: v.rank,
        mt_login: e?.mt_login ?? null,
        mt_server: e?.mt_server ?? null,
        broker_name: e?.broker_name ?? null,
        status_reason: e?.status_reason ?? null,
        disqualified_at: e?.disqualified_at ?? null,
        joined_at: e?.joined_at ?? null,
      };
    })),
    ...missing.map((e) => ({
      participant_id: e.id,
      user_id: null,
      display_name: "Trader",
      mt_platform: null,
      status: null,
      starting_balance: null,
      current_equity: null,
      profit_pct: 0,
      max_drawdown_pct: 0,
      trade_count: 0,
      last_sync_at: null,
      rank: null,
      mt_login: e.mt_login,
      mt_server: e.mt_server,
      broker_name: e.broker_name,
      status_reason: e.status_reason,
      disqualified_at: e.disqualified_at,
      joined_at: e.joined_at,
    })),
  ];

  const totals = {
    total: rows.length,
    connected: rows.filter((r) => r.status === "connected").length,
    disqualified: rows.filter((r) => r.status === "disqualified").length,
  };

  const st = computeState(comp.status, comp.end_date, comp.start_date);
  const badge = stateStyle[st];

  const { data: audit } = await sb
    .from("audit_log")
    .select("id, action, entity_id, metadata, created_at, actor_id")
    .eq("entity_type", "participant")
    .order("created_at", { ascending: false })
    .limit(30);

  const auditForThisComp = ((audit || []) as AuditRow[]).filter(
    (a) => a.metadata && (a.metadata as { competition_id?: string }).competition_id === comp.id,
  );

  const meta: CompetitionMeta = { id: comp.id, slug: comp.slug, name: comp.name };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/nanaforexlogs/competitions"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-secondary px-3 py-1.5 rounded-full border border-white/10 hover:border-secondary/40 hover:bg-secondary/8 transition-all"
        >
          <i className="fas fa-arrow-left" /> All competitions
        </Link>
        <Link
          href={`/competitions/${comp.slug}/leaderboard`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-white/10 text-white/85 hover:border-secondary/40 hover:bg-secondary/8 transition-all"
        >
          <i className="fas fa-chart-line" /> Public Leaderboard
        </Link>
      </div>

      <section className="rounded-3xl border border-white/6 p-6 md:p-8 bg-gradient-to-br from-secondary/8 to-black/40">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badge.cls}`}
          >
            <i className={`fas ${badge.icon} text-[8px]`} /> {badge.label}
          </span>
          <span className="text-gold text-xs font-bold uppercase tracking-wider">
            {comp.prize_pool ? "$" + Number(comp.prize_pool).toLocaleString() : "—"} prize
          </span>
        </div>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-3">
          {comp.name}
        </h1>
        {comp.description && (
          <p className="text-white/70 mt-2 max-w-2xl">{comp.description}</p>
        )}
        <div className="grid gap-4 md:grid-cols-5 mt-6 pt-4 border-t border-white/8">
          <Cell k="Start" v={fmtDate(comp.start_date)} />
          <Cell k="End" v={fmtDate(comp.end_date)} />
          <Cell k="Total" v={String(totals.total)} />
          <Cell k="Live" v={String(totals.connected)} tone="green" />
          <Cell k="Disqualified" v={String(totals.disqualified)} tone="red" />
        </div>
      </section>

      <AdminParticipantsTable competition={meta} initialRows={rows} />

      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-5">
        <h3 className="font-bold flex items-center gap-2 mb-3">
          <i className="fas fa-clipboard-list text-secondary" /> Audit log
        </h3>
        {auditForThisComp.length === 0 ? (
          <p className="text-white/55 text-sm">No admin actions yet.</p>
        ) : (
          <div className="space-y-2">
            {auditForThisComp.map((a) => {
              const md = (a.metadata || {}) as { reason?: string };
              return (
                <div
                  key={a.id}
                  className="rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 text-sm"
                >
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <span className="font-bold text-white/90">{a.action}</span>
                    <span className="text-[11px] text-white/50">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-white/60 text-xs mt-1">
                    Participant <code className="text-secondary">{a.entity_id}</code>
                    {md.reason ? ` — ${md.reason}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Cell({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "green" | "red";
}) {
  const cls =
    tone === "green"
      ? "text-profit-green"
      : tone === "red"
        ? "text-danger"
        : "text-white";
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/45">{k}</div>
      <div className={`font-bold mt-0.5 ${cls}`}>{v}</div>
    </div>
  );
}
