// ============================================================
// Competitions LIST page
// Loads all competitions from Supabase (public read) and renders
// cards. If the user is signed in, we also show whether they've
// already joined.
// ============================================================

(async function () {
  "use strict";
  const list = document.getElementById("competitionsList");
  if (!list || typeof supabaseClient === "undefined") return;

  // Session guard is done by client-dashboard.js already; we just
  // need the user id if present.
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const userId = session?.user?.id || null;

  // Fetch competitions (public read via RLS)
  const { data: comps, error } = await supabaseClient
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool, rules")
    .order("start_date", { ascending: true });

  if (error) {
    list.innerHTML =
      '<div class="comp-error"><i class="fas fa-triangle-exclamation"></i> Could not load competitions: ' +
      escapeHtml(error.message) +
      "</div>";
    return;
  }

  if (!comps || comps.length === 0) {
    list.innerHTML =
      '<div class="comp-empty"><i class="fas fa-trophy"></i><h3>No competitions yet</h3><p>Check back soon — the first challenge is on the way.</p></div>';
    return;
  }

  // Load my participations in one query
  let myParticipations = {};
  if (userId) {
    const { data: mine } = await supabaseClient
      .from("participants")
      .select("competition_id, status")
      .eq("user_id", userId);
    (mine || []).forEach((p) => (myParticipations[p.competition_id] = p.status));
  }

  list.innerHTML = comps
    .map((c) => renderCard(c, myParticipations[c.id]))
    .join("");

  function renderCard(c, myStatus) {
    const now = new Date();
    const start = new Date(c.start_date);
    const end = new Date(c.end_date);
    const state =
      c.status === "cancelled"
        ? "cancelled"
        : c.status === "ended" || end < now
        ? "ended"
        : c.status === "upcoming" || start > now
        ? "upcoming"
        : "active";

    const prize = c.prize_pool
      ? "$" + Number(c.prize_pool).toLocaleString()
      : "—";
    const rules = c.rules || {};
    const startBal = rules.starting_balance
      ? "$" + Number(rules.starting_balance).toLocaleString()
      : "—";
    const dd = rules.max_drawdown_pct ? rules.max_drawdown_pct + "%" : "—";
    const platforms = (rules.allowed_platforms || ["mt5"])
      .map((s) => s.toUpperCase())
      .join(" / ");

    const cta =
      state === "ended"
        ? '<a class="btn-secondary" href="/users/competition?slug=' +
          encodeURIComponent(c.slug) +
          '">View results</a>'
        : myStatus
        ? '<a class="btn-primary" href="/users/competition?slug=' +
          encodeURIComponent(c.slug) +
          '">' +
          myStatusLabel(myStatus) +
          "</a>"
        : '<a class="btn-primary" href="/users/competition?slug=' +
          encodeURIComponent(c.slug) +
          '"><i class="fas fa-trophy"></i> Join Competition</a>';

    return (
      '<article class="comp-card comp-card--' +
      state +
      '">' +
      '<div class="comp-card-head">' +
      '<span class="comp-status-badge ' +
      state +
      '"><i class="fas ' +
      stateIcon(state) +
      '"></i> ' +
      stateLabel(state) +
      "</span>" +
      '<span class="comp-card-prize">' +
      prize +
      " prize</span>" +
      "</div>" +
      "<h3>" +
      escapeHtml(c.name) +
      "</h3>" +
      "<p>" +
      escapeHtml(c.description || "") +
      "</p>" +
      '<dl class="comp-card-meta">' +
      "<div><dt>Starting</dt><dd>" +
      startBal +
      "</dd></div>" +
      "<div><dt>Max drawdown</dt><dd>" +
      dd +
      "</dd></div>" +
      "<div><dt>Platform</dt><dd>" +
      platforms +
      "</dd></div>" +
      "<div><dt>Dates</dt><dd>" +
      fmtDate(start) +
      " – " +
      fmtDate(end) +
      "</dd></div>" +
      "</dl>" +
      '<div class="comp-card-cta">' +
      cta +
      "</div>" +
      "</article>"
    );
  }

  function myStatusLabel(s) {
    if (s === "pending" || s === "connecting")
      return '<i class="fas fa-link"></i> Connect account';
    if (s === "connected")
      return '<i class="fas fa-eye"></i> View your entry';
    if (s === "disqualified")
      return '<i class="fas fa-eye"></i> View (disqualified)';
    if (s === "withdrawn")
      return '<i class="fas fa-eye"></i> View (withdrawn)';
    return '<i class="fas fa-eye"></i> View';
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
      ? "Live now"
      : s === "upcoming"
      ? "Upcoming"
      : s === "ended"
      ? "Ended"
      : "Cancelled";
  }
  function fmtDate(d) {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, function (c) {
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
