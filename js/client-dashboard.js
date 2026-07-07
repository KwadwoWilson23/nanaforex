// ====================================
// CLIENT DASHBOARD
// ====================================

document.addEventListener("DOMContentLoaded", function () {
  // ====================================
  // HAMBURGER MENU TOGGLE
  // ====================================
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    hamburgerBtn?.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    hamburgerBtn?.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Hamburger button toggle
  hamburgerBtn?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Sidebar close button (X)
  const sidebarClose = document.getElementById("sidebarClose");
  sidebarClose?.addEventListener("click", closeSidebar);

  // Overlay click to close
  sidebarOverlay?.addEventListener("click", closeSidebar);

  // Close sidebar on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  // Close sidebar when window resizes to desktop
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  // ====================================
  // NAVIGATION LINKS
  // ====================================
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active from all
      navLinks.forEach(function (l) {
        l.classList.remove("active");
      });

      // Add active to clicked
      this.classList.add("active");

      // Update header title
      const pageName = this.dataset.page;
      const headerTitle = document.querySelector(".dashboard-header h1");
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

      if (headerTitle && pageTitles[pageName]) {
        headerTitle.textContent = pageTitles[pageName];
      }

      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        closeSidebar();
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
  // ====================================
  // Equity Curve Chart
  const equityCtx = document
    .getElementById("equityCurveChart")
    ?.getContext("2d");
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
  const perfCtx = document.getElementById("performanceChart")?.getContext("2d");
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
  notifBtn?.addEventListener("click", function () {
    showToast("You have 3 new notifications", "info");
  });

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
