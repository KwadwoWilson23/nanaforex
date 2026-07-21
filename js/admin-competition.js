// ============================================================
// Admin — per-Competition detail controller
// Route: /users/admin-competition?slug=<slug>
// Admin only. Shows participant table + disqualify + CSV export.
// ============================================================

(async function () {
  "use strict";
  const root = document.getElementById("adminRoot");
  if (!root || typeof supabaseClient === "undefined") return;

  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    root.innerHTML = '<p class="admin-error">Missing ?slug parameter.</p>';
    return;
  }

  // Verify admin
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    root.innerHTML = "";
    root.appendChild(tpl("tpl-denied"));
    return;
  }

  // Reveal admin sidebar link
  document.querySelectorAll(".admin-only").forEach(function (el) {
    el.style.display = "";
  });

  // Load competition
  const { data: comp } = await supabaseClient
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool, rules")
    .eq("slug", slug)
    .maybeSingle();
  if (!comp) {
    root.innerHTML = '<p class="admin-error">Competition not found.</p>';
    return;
  }

  document.getElementById("adminHeaderTitle").innerHTML =
    '<i class="fas fa-shield-halved"></i> ' + escapeHtml(comp.name);

  // Load participants (via leaderboard_current view for rank + display_name)
  let rows = await loadParticipants();

  // Render layout
  root.innerHTML = "";
  root.appendChild(tpl("tpl-admin-detail"));
  renderHero(comp, rows);
  renderTable(rows);
  renderAuditLog(comp.id);
  wireControls(rows);
  wireCsv(comp, rows);

  async function loadParticipants() {
    const { data: view } = await supabaseClient
      .from("leaderboard_current")
      .select(
        "participant_id, user_id, display_name, mt_platform, status, starting_balance, current_equity, profit_pct, max_drawdown_pct, trade_count, last_sync_at, rank"
      )
      .eq("competition_id", comp.id)
      .order("rank", { ascending: true });

    // Also fetch mt_login, mt_server, broker_name, status_reason from participants for admin view
    const { data: extra } = await supabaseClient
      .from("participants")
      .select("id, mt_login, mt_server, broker_name, tracking_ref, status_reason, disqualified_at, joined_at")
      .eq("competition_id", comp.id);

    const extraById = {};
    (extra || []).forEach((e) => (extraById[e.id] = e));

    // Also include participants missing from the view (status=pending/withdrawn)
    const seen = new Set((view || []).map((v) => v.participant_id));
    const missing = (extra || []).filter((e) => !seen.has(e.id));

    const combined = (view || [])
      .map((v) => Object.assign({}, v, extraById[v.participant_id] || {}))
      .concat(
        missing.map((e) => ({
          participant_id: e.id,
          user_id: null,
          display_name: "Trader",
          status: null,
          rank: null,
          starting_balance: null,
          current_equity: null,
          profit_pct: 0,
          max_drawdown_pct: 0,
          trade_count: 0,
          last_sync_at: null,
          ...e,
        }))
      );
    return combined;
  }

  function renderHero(c, rows) {
    root.querySelector("[data-name]").textContent = c.name;
    root.querySelector("[data-description]").textContent = c.description || "";
    root.querySelector("[data-prize]").textContent = c.prize_pool
      ? "$" + Number(c.prize_pool).toLocaleString()
      : "—";
    root.querySelector("[data-total]").textContent = rows.length;
    root.querySelector("[data-connected]").textContent = rows.filter((r) => r.status === "connected").length;
    root.querySelector("[data-dq]").textContent = rows.filter((r) => r.status === "disqualified").length;
    root.querySelector("[data-start]").textContent = fmtDate(c.start_date);
    root.querySelector("[data-end]").textContent = fmtDate(c.end_date);

    const st = computeState(c);
    const badge = root.querySelector("[data-status]");
    badge.className = "admin-status-badge " + st;
    badge.innerHTML =
      '<i class="fas ' +
      (st === "active"
        ? "fa-circle"
        : st === "upcoming"
        ? "fa-clock"
        : st === "ended"
        ? "fa-flag-checkered"
        : "fa-ban") +
      '"></i> ' +
      (st === "active" ? "Live" : st === "upcoming" ? "Upcoming" : st === "ended" ? "Ended" : "Cancelled");

    root.querySelector("[data-lb]").href = "/competitions/leaderboard?slug=" + encodeURIComponent(c.slug);
  }

  function renderTable(rows) {
    const tbody = root.querySelector("[data-rows]");
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="11"><div class="admin-empty-small">No participants yet.</div></td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map(function (r) {
        const disqualified = r.status === "disqualified";
        const gain = Number(r.profit_pct || 0);
        const gainClass = gain > 0 ? "gain-up" : gain < 0 ? "gain-down" : "";
        const dqBtn = disqualified
          ? '<span class="admin-dqd" title="' +
            escapeHtml(r.status_reason || "Disqualified") +
            '"><i class="fas fa-ban"></i></span>'
          : '<button class="admin-dq-btn" data-dq-btn data-part-id="' + r.participant_id + '" data-name="' +
            escapeHtml(r.display_name || "Trader") + '">' +
            '<i class="fas fa-gavel"></i> DQ' +
            '</button>';

        return (
          '<tr data-row data-part-id="' + r.participant_id + '"' +
          ' data-search="' + escapeHtml((r.display_name || "") + " " + (r.mt_login || "")) + '"' +
          ' data-status="' + escapeHtml(r.status || "") + '">' +
          "<td>" + (r.rank || "—") + "</td>" +
          "<td><strong>" + escapeHtml(r.display_name || "Trader") + "</strong>" +
          (r.mt_platform ? '<div class="admin-sub">' + escapeHtml(r.mt_platform.toUpperCase()) + '</div>' : "") +
          "</td>" +
          "<td>" + escapeHtml(r.mt_login || "—") +
          (r.mt_server ? '<div class="admin-sub">' + escapeHtml(r.mt_server) + '</div>' : "") +
          "</td>" +
          "<td>" + statusPill(r.status) + "</td>" +
          "<td>" + fmtMoney(r.starting_balance) + "</td>" +
          "<td>" + fmtMoney(r.current_equity) + "</td>" +
          '<td class="' + gainClass + '">' + (gain > 0 ? "+" : "") + gain.toFixed(2) + "%</td>" +
          "<td>" + Number(r.max_drawdown_pct || 0).toFixed(2) + "%</td>" +
          "<td>" + (r.trade_count || 0) + "</td>" +
          "<td>" + fmtSince(r.last_sync_at) + "</td>" +
          '<td class="admin-actions-cell">' + dqBtn + "</td>" +
          "</tr>"
        );
      })
      .join("");

    // Wire disqualify buttons
    tbody.querySelectorAll("[data-dq-btn]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const partId = btn.dataset.partId;
        const name = btn.dataset.name;
        const reason = prompt(
          "Disqualify " + name + "?\n\nEnter a reason (visible in audit log):"
        );
        if (reason == null) return; // cancel
        if (!reason.trim()) return alert("Reason is required.");
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
          const { data: { session: s } } = await supabaseClient.auth.getSession();
          const r = await fetch("/api/admin/disqualify", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer " + s.access_token,
            },
            body: JSON.stringify({ participant_id: partId, reason: reason.trim() }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Disqualify failed");
          // Reload participants + audit
          rows = await loadParticipants();
          renderHero(comp, rows);
          renderTable(rows);
          renderAuditLog(comp.id);
        } catch (e) {
          alert("Could not disqualify: " + e.message);
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-gavel"></i> DQ';
        }
      });
    });
  }

  async function renderAuditLog(compId) {
    const box = root.querySelector("[data-audit]");
    const { data: audit } = await supabaseClient
      .from("audit_log")
      .select("id, action, entity_id, metadata, created_at, actor_id")
      .eq("entity_type", "participant")
      .order("created_at", { ascending: false })
      .limit(20);
    // Filter to entries touching this competition
    const filtered = (audit || []).filter(
      (a) => a.metadata && a.metadata.competition_id === compId
    );
    if (!filtered.length) {
      box.innerHTML = '<p class="admin-empty-small">No admin actions yet.</p>';
      return;
    }
    box.innerHTML = filtered
      .map(function (a) {
        const when = new Date(a.created_at).toLocaleString();
        const reason = a.metadata && a.metadata.reason ? " — " + escapeHtml(a.metadata.reason) : "";
        return (
          '<div class="admin-audit-item">' +
          '<span class="admin-audit-action">' + escapeHtml(a.action) + "</span>" +
          '<span class="admin-audit-when">' + when + "</span>" +
          '<div class="admin-audit-detail">Participant <code>' +
          escapeHtml(a.entity_id) +
          "</code>" + reason + "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function wireControls(_rows) {
    const filterInput = root.querySelector("[data-filter]");
    const statusFilter = root.querySelector("[data-status-filter]");

    function applyFilters() {
      const q = (filterInput.value || "").toLowerCase().trim();
      const st = statusFilter.value;
      root.querySelectorAll("[data-row]").forEach(function (row) {
        const matchQ = !q || (row.dataset.search || "").toLowerCase().includes(q);
        const matchSt = !st || row.dataset.status === st;
        row.style.display = matchQ && matchSt ? "" : "none";
      });
    }
    filterInput.addEventListener("input", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
  }

  function wireCsv(c, rows) {
    root.querySelector("[data-csv]").addEventListener("click", function () {
      exportCsv(c, rows);
    });
  }

  function exportCsv(c, rows) {
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
    const lines = rows.map(function (r) {
      return [
        r.rank || "",
        r.display_name || "",
        r.user_id || "",
        r.mt_login || "",
        r.mt_server || "",
        r.broker_name || "",
        r.mt_platform || "",
        r.status || "",
        r.status_reason || "",
        r.starting_balance != null ? r.starting_balance : "",
        r.current_equity != null ? r.current_equity : "",
        r.profit_pct != null ? r.profit_pct : "",
        r.max_drawdown_pct != null ? r.max_drawdown_pct : "",
        r.trade_count != null ? r.trade_count : "",
        r.joined_at || "",
        r.last_sync_at || "",
        r.disqualified_at || "",
      ]
        .map(csvEscape)
        .join(",");
    });
    const csv = [header.map(csvEscape).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nanaforex-" + c.slug + "-" + isoDate(new Date()) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);
  }

  // -------- helpers --------
  function tpl(id) {
    const t = document.getElementById(id);
    return t.content.firstElementChild.cloneNode(true);
  }
  function computeState(c) {
    const now = new Date();
    if (c.status === "cancelled") return "cancelled";
    if (c.status === "ended" || new Date(c.end_date) < now) return "ended";
    if (c.status === "upcoming" || new Date(c.start_date) > now) return "upcoming";
    return "active";
  }
  function statusPill(status) {
    const cls =
      status === "connected"
        ? "live"
        : status === "disqualified"
        ? "disqualified"
        : status === "completed"
        ? "completed"
        : "pending";
    const label = (status || "—").replace(/^./, (c) => c.toUpperCase());
    return '<span class="admin-status-pill ' + cls + '">' + escapeHtml(label) + "</span>";
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  function fmtMoney(n) {
    if (n == null) return "—";
    return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function fmtSince(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    const s = Math.max(1, Math.round((Date.now() - d) / 1000));
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    if (s < 86400) return Math.round(s / 3600) + "h ago";
    return Math.round(s / 86400) + "d ago";
  }
  function isoDate(d) {
    return d.toISOString().slice(0, 10);
  }
  function csvEscape(v) {
    const s = v == null ? "" : String(v);
    if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
})();
