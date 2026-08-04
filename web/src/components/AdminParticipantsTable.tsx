"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type CompetitionMeta = {
  id: string;
  slug: string;
  name: string;
};

export type AdminParticipantRow = {
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
  mt_login: string | null;
  mt_server: string | null;
  broker_name: string | null;
  status_reason: string | null;
  disqualified_at: string | null;
  joined_at: string | null;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "connected", label: "Connected" },
  { value: "connecting", label: "Connecting" },
  { value: "pending", label: "Pending" },
  { value: "disqualified", label: "Disqualified" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "completed", label: "Completed" },
];

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
function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function statusPillCls(status: string | null) {
  switch (status) {
    case "connected":
      return "bg-profit-green/12 text-profit-green border-profit-green/35";
    case "connecting":
    case "pending":
      return "bg-gold/12 text-gold border-gold/35";
    case "disqualified":
      return "bg-danger/12 text-danger border-danger/35";
    case "withdrawn":
    case "completed":
      return "bg-white/6 text-white/65 border-white/12";
    default:
      return "bg-white/6 text-white/65 border-white/12";
  }
}

export default function AdminParticipantsTable({
  competition,
  initialRows,
}: {
  competition: CompetitionMeta;
  initialRows: AdminParticipantRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminParticipantRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dqBusyId, setDqBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${r.display_name || ""} ${r.mt_login || ""} ${r.broker_name || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, statusFilter]);

  async function disqualify(row: AdminParticipantRow) {
    const name = row.display_name || "this trader";
    const reason = window.prompt(
      `Disqualify ${name}?\n\nEnter a reason (visible in the audit log):`,
    );
    if (reason == null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      window.alert("Reason is required.");
      return;
    }
    setDqBusyId(row.participant_id);
    try {
      const r = await fetch("/api/admin/disqualify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ participant_id: row.participant_id, reason: trimmed }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Disqualify failed");
      // Optimistic update; also refresh page so audit log reloads.
      setRows((prev) =>
        prev.map((p) =>
          p.participant_id === row.participant_id
            ? {
                ...p,
                status: "disqualified",
                status_reason: trimmed,
                disqualified_at: new Date().toISOString(),
              }
            : p,
        ),
      );
      router.refresh();
    } catch (e) {
      console.error("[admin/disqualify] client error", e);
      window.alert("Could not disqualify. Please try again.");
    } finally {
      setDqBusyId(null);
    }
  }

  function exportCsv() {
    const header = [
      "Rank",
      "Display Name",
      "User ID",
      "MT Login",
      "MT Server",
      "Broker",
      "Platform",
      "Status",
      "Status Reason",
      "Starting Balance",
      "Current Equity",
      "Profit %",
      "Max Drawdown %",
      "Trade Count",
      "Joined At",
      "Last Sync At",
      "Disqualified At",
    ];
    const lines = rows.map((r) =>
      [
        r.rank ?? "",
        r.display_name ?? "",
        r.user_id ?? "",
        r.mt_login ?? "",
        r.mt_server ?? "",
        r.broker_name ?? "",
        r.mt_platform ?? "",
        r.status ?? "",
        r.status_reason ?? "",
        r.starting_balance ?? "",
        r.current_equity ?? "",
        r.profit_pct ?? "",
        r.max_drawdown_pct ?? "",
        r.trade_count ?? "",
        r.joined_at ?? "",
        r.last_sync_at ?? "",
        r.disqualified_at ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
    const csv = [header.map(csvEscape).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nanaforex-${competition.slug}-${isoDate(new Date())}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);
  }

  return (
    <section className="rounded-2xl border border-white/6 bg-white/[0.03] overflow-hidden">
      <header className="p-4 md:p-5 flex flex-wrap items-center gap-3 border-b border-white/6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, MT login, broker…"
          className="flex-1 min-w-[240px] rounded-xl bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/12 text-white/90 hover:border-secondary/40 hover:bg-secondary/8 transition-all text-sm font-semibold"
        >
          <i className="fas fa-download" /> Export CSV
        </button>
        <span className="text-xs text-white/45 ml-auto">
          {filtered.length} of {rows.length}
        </span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider font-bold text-white/50 bg-white/[0.02]">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Trader</th>
              <th className="px-4 py-3">MT Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Starting</th>
              <th className="px-4 py-3 text-right">Equity</th>
              <th className="px-4 py-3 text-right">Profit %</th>
              <th className="px-4 py-3 text-right">Drawdown</th>
              <th className="px-4 py-3 text-right">Trades</th>
              <th className="px-4 py-3 text-right">Last sync</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-white/50">
                  <i className="fas fa-user-slash text-2xl block mb-2 text-white/25" />
                  No participants match those filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const p = Number(r.profit_pct || 0);
                const pCls = p > 0 ? "text-profit-green" : p < 0 ? "text-danger" : "text-white/70";
                const disqualified = r.status === "disqualified";
                return (
                  <tr
                    key={r.participant_id}
                    className="border-t border-white/6 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-black">
                      {r.rank ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {r.display_name || "Trader"}
                      </div>
                      {r.mt_platform && (
                        <div className="text-[11px] text-white/45">
                          {r.mt_platform.toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/85">{r.mt_login || "—"}</div>
                      {r.mt_server && (
                        <div className="text-[11px] text-white/45">
                          {r.broker_name ? r.broker_name + " · " : ""}
                          {r.mt_server}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusPillCls(r.status)}`}
                      >
                        {r.status || "—"}
                      </span>
                      {disqualified && r.status_reason && (
                        <div className="text-[11px] text-white/50 mt-1 max-w-[220px] truncate" title={r.status_reason}>
                          {r.status_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{fmtMoney(r.starting_balance)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtMoney(r.current_equity)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${pCls}`}>
                      {p > 0 ? "+" : ""}{p.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {Number(r.max_drawdown_pct || 0).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">{r.trade_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-white/55 text-xs">
                      {fmtSince(r.last_sync_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {disqualified ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-danger/80">
                          <i className="fas fa-ban" /> DQ&apos;d
                        </span>
                      ) : (
                        <button
                          onClick={() => disqualify(r)}
                          disabled={dqBusyId === r.participant_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-danger/35 text-danger hover:bg-danger/10 text-xs font-bold uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {dqBusyId === r.participant_id ? (
                            <><i className="fas fa-spinner fa-spin" /> Working…</>
                          ) : (
                            <><i className="fas fa-gavel" /> DQ</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
