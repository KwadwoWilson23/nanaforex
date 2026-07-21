// ============================================================
// Public leaderboard controller
// URL:  /competitions/leaderboard?slug=<competition-slug>
// Public — no login required. Auto-refreshes every 30s.
// ============================================================

(function () {
  "use strict";

  const root = document.getElementById("lbRoot");
  if (!root || typeof supabaseClient === "undefined") return;

  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    root.innerHTML = "";
    root.appendChild(tpl("tpl-lb-notfound"));
    return;
  }

  let comp = null;
  let refreshTimer = null;
  let inFlight = false;

  // First paint
  loadAll(true);
  // Refresh on tab-back-into-focus
  window.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") loadAll(false);
  });
  // Auto-poll every 30s
  refreshTimer = setInterval(function () {
    if (document.visibilityState === "visible") loadAll(false);
  }, 30_000);

  // ------------------------------------------------------------
  // Load competition + leaderboard rows
  // ------------------------------------------------------------
  async function loadAll(initial) {
    if (inFlight) return;
    inFlight = true;
    try {
      if (initial || !comp) {
        const { data: c, error: cerr } = await supabaseClient
          .from("competitions")
          .select("id, slug, name, description, status, start_date, end_date, prize_pool, rules")
          .eq("slug", slug)
          .maybeSingle();
        if (cerr || !c) {
          root.innerHTML = "";
          root.appendChild(tpl("tpl-lb-notfound"));
          return;
        }
        comp = c;
        renderHeader(comp);
      }

      const { data: rows, error } = await supabaseClient
        .from("leaderboard_current")
        .select(
          "participant_id, user_id, display_name, avatar_url, mt_platform, status, starting_balance, current_equity, profit_pct, max_drawdown_pct, trade_count, last_sync_at, rank"
        )
        .eq("competition_id", comp.id)
        .order("rank", { ascending: true });

      if (error) {
        console.warn("[leaderboard] load failed:", error.message);
        return;
      }
      renderTable(rows || []);
      updateCount(rows ? rows.length : 0);
      pulseLive();
    } finally {
      inFlight = false;
    }
  }

  // ------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------
  function renderHeader(c) {
    // Only render the header the first time we have comp data.
    if (!root.querySelector("[data-name]")) {
      root.innerHTML = "";
      root.appendChild(tpl("tpl-lb-header"));
    }
    root.querySelector("[data-name]").textContent = c.name;
    root.querySelector("[data-tagline]").textContent = c.description || "";

    const st = computeState(c);
    const badge = root.querySelector("[data-status]");
    badge.className = "lb-status-badge " + st;
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

    root.querySelector("[data-prize]").textContent = c.prize_pool
      ? "$" + Number(c.prize_pool).toLocaleString()
      : "—";
    root.querySelector("[data-start]").textContent = fmtDate(c.start_date);
    root.querySelector("[data-end]").textContent = fmtDate(c.end_date);

    root.querySelector("[data-refresh]").addEventListener("click", function (e) {
      e.preventDefault();
      loadAll(false);
    });
  }

  function renderTable(rows) {
    // Ensure the table container exists just after the header
    let tableEl = root.querySelector(".lb-table-wrap");
    if (!tableEl) {
      tableEl = tpl("tpl-lb-table");
      root.appendChild(tableEl);
    }

    // Also insert the CTA once
    if (!root.querySelector(".lb-cta")) {
      const cta = tpl("tpl-lb-cta");
      cta.querySelector("[data-join]").href =
        "/users/competition?slug=" + encodeURIComponent(comp.slug);
      root.appendChild(cta);
    }

    const tbody = root.querySelector("[data-rows]");
    if (!rows || rows.length === 0) {
      // Replace with empty state, but keep header + CTA
      tableEl.remove();
      if (!root.querySelector(".lb-empty")) {
        const empty = tpl("tpl-lb-empty");
        const cta = empty.querySelector("[data-cta-comp]");
        if (cta) cta.href = "/users/competition?slug=" + encodeURIComponent(comp.slug);
        // Insert before the CTA
        const ctaEl = root.querySelector(".lb-cta");
        if (ctaEl) root.insertBefore(empty, ctaEl);
        else root.appendChild(empty);
      }
      return;
    }
    // Remove any stale empty state
    const empty = root.querySelector(".lb-empty");
    if (empty) empty.remove();

    // Diff-friendly: rebuild all rows (small N)
    tbody.innerHTML = rows.map(rowHtml).join("");
  }

  function updateCount(n) {
    const el = root.querySelector("[data-count]");
    if (el) el.textContent = String(n);
  }

  function pulseLive() {
    const dot = root.querySelector(".lb-live-dot");
    if (!dot) return;
    dot.classList.remove("pulse");
    // reflow so animation restarts
    void dot.offsetWidth;
    dot.classList.add("pulse");
    const label = root.querySelector("[data-live-text]");
    if (label) label.textContent = "Updated just now · auto-refreshes every 30s";
  }

  function rowHtml(r) {
    const rank = r.rank || "—";
    const rankIcon =
      rank === 1
        ? '<span class="lb-medal gold">🥇</span>'
        : rank === 2
        ? '<span class="lb-medal silver">🥈</span>'
        : rank === 3
        ? '<span class="lb-medal bronze">🥉</span>'
        : "";
    const gain = Number(r.profit_pct || 0);
    const gainClass = gain > 0 ? "gain-up" : gain < 0 ? "gain-down" : "";
    const dd = Number(r.max_drawdown_pct || 0);
    const initials = initialsFrom(r.display_name);
    const platform = (r.mt_platform || "").toUpperCase();
    const statusBadge =
      r.status === "disqualified"
        ? '<span class="lb-row-badge disqualified" title="Disqualified"><i class="fas fa-ban"></i> DQ</span>'
        : r.status === "connected"
        ? '<span class="lb-row-badge live"><i class="fas fa-circle"></i> Live</span>'
        : r.status === "completed"
        ? '<span class="lb-row-badge completed"><i class="fas fa-flag-checkered"></i> Done</span>'
        : '<span class="lb-row-badge pending">' + escapeHtml(r.status || "—") + "</span>";

    return (
      '<tr class="lb-row lb-row--rank-' +
      (rank >= 1 && rank <= 3 ? rank : "n") +
      '">' +
      '<td class="lb-col-rank">' +
      rankIcon +
      "<span>" +
      (rank || "—") +
      "</span></td>" +
      '<td class="lb-col-trader"><div class="lb-trader">' +
      (r.avatar_url
        ? '<img class="lb-avatar" src="' + escapeHtml(r.avatar_url) + '" alt="" />'
        : '<span class="lb-avatar lb-avatar--initials">' + escapeHtml(initials) + "</span>") +
      '<div class="lb-trader-meta"><strong>' +
      escapeHtml(r.display_name || "Trader") +
      "</strong>" +
      (platform ? "<span>" + platform + "</span>" : "") +
      "</div></div></td>" +
      '<td class="lb-col-gain ' +
      gainClass +
      '">' +
      (gain > 0 ? "+" : "") +
      gain.toFixed(2) +
      "%</td>" +
      '<td class="lb-col-equity">' +
      fmtMoney(r.current_equity) +
      "</td>" +
      '<td class="lb-col-dd"><div class="lb-dd">' +
      '<span class="lb-dd-fill" style="width:' +
      Math.min(100, dd) +
      '%"></span>' +
      "<em>" +
      dd.toFixed(2) +
      "%</em></div></td>" +
      '<td class="lb-col-trades">' +
      (r.trade_count != null ? r.trade_count : "—") +
      "</td>" +
      '<td class="lb-col-sync">' +
      fmtSince(r.last_sync_at) +
      "</td>" +
      '<td class="lb-col-badge">' +
      statusBadge +
      "</td>" +
      "</tr>"
    );
  }

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
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
  function initialsFrom(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
