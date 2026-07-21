// ============================================================
// Admin — Competitions list controller
// Route: /users/admin-competitions
// Only visible to profiles.role='admin'. Non-admins see denied.
// ============================================================

(async function () {
  "use strict";
  const root = document.getElementById("adminRoot");
  if (!root || typeof supabaseClient === "undefined") return;

  // 1. Verify admin role
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (!session) return; // client-dashboard.js already handles the auth redirect

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

  // Reveal the admin link in sidebar for admins on any page they land on
  document.querySelectorAll(".admin-only").forEach(function (el) {
    el.style.display = "";
  });

  // 2. Load all competitions + participant counts
  const [{ data: comps }, { data: participants }] = await Promise.all([
    supabaseClient
      .from("competitions")
      .select("id, slug, name, description, status, start_date, end_date, prize_pool, rules")
      .order("start_date", { ascending: false }),
    supabaseClient.from("participants").select("competition_id, status"),
  ]);

  const countsByComp = {};
  (participants || []).forEach(function (p) {
    const c = (countsByComp[p.competition_id] = countsByComp[p.competition_id] || {
      total: 0,
      connected: 0,
      pending: 0,
      disqualified: 0,
      withdrawn: 0,
      completed: 0,
    });
    c.total++;
    if (c[p.status] != null) c[p.status]++;
  });

  root.innerHTML = "";
  root.appendChild(tpl("tpl-admin-list"));
  const list = root.querySelector("[data-list]");

  if (!comps || comps.length === 0) {
    list.innerHTML =
      '<div class="admin-empty"><i class="fas fa-trophy"></i><h3>No competitions yet</h3><p>Seed one with <code>supabase/seed-july-challenge.sql</code> or your own SQL.</p></div>';
    return;
  }

  list.innerHTML = comps.map(function (c) {
    return renderRow(c, countsByComp[c.id] || {});
  }).join("");

  function renderRow(c, counts) {
    const now = new Date();
    const state =
      c.status === "cancelled"
        ? "cancelled"
        : c.status === "ended" || new Date(c.end_date) < now
        ? "ended"
        : c.status === "upcoming" || new Date(c.start_date) > now
        ? "upcoming"
        : "active";

    return (
      '<div class="admin-comp-card">' +
      '<div class="admin-comp-card-head">' +
      '<span class="admin-status-badge ' + state + '">' +
      '<i class="fas ' + stateIcon(state) + '"></i> ' + stateLabel(state) +
      "</span>" +
      '<span class="admin-comp-prize">' +
      (c.prize_pool ? "$" + Number(c.prize_pool).toLocaleString() : "—") +
      "</span>" +
      "</div>" +
      "<h3>" + escapeHtml(c.name) + "</h3>" +
      "<p>" + escapeHtml(c.description || "") + "</p>" +
      '<div class="admin-comp-metrics">' +
      '<div><span>Total</span><strong>' + (counts.total || 0) + '</strong></div>' +
      '<div><span>Connected</span><strong>' + (counts.connected || 0) + '</strong></div>' +
      '<div><span>Pending</span><strong>' + ((counts.pending || 0) + (counts.connecting || 0)) + '</strong></div>' +
      '<div><span>Disqualified</span><strong class="dq">' + (counts.disqualified || 0) + '</strong></div>' +
      "</div>" +
      '<div class="admin-comp-dates">' +
      "<span>" + fmtDate(c.start_date) + " → " + fmtDate(c.end_date) + "</span>" +
      "</div>" +
      '<div class="admin-comp-cta">' +
      '<a class="btn-primary" href="/users/admin-competition?slug=' + encodeURIComponent(c.slug) + '">' +
      '<i class="fas fa-gear"></i> Manage' +
      "</a>" +
      '<a class="btn-secondary" href="/competitions/leaderboard?slug=' + encodeURIComponent(c.slug) + '" target="_blank" rel="noopener">' +
      '<i class="fas fa-chart-line"></i> Public Leaderboard' +
      "</a>" +
      "</div>" +
      "</div>"
    );
  }

  function stateIcon(s) {
    return s === "active"
      ? "fa-circle"
      : s === "upcoming"
      ? "fa-clock"
      : s === "ended"
      ? "fa-flag-checkered"
      : "fa-ban";
  }
  function stateLabel(s) {
    return s === "active"
      ? "Live"
      : s === "upcoming"
      ? "Upcoming"
      : s === "ended"
      ? "Ended"
      : "Cancelled";
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  function tpl(id) {
    const t = document.getElementById(id);
    return t.content.firstElementChild.cloneNode(true);
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
