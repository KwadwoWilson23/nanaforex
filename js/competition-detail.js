// ============================================================
// Competition DETAIL page
// Loads a competition by ?slug=..., shows the right UI depending on
// the user's participation status: not-joined / connect / live /
// withdrawn / disqualified.
// ============================================================

(async function () {
  "use strict";
  const root = document.getElementById("compDetailRoot");
  if (!root || typeof supabaseClient === "undefined") return;

  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    root.innerHTML = tpl("tpl-comp-not-found").outerHTML;
    return;
  }

  // Session guard is done by client-dashboard.js; grab the user.
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  const user = session ? session.user : null;

  // Fetch competition
  const { data: comp, error } = await supabaseClient
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool, rules")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !comp) {
    root.innerHTML = tpl("tpl-comp-not-found").outerHTML;
    return;
  }

  // Reveal the "View Public Leaderboard" link
  const lbLink = document.getElementById("compLbLink");
  if (lbLink) {
    lbLink.href = "/competitions/leaderboard?slug=" + encodeURIComponent(comp.slug);
    lbLink.style.display = "inline-flex";
  }

  // Fetch my participation, if any
  let mine = null;
  if (user) {
    const { data: p } = await supabaseClient
      .from("participants")
      .select("id, status, status_reason, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity, last_sync_at")
      .eq("competition_id", comp.id)
      .eq("user_id", user.id)
      .maybeSingle();
    mine = p || null;
  }

  render(comp, mine);

  // ------------------ render ------------------
  function render(c, p) {
    root.innerHTML = "";
    document.getElementById("compHeaderTitle").textContent = c.name;

    // Hero + rules
    const hero = tpl("tpl-comp-hero");
    fillHero(hero, c);
    root.appendChild(hero);

    // Contextual section
    const state = compState(c);
    if (state === "ended" || state === "cancelled") {
      const s = tpl("tpl-comp-status");
      s.querySelector("[data-badge]").className =
        "comp-status-badge " + state;
      s.querySelector("[data-badge]").innerHTML =
        '<i class="fas ' +
        (state === "ended" ? "fa-flag-checkered" : "fa-ban") +
        '"></i> ' +
        (state === "ended" ? "Ended" : "Cancelled");
      s.querySelector("[data-title]").textContent =
        state === "ended" ? "This competition has ended." : "This competition was cancelled.";
      s.querySelector("[data-reason]").textContent =
        "Head to the leaderboard to see final results.";
      root.appendChild(s);
      return;
    }

    if (!user) {
      const j = tpl("tpl-comp-join");
      j.querySelector("[data-join]").textContent = "Log in to join";
      j.querySelector("[data-join]").addEventListener("click", () => {
        location.href = "/users/login";
      });
      root.appendChild(j);
      return;
    }

    if (!p) {
      const j = tpl("tpl-comp-join");
      j.querySelector("[data-join]").addEventListener("click", () =>
        joinCompetition(c)
      );
      root.appendChild(j);
      return;
    }

    if (p.status === "pending" || p.status === "connecting") {
      const con = tpl("tpl-comp-connect");
      wireConnectForm(con, p);
      wireWithdraw(con, p);
      wirePwToggle(con);
      root.appendChild(con);
      return;
    }

    if (p.status === "connected") {
      const live = tpl("tpl-comp-live");
      live.querySelector("[data-starting]").textContent = fmtMoney(p.starting_balance);
      live.querySelector("[data-equity]").textContent = fmtMoney(p.current_equity);
      live.querySelector("[data-broker]").textContent =
        (p.broker_name || "—") + " · " + (p.mt_server || "—");
      live.querySelector("[data-lastsync]").textContent = fmtSince(p.last_sync_at);
      wireWithdraw(live, p);
      root.appendChild(live);
      return;
    }

    // withdrawn / disqualified / completed
    const s = tpl("tpl-comp-status");
    s.querySelector("[data-badge]").className =
      "comp-status-badge " + p.status;
    s.querySelector("[data-badge]").innerHTML =
      '<i class="fas fa-circle-info"></i> ' +
      p.status.charAt(0).toUpperCase() +
      p.status.slice(1);
    s.querySelector("[data-title]").textContent =
      p.status === "disqualified"
        ? "You were disqualified from this competition."
        : p.status === "withdrawn"
        ? "You withdrew from this competition."
        : "You completed this competition.";
    s.querySelector("[data-reason]").textContent =
      p.status_reason || "";
    root.appendChild(s);
  }

  // ------------------ actions ------------------

  async function joinCompetition(c) {
    const btn = root.querySelector("[data-join]");
    const status = root.querySelector(".comp-cta [data-status]");
    setStatus(status, "Joining…", "info");
    btn.disabled = true;
    try {
      const res = await apiPost("/api/competitions/join", { slug: c.slug });
      if (!res.ok) throw new Error(res.error || "Failed to join");
      // Reload with the new participation state
      const { data: p } = await supabaseClient
        .from("participants")
        .select("id, status, status_reason, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity, last_sync_at")
        .eq("id", res.data.participant.id)
        .maybeSingle();
      render(c, p);
    } catch (e) {
      setStatus(status, e.message, "error");
      btn.disabled = false;
    }
  }

  function wireConnectForm(container, p) {
    const form = container.querySelector("[data-connect-form]");
    const submit = container.querySelector("[data-connect-submit]");
    const status = container.querySelector("[data-status]");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      submit.disabled = true;
      setStatus(status, "Provisioning MetaAPI account — this can take 10–30 seconds…", "info");

      const fd = new FormData(form);
      try {
        const res = await apiPost("/api/competitions/connect", {
          participant_id: p.id,
          login: fd.get("login"),
          server: fd.get("server"),
          platform: fd.get("platform"),
          password: fd.get("password"),
          broker: fd.get("broker") || null,
        });
        if (!res.ok) throw new Error(res.error || "Failed to connect");
        setStatus(status, "Connected! Loading your live view…", "success");
        // Reload the participant with fresh data.
        setTimeout(async () => {
          const { data: fresh } = await supabaseClient
            .from("participants")
            .select("id, status, status_reason, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity, last_sync_at")
            .eq("id", p.id)
            .maybeSingle();
          render(comp, fresh);
        }, 800);
      } catch (e) {
        setStatus(status, e.message, "error");
        submit.disabled = false;
      }
    });
  }

  function wireWithdraw(container, p) {
    const link = container.querySelector("[data-withdraw]");
    if (!link) return;
    link.addEventListener("click", async function () {
      if (!confirm("Withdraw from this competition? Your MetaAPI link will be removed."))
        return;
      link.disabled = true;
      const res = await apiPost("/api/competitions/withdraw", { participant_id: p.id });
      if (!res.ok) {
        alert("Could not withdraw: " + (res.error || "unknown error"));
        link.disabled = false;
        return;
      }
      // Refresh state
      const { data: fresh } = await supabaseClient
        .from("participants")
        .select("id, status, status_reason, mt_platform, mt_login, mt_server, broker_name, starting_balance, current_equity, last_sync_at")
        .eq("id", p.id)
        .maybeSingle();
      render(comp, fresh);
    });
  }

  function wirePwToggle(container) {
    const btn = container.querySelector(".cf-pw-toggle");
    if (!btn) return;
    const input = container.querySelector('input[name="password"]');
    btn.addEventListener("click", function () {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.innerHTML = show
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
    });
  }

  // ------------------ helpers ------------------

  async function apiPost(path, body) {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (!session) return { ok: false, error: "Please log in again." };
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + session.access_token,
        },
        body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, error: data.error || r.statusText, status: r.status };
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  function tpl(id) {
    const t = document.getElementById(id);
    return t.content.firstElementChild.cloneNode(true);
  }

  function fillHero(hero, c) {
    hero.querySelector("[data-name]").textContent = c.name;
    hero.querySelector("[data-description]").textContent = c.description || "";
    const s = compState(c);
    const statusEl = hero.querySelector("[data-status]");
    statusEl.className = "comp-status-badge " + s;
    statusEl.innerHTML =
      '<i class="fas ' +
      (s === "active"
        ? "fa-circle"
        : s === "upcoming"
        ? "fa-clock"
        : s === "ended"
        ? "fa-flag-checkered"
        : "fa-ban") +
      '"></i> ' +
      (s === "active" ? "Live now" : s === "upcoming" ? "Upcoming" : s === "ended" ? "Ended" : "Cancelled");

    hero.querySelector("[data-prize]").textContent = c.prize_pool
      ? "$" + Number(c.prize_pool).toLocaleString()
      : "—";
    hero.querySelector("[data-start]").textContent = new Date(c.start_date).toLocaleDateString(
      undefined,
      { month: "short", day: "numeric", year: "numeric" }
    );
    hero.querySelector("[data-end]").textContent = new Date(c.end_date).toLocaleDateString(
      undefined,
      { month: "short", day: "numeric", year: "numeric" }
    );
    const rules = c.rules || {};
    hero.querySelector("[data-platform]").textContent = (rules.allowed_platforms || ["mt5"])
      .map((s) => s.toUpperCase())
      .join(" / ");

    // rules list on the second element (rules section)
    const rulesEl =
      hero.parentElement?.querySelector("[data-rules]") ||
      hero.querySelectorAll("[data-rules]")[0] ||
      hero.nextElementSibling?.querySelector("[data-rules]");
    // The template combines .comp-hero + .comp-rules in a DocumentFragment;
    // we grab both sections after they're appended, so read from root.
    setTimeout(function () {
      const list = document.querySelector("[data-rules]");
      if (!list) return;
      list.innerHTML = [
        rules.starting_balance != null
          ? "Start with a $" + Number(rules.starting_balance).toLocaleString() + " account"
          : null,
        rules.max_drawdown_pct != null
          ? "Max drawdown: " + rules.max_drawdown_pct + "% (auto-disqualify above this)"
          : null,
        rules.min_trades != null
          ? "Minimum " + rules.min_trades + " trades to qualify at the end"
          : null,
        rules.allowed_platforms
          ? "Accepted platforms: " + rules.allowed_platforms.map((s) => s.toUpperCase()).join(", ")
          : null,
        rules.account_type
          ? "Account types allowed: " + rules.account_type.map((s) => s.toUpperCase()).join(" or ")
          : null,
      ]
        .filter(Boolean)
        .map((r) => '<li><i class="fas fa-check"></i>' + escapeHtml(r) + "</li>")
        .join("");
    }, 0);
  }

  function compState(c) {
    const now = new Date();
    if (c.status === "cancelled") return "cancelled";
    if (c.status === "ended" || new Date(c.end_date) < now) return "ended";
    if (c.status === "upcoming" || new Date(c.start_date) > now) return "upcoming";
    return "active";
  }
  function fmtMoney(n) {
    if (n == null) return "—";
    return "$" + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  function fmtSince(iso) {
    if (!iso) return "not yet";
    const d = new Date(iso);
    const s = Math.max(1, Math.round((Date.now() - d) / 1000));
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    return Math.round(s / 3600) + "h ago";
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
  function setStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg || "";
    el.className = "comp-cta-status" + (kind ? " " + kind : "");
  }
})();
