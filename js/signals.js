// ====================================
// SIGNALS - Live Signal Service
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

  hamburgerBtn?.addEventListener("click", function (e) {
    e.stopPropagation();
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  const sidebarClose = document.getElementById("sidebarClose");
  sidebarClose?.addEventListener("click", closeSidebar);

  sidebarOverlay?.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 768 && sidebar.classList.contains("open")) {
      closeSidebar();
    }
  });

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
        // Update active state
        navLinks.forEach(function (l) {
          l.classList.remove("active");
        });
        this.classList.add("active");

        // Update header title (optional, will show briefly)
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

        // Allow navigation to proceed - DO NOT prevent default
        return true;
      }
    });
  });

  // ====================================
  // USER SESSION CHECK
  // ====================================
  function checkUserSession() {
    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    try {
      const userData = JSON.parse(user);
      if (!userData.loggedIn) {
        window.location.href = "login.html";
        return;
      }

      const userInitials = document.getElementById("userInitials");
      if (userInitials) {
        const name = userData.name || "Trader";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        userInitials.textContent = initials;
      }
    } catch (e) {
      window.location.href = "login.html";
    }
  }

  if (typeof NanaSession !== "undefined") NanaSession.guard("login.html");
  checkUserSession();

  // ====================================
  // LOGOUT
  // ====================================
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      if (typeof NanaSession !== "undefined") { NanaSession.logout("login.html"); return; }
      localStorage.removeItem("nanaForexUser");
      sessionStorage.removeItem("nanaForexUser");
      window.location.href = "login.html";
    }
  });

  // ====================================
  // SIGNAL DATA
  // ====================================
  let signals = [
    {
      id: 1,
      pair: "EUR/USD",
      entry: 1.0845,
      stopLoss: 1.08,
      takeProfit: 1.092,
      riskReward: "1:2.5",
      status: "active",
      time: "2 hours ago",
      direction: "buy",
    },
    {
      id: 2,
      pair: "GBP/USD",
      entry: 1.265,
      stopLoss: 1.27,
      takeProfit: 1.258,
      riskReward: "1:2.0",
      status: "active",
      time: "4 hours ago",
      direction: "sell",
    },
    {
      id: 3,
      pair: "XAU/USD",
      entry: 2180.0,
      stopLoss: 2165.0,
      takeProfit: 2200.0,
      riskReward: "1:2.0",
      status: "active",
      time: "6 hours ago",
      direction: "buy",
    },
    {
      id: 4,
      pair: "BTC/USD",
      entry: 62450,
      stopLoss: 63500,
      takeProfit: 61200,
      riskReward: "1:2.0",
      status: "closed",
      time: "8 hours ago",
      direction: "sell",
      result: "win",
    },
    {
      id: 5,
      pair: "NAS100",
      entry: 18200,
      stopLoss: 18000,
      takeProfit: 18500,
      riskReward: "1:2.0",
      status: "closed",
      time: "12 hours ago",
      direction: "buy",
      result: "win",
    },
    {
      id: 6,
      pair: "USD/JPY",
      entry: 148.5,
      stopLoss: 149.8,
      takeProfit: 147.2,
      riskReward: "1:2.0",
      status: "closed",
      time: "1 day ago",
      direction: "sell",
      result: "loss",
    },
    {
      id: 7,
      pair: "AUD/USD",
      entry: 0.655,
      stopLoss: 0.65,
      takeProfit: 0.662,
      riskReward: "1:2.0",
      status: "pending",
      time: "2 days ago",
      direction: "buy",
    },
    {
      id: 8,
      pair: "EUR/GBP",
      entry: 0.855,
      stopLoss: 0.86,
      takeProfit: 0.848,
      riskReward: "1:2.0",
      status: "pending",
      time: "2 days ago",
      direction: "sell",
    },
  ];

  // ====================================
  // RENDER SIGNALS
  // ====================================
  function renderSignals(filter = "all") {
    const tbody = document.getElementById("signalsBody");
    if (!tbody) return;

    let filteredSignals = signals;

    if (filter !== "all") {
      if (filter === "buy") {
        filteredSignals = signals.filter((s) => s.direction === "buy");
      } else if (filter === "sell") {
        filteredSignals = signals.filter((s) => s.direction === "sell");
      } else {
        filteredSignals = signals.filter((s) => s.status === filter);
      }
    }

    // Update active signals count
    const activeCount = signals.filter((s) => s.status === "active").length;
    document.getElementById("activeSignals").textContent = activeCount;

    if (filteredSignals.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fas fa-signal" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            No signals found for this filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredSignals
      .map((signal) => {
        const statusClass = signal.status;
        const directionClass = signal.direction === "buy" ? "buy" : "sell";

        let statusDisplay =
          signal.status.charAt(0).toUpperCase() + signal.status.slice(1);
        if (signal.status === "closed" && signal.result) {
          statusDisplay =
            signal.result.charAt(0).toUpperCase() + signal.result.slice(1);
        }

        return `
        <tr>
          <td class="signal-pair">${signal.pair}</td>
          <td class="signal-entry">${signal.entry}</td>
          <td class="signal-sl">${signal.stopLoss}</td>
          <td class="signal-tp">${signal.takeProfit}</td>
          <td class="signal-rr">${signal.riskReward}</td>
          <td><span class="signal-status ${statusClass}">${statusDisplay}</span></td>
          <td class="signal-time">${signal.time}</td>
        </tr>
      `;
      })
      .join("");
  }

  // ====================================
  // UPDATE PERFORMANCE STATS
  // ====================================
  function updatePerformanceStats() {
    const totalSignals = signals.length;
    const wins = signals.filter(
      (s) => s.status === "closed" && s.result === "win",
    ).length;
    const winRate =
      totalSignals > 0 ? Math.round((wins / totalSignals) * 100) : 0;

    document.getElementById("winRate").textContent = winRate + "%";
    document.getElementById("signalsSent").textContent = totalSignals;
    document.getElementById("statWinRate").textContent = winRate + "%";
    document.getElementById("statSignalsSent").textContent = totalSignals;
  }

  // ====================================
  // FILTER BUTTONS
  // ====================================
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      renderSignals(this.dataset.filter);
    });
  });

  // ====================================
  // REFRESH SIGNALS
  // ====================================
  document
    .getElementById("refreshSignals")
    ?.addEventListener("click", function () {
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      this.disabled = true;

      setTimeout(() => {
        const newSignals = generateNewSignal();
        if (newSignals) {
          signals.unshift(newSignals);
        }
        renderSignals();
        updatePerformanceStats();

        this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        this.disabled = false;
        showToast("Signals refreshed!", "success");
      }, 1500);
    });

  function generateNewSignal() {
    const pairs = [
      "EUR/USD",
      "GBP/USD",
      "XAU/USD",
      "BTC/USD",
      "USD/JPY",
      "AUD/USD",
    ];
    const directions = ["buy", "sell"];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const entry = (Math.random() * 100 + 1).toFixed(4);
    const sl = (
      parseFloat(entry) + (direction === "buy" ? -0.005 : 0.005)
    ).toFixed(4);
    const tp = (
      parseFloat(entry) + (direction === "buy" ? 0.01 : -0.01)
    ).toFixed(4);

    return {
      id: signals.length + 1,
      pair: pair,
      entry: parseFloat(entry),
      stopLoss: parseFloat(sl),
      takeProfit: parseFloat(tp),
      riskReward: "1:2.0",
      status: "active",
      time: "Just now",
      direction: direction,
    };
  }

  // ====================================
  // SUBSCRIPTION MODAL
  // ====================================
  const modal = document.getElementById("subscriptionModal");
  const modalClose = document.getElementById("subscriptionModalClose");
  const subscribeBtn = document.getElementById("subscribeBtn");
  const ctaSubscribeBtn = document.getElementById("ctaSubscribeBtn");

  function openSubscriptionModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    const user =
      localStorage.getItem("nanaForexUser") ||
      sessionStorage.getItem("nanaForexUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (document.getElementById("subName") && userData.name) {
          document.getElementById("subName").value = userData.name;
        }
        if (document.getElementById("subEmail") && userData.email) {
          document.getElementById("subEmail").value = userData.email;
        }
      } catch (e) {}
    }
  }

  function closeSubscriptionModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  subscribeBtn?.addEventListener("click", openSubscriptionModal);
  ctaSubscribeBtn?.addEventListener("click", openSubscriptionModal);
  modalClose?.addEventListener("click", closeSubscriptionModal);

  modal?.addEventListener("click", function (e) {
    if (e.target === this) closeSubscriptionModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeSubscriptionModal();
    }
  });

  // ====================================
  // PREVIEW BUTTONS
  // ====================================
  document.getElementById("previewBtn")?.addEventListener("click", function () {
    document.getElementById("signalPreview").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });

  document
    .getElementById("ctaPreviewBtn")
    ?.addEventListener("click", function () {
      document.getElementById("signalPreview").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

  // ====================================
  // MODAL PLAN SELECTOR
  // ====================================
  document.querySelectorAll(".modal-plan-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".modal-plan-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const plan = this.dataset.plan;
      const details = document.getElementById("modalPlanDetails");

      const plans = {
        monthly: {
          price: "$99",
          period: "/month",
          features: [
            "Real-time signals",
            "Entry, TP & SL levels",
            "Daily market analysis",
            "Telegram notifications",
          ],
        },
        quarterly: {
          price: "$249",
          period: "/quarter",
          features: [
            "Everything in Monthly",
            "Priority signal delivery",
            "Exclusive trade setups",
            "Weekly webinars",
            "VIP Telegram channel",
          ],
        },
        annual: {
          price: "$899",
          period: "/year",
          features: [
            "Everything in Quarterly",
            "Early access to signals",
            "1-on-1 coaching session",
            "Custom signal preferences",
            "Priority support",
            "30-day money-back guarantee",
          ],
        },
      };

      const planData = plans[plan];
      if (planData) {
        details.innerHTML = `
          <div class="modal-price">
            <span class="modal-price-amount">${planData.price}</span>
            <span class="modal-price-period">${planData.period}</span>
          </div>
          <div class="modal-plan-features">
            <ul>
              ${planData.features.map((f) => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join("")}
            </ul>
          </div>
        `;
      }
    });
  });

  // ====================================
  // SUBSCRIPTION FORM
  // ====================================
  const subscriptionForm = document.getElementById("subscriptionForm");
  const subscriptionStatus = document.getElementById("subscriptionStatus");

  if (subscriptionForm) {
    subscriptionForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("subName").value.trim();
      const email = document.getElementById("subEmail").value.trim();

      if (!name || !email) {
        showStatus(subscriptionStatus, "Please fill in all fields.", "error");
        return;
      }

      if (!isValidEmail(email)) {
        showStatus(
          subscriptionStatus,
          "Please enter a valid email address.",
          "error",
        );
        return;
      }

      const submitBtn = document.getElementById("subscribeSubmitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      setTimeout(() => {
        showStatus(
          subscriptionStatus,
          "✅ Subscription successful! Welcome to the Signal Service.",
          "success",
        );
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-lock"></i> Subscribe Now';

        setTimeout(() => {
          closeSubscriptionModal();
          showToast(
            "🎉 You're now subscribed to the Signal Service!",
            "success",
          );
        }, 1500);
      }, 2000);
    });
  }

  // ====================================
  // TELEGRAM WAITLIST
  // ====================================
  document
    .getElementById("telegramWaitlistBtn")
    ?.addEventListener("click", function () {
      const email = document.getElementById("telegramEmail").value.trim();
      const status = document.getElementById("telegramStatus");

      if (!email) {
        showStatus(status, "Please enter your email address.", "error");
        return;
      }

      if (!isValidEmail(email)) {
        showStatus(status, "Please enter a valid email address.", "error");
        return;
      }

      const waitlist = JSON.parse(
        localStorage.getItem("telegramWaitlist") || "[]",
      );
      if (!waitlist.includes(email)) {
        waitlist.push(email);
        localStorage.setItem("telegramWaitlist", JSON.stringify(waitlist));
      }

      showStatus(
        status,
        "✅ You've been added to the waitlist! We'll notify you when Telegram integration launches.",
        "success",
      );
      document.getElementById("telegramEmail").value = "";
    });

  // ====================================
  // FAQ ACCORDION
  // ====================================
  document.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", function () {
      const item = this.closest(".faq-item");
      item.classList.toggle("active");
    });
  });

  // ====================================
  // HELPER FUNCTIONS
  // ====================================
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = "form-status " + type;
    element.style.display = "block";
  }

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

  // Add toast animation styles
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

  // ====================================
  // PERFORMANCE CHART
  // ====================================
  const ctx = document.getElementById("performanceChart")?.getContext("2d");
  if (ctx) {
    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
          "Jan",
          "Feb",
          "Mar",
        ],
        datasets: [
          {
            label: "Monthly Return (%)",
            data: [
              8.2, 10.5, 7.8, 12.3, 9.1, 11.4, 8.7, 14.2, 10.8, 13.5, 11.2,
              12.4,
            ],
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
            borderWidth: 2,
            borderRadius: 6,
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
                return context.parsed.y + "%";
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
                return value + "%";
              },
            },
          },
        },
      },
    });
  }

  // ====================================
  // INITIALIZE
  // ====================================
  renderSignals();
  updatePerformanceStats();

  console.log("✅ Signals page initialized");
});
