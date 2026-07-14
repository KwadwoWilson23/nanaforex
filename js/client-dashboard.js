// ====================================
// CLIENT DASHBOARD
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // SIDEBAR TOGGLE
  // ====================================
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", openSidebar);
  }
  if (sidebarClose) {
    sidebarClose.addEventListener("click", closeSidebar);
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  // Close sidebar on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  // ====================================
  // AUTO-SET ACTIVE NAV BASED ON CURRENT PAGE
  // (fixes wrong "Academy" highlight on Dashboard, etc.)
  // ====================================
  (function markActiveNav() {
    var pathLeaf = (location.pathname.split("/").pop() || "")
      .replace(/\.html$/, "")
      .toLowerCase();
    if (!pathLeaf) return;
    document.querySelectorAll(".sidebar-nav a").forEach(function (a) {
      var page = (a.dataset.page || "").toLowerCase();
      var href = (a.getAttribute("href") || "").replace(/\.html$/, "").toLowerCase();
      var isActive = page === pathLeaf || href.endsWith("/" + pathLeaf) || href === pathLeaf;
      a.classList.toggle("active", isActive);
    });
  })();

  // ====================================
  // NAVIGATION LINKS - FIXED
  // ====================================
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      // Get the href attribute
      const href = this.getAttribute("href");

      // If it's a valid link and not empty
      if (href && href !== "#" && href !== "") {
        // Let the browser navigate normally
        // Don't prevent default for actual page navigation
        // e.preventDefault(); // ← REMOVED THIS LINE

        // The browser will now navigate to the href
        // We can optionally update the header before navigation
        const pageName = this.dataset.page;
        const pageTitles = {
          dashboard: "Dashboard",
          profile: "Profile",
          academy: "Academy",
          signals: "Signals",
          "copy-trading": "Copy Trading",
          "funded-account": "Funded Account",
          mentorship: "Mentorship",
          "ib-partnership": "IB Partnership",
          "trading-tools": "Trading Tools",
          "market-analysis": "Market Analysis",
          referrals: "Referrals",
          payments: "Payments",
          settings: "Settings",
        };

        // Update header title (will be visible briefly before navigation)
        const headerTitle = document.querySelector(".dashboard-header h1");
        if (headerTitle && pageTitles[pageName]) {
          headerTitle.textContent = pageTitles[pageName];
        }

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          closeSidebar();
        }

        // Allow navigation to proceed
        return true;
      }
    });
  });

  // ====================================
  // USER SESSION CHECK
  // ====================================
  async function checkUserSession() {
    // Validate the real Supabase session; redirects to login if absent.
    const session = typeof NanaSession !== "undefined" ? await NanaSession.guard("login.html") : null;
    if (!session) return;

    const userData = NanaSession.getMirror() || {};
    const name = userData.name || "Trader";

    const userName = document.getElementById("userName");
    const userInitials = document.getElementById("userInitials");

    if (userName) userName.textContent = name;
    if (userInitials) {
      userInitials.textContent = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
  }

  checkUserSession();

  // ====================================
  // REAL NOTIFICATION COUNT (Supabase)
  // Replaces the hardcoded "3" badge with the real unread count.
  // ====================================
  (async function loadNotifCount() {
    try {
      const session = typeof NanaSession !== "undefined"
        ? await NanaSession.getSession()
        : null;
      if (!session || typeof supabaseClient === "undefined") return;

      const { count, error } = await supabaseClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("read", false);

      if (error) return;

      const total = count || 0;
      const badge = document.getElementById("notifBadge");
      if (badge) {
        badge.textContent = String(total);
        badge.hidden = total === 0;
      }
      const counter = document.querySelector('[data-stat="notif-count"]');
      const note = document.querySelector('[data-stat="notif-note"]');
      if (counter) counter.textContent = String(total);
      if (note) note.textContent = total === 0 ? "all caught up" : total + " unread";
    } catch (e) {
      /* silent — empty state stays as-is */
    }
  })();

  // ====================================
  // LOGOUT
  // ====================================
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      if (typeof NanaSession !== "undefined") {
        NanaSession.logout("login.html");
      } else {
        localStorage.removeItem("nanaForexUser");
        sessionStorage.removeItem("nanaForexUser");
        window.location.href = "login.html";
      }
    }
  });

  // ====================================
  // CURRENT DATE
  // ====================================
  const dateElement = document.getElementById("currentDate");
  if (dateElement) {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    dateElement.textContent = now.toLocaleDateString("en-US", options);
  }

  // ====================================
  // CHARTS
  // Skip rendering when the canvas is hidden (empty state showing).
  // Real chart rendering kicks in once real trading data flows.
  // ====================================
  const equityCanvas = document.getElementById("equityCurveChart");
  const equityCtx = equityCanvas && !equityCanvas.hidden
    ? equityCanvas.getContext("2d")
    : null;
  if (equityCtx) {
    new Chart(equityCtx, {
      type: "line",
      data: {
        labels: [
          "Week 1",
          "Week 2",
          "Week 3",
          "Week 4",
          "Week 5",
          "Week 6",
          "Week 7",
          "Week 8",
        ],
        datasets: [
          {
            label: "Account Balance",
            data: [10000, 10500, 11200, 11800, 12500, 11800, 12450, 12450],
            borderColor: "#00ff88",
            backgroundColor: "rgba(0, 255, 136, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#00ff88",
            pointBorderColor: "#0a2540",
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
              font: { size: 11 },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "$" + context.raw.toLocaleString();
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#ffffff", font: { size: 10 } },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "#ffffff",
              font: { size: 10 },
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
          },
        },
      },
    });
  }

  // Performance Chart
  const perfCanvas = document.getElementById("performanceChart");
  const perfCtx = perfCanvas && !perfCanvas.hidden
    ? perfCanvas.getContext("2d")
    : null;
  if (perfCtx) {
    new Chart(perfCtx, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Daily P&L",
            data: [120, -45, 230, 80, -30, 150, 95],
            backgroundColor: function (context) {
              const value = context.parsed.y;
              return value >= 0
                ? "rgba(0, 255, 136, 0.7)"
                : "rgba(255, 77, 77, 0.7)";
            },
            borderColor: function (context) {
              const value = context.parsed.y;
              return value >= 0 ? "#00ff88" : "#ff4d4d";
            },
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
              font: { size: 11 },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return "$" + context.raw.toFixed(2);
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { color: "#ffffff", font: { size: 10 } },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "#ffffff",
              font: { size: 10 },
              callback: function (value) {
                return "$" + value.toFixed(0);
              },
            },
          },
        },
      },
    });
  }

  // ====================================
  // NOTIFICATION BUTTON
  // ====================================
  const notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", function () {
      showToast("You have 3 new notifications", "info");
    });
  }

  // ====================================
  // TOAST NOTIFICATIONS
  // ====================================
  function showToast(message, type = "info") {
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toastContainer";
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    const colors = {
      success: "#00ff88",
      error: "#ff4d4d",
      warning: "#f5b700",
      info: "#00c896",
    };

    toast.style.cssText = `
      background: #0e1726;
      border-left: 4px solid ${colors[type] || colors.info};
      padding: 12px 20px;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
      min-width: 250px;
      max-width: 350px;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}" style="color: ${colors[type] || colors.info}"></i>
        <span>${message}</span>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Add toast animation styles if not present
  if (!document.querySelector("#toastStyles")) {
    const style = document.createElement("style");
    style.id = "toastStyles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
});
