// ====================================
// COPY TRADING - Professional Copy Trading Platform
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
  // NAVIGATION LINKS
  // ====================================
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      navLinks.forEach(function (l) {
        l.classList.remove("active");
      });

      this.classList.add("active");

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

      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  // ====================================
  // DEMO DATA (Fallback when API is not available)
  // ====================================
  const DEMO_DATA = {
    trader: {
      name: "Kwame Nana",
      bio: "Professional forex trader with over 12 years of experience in institutional trading. Specializes in price action and risk management.",
      experience: "12+ Years",
      tradingStyle: "Swing & Scalp",
      markets: "Forex, Gold, Indices",
      riskProfile: "Moderate",
      status: "Trading Live",
      heroStats: {
        totalVolume: "$2.4M",
        activeCopiers: "247",
        winRate: "85%",
      },
    },
    stats: {
      totalReturn: 68.4,
      totalReturnChange: "+12.3% this month",
      winRate: 85.7,
      winRateChange: "+2.1% vs last month",
      totalTrades: 2458,
      totalTradesChange: "+127 this month",
      profitFactor: 2.87,
      balance: 124500,
      balanceChange: "+$8,200 this month",
      equity: 126800,
      equityChange: "+$2,300 today",
      maxDrawdown: -8.2,
      avgMonthlyReturn: 12.4,
      avgMonthlyReturnChange: "+1.8% vs last month",
    },
    openTrades: [
      {
        symbol: "EUR/USD",
        type: "buy",
        entry: 1.0925,
        current: 1.0953,
        sl: 1.088,
        tp: 1.102,
        pnl: 280.0,
        status: "Active",
      },
      {
        symbol: "GBP/USD",
        type: "sell",
        entry: 1.285,
        current: 1.282,
        sl: 1.29,
        tp: 1.275,
        pnl: 150.0,
        status: "Active",
      },
      {
        symbol: "XAU/USD",
        type: "buy",
        entry: 2050.0,
        current: 2058.5,
        sl: 2040.0,
        tp: 2075.0,
        pnl: 425.0,
        status: "Active",
      },
      {
        symbol: "USD/JPY",
        type: "buy",
        entry: 148.5,
        current: 149.2,
        sl: 147.5,
        tp: 150.5,
        pnl: 210.0,
        status: "Active",
      },
    ],
    tradeHistory: [
      {
        symbol: "EUR/USD",
        type: "buy",
        entry: 1.088,
        exit: 1.0945,
        pnl: 325.0,
        closeDate: "2024-06-28T14:30:00",
      },
      {
        symbol: "GBP/USD",
        type: "sell",
        entry: 1.292,
        exit: 1.286,
        pnl: 180.0,
        closeDate: "2024-06-27T10:15:00",
      },
      {
        symbol: "XAU/USD",
        type: "sell",
        entry: 2065.0,
        exit: 2058.0,
        pnl: 175.0,
        closeDate: "2024-06-26T16:45:00",
      },
      {
        symbol: "USD/JPY",
        type: "sell",
        entry: 149.5,
        exit: 148.8,
        pnl: 105.0,
        closeDate: "2024-06-25T09:00:00",
      },
      {
        symbol: "EUR/USD",
        type: "sell",
        entry: 1.095,
        exit: 1.09,
        pnl: -125.0,
        closeDate: "2024-06-24T13:20:00",
      },
      {
        symbol: "GBP/USD",
        type: "buy",
        entry: 1.278,
        exit: 1.285,
        pnl: 210.0,
        closeDate: "2024-06-21T11:30:00",
      },
      {
        symbol: "XAU/USD",
        type: "buy",
        entry: 2040.0,
        exit: 2055.0,
        pnl: 375.0,
        closeDate: "2024-06-20T15:00:00",
      },
      {
        symbol: "USD/JPY",
        type: "buy",
        entry: 147.8,
        exit: 148.6,
        pnl: 160.0,
        closeDate: "2024-06-19T08:45:00",
      },
      {
        symbol: "EUR/USD",
        type: "buy",
        entry: 1.082,
        exit: 1.088,
        pnl: 180.0,
        closeDate: "2024-06-18T14:00:00",
      },
      {
        symbol: "GBP/USD",
        type: "sell",
        entry: 1.296,
        exit: 1.29,
        pnl: 120.0,
        closeDate: "2024-06-17T10:30:00",
      },
    ],
    equityData: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      values: [
        100000, 102500, 108000, 112000, 115500, 118000, 120500, 124000, 121000,
        126000, 128500, 126800,
      ],
    },
  };

  // ====================================
  // API CONFIGURATION
  // ====================================
  const API_CONFIG = {
    BASE_URL: "https://api.your-trading-platform.com/v1",
    ENDPOINTS: {
      TRADER_INFO: "/trader/info",
      TRADING_STATS: "/trader/stats",
      OPEN_TRADES: "/trader/open-trades",
      TRADE_HISTORY: "/trader/trade-history",
      EQUITY_DATA: "/trader/equity-data",
      COPY_TRADING: "/copy-trading/start",
    },
    API_KEY: "YOUR_API_KEY_HERE",
    ACCOUNT_ID: "YOUR_MASTER_ACCOUNT_ID",
    USE_DEMO_DATA: true, // Set to false to use real API
  };

  // ====================================
  // STATE MANAGEMENT
  // ====================================
  const state = {
    trader: null,
    stats: null,
    openTrades: [],
    tradeHistory: [],
    equityData: null,
    isLoading: false,
    refreshInterval: null,
    chartInstance: null,
  };

  // ====================================
  // API SERVICE LAYER WITH DEMO FALLBACK
  // ====================================
  const TradingAPI = {
    async fetch(endpoint, options = {}) {
      if (API_CONFIG.USE_DEMO_DATA) {
        // Return demo data based on endpoint
        const demoResponses = {
          [API_CONFIG.ENDPOINTS.TRADER_INFO]: DEMO_DATA.trader,
          [API_CONFIG.ENDPOINTS.TRADING_STATS]: DEMO_DATA.stats,
          [API_CONFIG.ENDPOINTS.OPEN_TRADES]: { trades: DEMO_DATA.openTrades },
          [API_CONFIG.ENDPOINTS.TRADE_HISTORY]: {
            trades: DEMO_DATA.tradeHistory,
          },
          [API_CONFIG.ENDPOINTS.EQUITY_DATA]: DEMO_DATA.equityData,
          [API_CONFIG.ENDPOINTS.COPY_TRADING]: {
            success: true,
            message: "Copy trading started successfully",
          },
        };

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const response = demoResponses[endpoint] || { data: null };
        return response;
      }

      // Real API call
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_CONFIG.API_KEY,
        "X-Account-ID": API_CONFIG.ACCOUNT_ID,
        ...options.headers,
      };

      try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} - ${response.statusText}`,
          );
        }
        return await response.json();
      } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
      }
    },

    async getTraderInfo() {
      return this.fetch(API_CONFIG.ENDPOINTS.TRADER_INFO);
    },

    async getTradingStats() {
      return this.fetch(API_CONFIG.ENDPOINTS.TRADING_STATS);
    },

    async getOpenTrades() {
      return this.fetch(API_CONFIG.ENDPOINTS.OPEN_TRADES);
    },

    async getTradeHistory(limit = 50) {
      return this.fetch(`${API_CONFIG.ENDPOINTS.TRADE_HISTORY}?limit=${limit}`);
    },

    async getEquityData(period = "1Y") {
      return this.fetch(`${API_CONFIG.ENDPOINTS.EQUITY_DATA}?period=${period}`);
    },

    async startCopyTrading(params) {
      return this.fetch(API_CONFIG.ENDPOINTS.COPY_TRADING, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  };

  // ====================================
  // DATA LOADING FUNCTIONS
  // ====================================

  async function loadTraderInfo() {
    try {
      const data = await TradingAPI.getTraderInfo();
      state.trader = data;
      renderTraderInfo(data);
      return data;
    } catch (error) {
      console.error("Error loading trader info:", error);
      return null;
    }
  }

  async function loadTradingStats() {
    try {
      const data = await TradingAPI.getTradingStats();
      state.stats = data;
      renderTradingStats(data);
      return data;
    } catch (error) {
      console.error("Error loading trading stats:", error);
      return null;
    }
  }

  async function loadOpenTrades() {
    try {
      const data = await TradingAPI.getOpenTrades();
      state.openTrades = data.trades || [];
      renderOpenTrades(state.openTrades);
      updateTradeCounts(state.openTrades);
      return data;
    } catch (error) {
      console.error("Error loading open trades:", error);
      return null;
    }
  }

  async function loadTradeHistory() {
    try {
      const data = await TradingAPI.getTradeHistory(50);
      state.tradeHistory = data.trades || [];
      renderTradeHistory(state.tradeHistory);
      return data;
    } catch (error) {
      console.error("Error loading trade history:", error);
      return null;
    }
  }

  async function loadEquityData(period = "1Y") {
    try {
      const data = await TradingAPI.getEquityData(period);
      state.equityData = data;
      renderEquityChart(data);
      return data;
    } catch (error) {
      console.error("Error loading equity data:", error);
      return null;
    }
  }

  // ====================================
  // RENDER FUNCTIONS
  // ====================================

  function renderTraderInfo(trader) {
    if (!trader) return;

    const traderName = document.querySelector(".trader-header h2");
    const traderBio = document.querySelector(".trader-bio");
    const traderDetails = document.querySelectorAll(".detail-item");

    if (traderName)
      traderName.textContent = trader.name || "Professional Trader";
    if (traderBio)
      traderBio.textContent =
        trader.bio || "Professional trader with a proven track record.";

    const detailMap = {
      "Experience:": trader.experience || "N/A",
      "Trading Style:": trader.tradingStyle || "N/A",
      "Markets:": trader.markets || "N/A",
      "Risk Profile:": trader.riskProfile || "N/A",
    };

    traderDetails.forEach((item) => {
      const label = item.querySelector("strong");
      if (label) {
        const key = label.textContent;
        if (detailMap[key]) {
          const span = item.querySelector("span");
          if (span) {
            span.innerHTML = `<strong>${key}</strong> ${detailMap[key]}`;
          }
        }
      }
    });

    const status = document.querySelector(".trader-status");
    if (status) {
      status.innerHTML = `<i class="fas fa-circle"></i> ${trader.status || "Trading Live"}`;
    }

    if (trader.heroStats) {
      const heroStats = document.querySelectorAll(
        ".hero-stats-mini .stat-number",
      );
      if (heroStats.length >= 3) {
        heroStats[0].textContent = trader.heroStats.totalVolume || "$2.4M";
        heroStats[1].textContent = trader.heroStats.activeCopiers || "247";
        heroStats[2].textContent = trader.heroStats.winRate || "85%";
      }
    }
  }

  function renderTradingStats(stats) {
    if (!stats) return;

    const statMap = {
      statTotalReturn: {
        value: stats.totalReturn,
        suffix: "%",
        prefix: stats.totalReturn >= 0 ? "+" : "",
      },
      statWinRate: { value: stats.winRate, suffix: "%" },
      statTotalTrades: { value: stats.totalTrades, locale: true },
      statProfitFactor: { value: stats.profitFactor, decimals: 2 },
      statBalance: { value: stats.balance, prefix: "$", locale: true },
      statEquity: { value: stats.equity, prefix: "$", locale: true },
      statDrawdown: { value: stats.maxDrawdown, suffix: "%" },
      statAvgReturn: {
        value: stats.avgMonthlyReturn,
        suffix: "%",
        prefix: stats.avgMonthlyReturn >= 0 ? "+" : "",
      },
    };

    Object.keys(statMap).forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const config = statMap[id];
      let displayValue = config.value || 0;

      if (config.decimals !== undefined) {
        displayValue = displayValue.toFixed(config.decimals);
      } else if (typeof displayValue === "number" && config.locale) {
        displayValue = displayValue.toLocaleString();
      }

      el.textContent = `${config.prefix || ""}${displayValue}${config.suffix || ""}`;
    });
  }

  function renderOpenTrades(trades) {
    const tbody = document.getElementById("openTradesBody");
    if (!tbody) return;

    if (!trades || trades.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fas fa-check-circle" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; color: var(--profit-green);"></i>
            No open trades at the moment.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = trades
      .map((trade) => {
        const pnlClass = trade.pnl >= 0 ? "positive" : "negative";
        const typeClass = trade.type === "buy" ? "buy" : "sell";

        return `
        <tr>
          <td class="trade-symbol">${trade.symbol || "N/A"}</td>
          <td class="trade-type ${typeClass}">${(trade.type || "").toUpperCase()}</td>
          <td>${trade.entry || 0}</td>
          <td>${trade.current || 0}</td>
          <td>${trade.sl || 0}</td>
          <td>${trade.tp || 0}</td>
          <td class="trade-pnl ${pnlClass}">${trade.pnl >= 0 ? "+" : ""}$${trade.pnl?.toFixed(2) || "0.00"}</td>
          <td class="trade-status active">${trade.status || "Active"}</td>
        </tr>
      `;
      })
      .join("");
  }

  function renderTradeHistory(trades) {
    const tbody = document.getElementById("historyBody");
    if (!tbody) return;

    if (!trades || trades.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <i class="fas fa-history" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
            No trade history yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = trades
      .map((trade) => {
        const pnlClass = trade.pnl >= 0 ? "positive" : "negative";
        const typeClass = trade.type === "buy" ? "buy" : "sell";
        const date = trade.closeDate
          ? new Date(trade.closeDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A";

        return `
        <tr>
          <td class="trade-symbol">${trade.symbol || "N/A"}</td>
          <td class="trade-type ${typeClass}">${(trade.type || "").toUpperCase()}</td>
          <td>${trade.entry || 0}</td>
          <td>${trade.exit || 0}</td>
          <td class="trade-pnl ${pnlClass}">${trade.pnl >= 0 ? "+" : ""}$${trade.pnl?.toFixed(2) || "0.00"}</td>
          <td>${date}</td>
        </tr>
      `;
      })
      .join("");
  }

  function updateTradeCounts(trades) {
    const countEl = document.getElementById("openTradesCount");
    if (countEl) {
      countEl.textContent = trades?.length || 0;
    }
  }

  // ====================================
  // EQUITY CHART
  // ====================================
  function renderEquityChart(data) {
    const ctx = document.getElementById("equityChart")?.getContext("2d");
    if (!ctx) return;

    const labels = data?.labels || ["No Data"];
    const values = data?.values || [0];

    if (state.chartInstance) {
      state.chartInstance.destroy();
    }

    state.chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Equity ($)",
            data: values,
            borderColor: "#00ff88",
            backgroundColor: function (context) {
              const chart = context.chart;
              const { ctx, chartArea } = chart;
              if (!chartArea) return "rgba(0, 255, 136, 0.1)";

              const gradient = ctx.createLinearGradient(
                0,
                chartArea.top,
                0,
                chartArea.bottom,
              );
              gradient.addColorStop(0, "rgba(0, 255, 136, 0.3)");
              gradient.addColorStop(1, "rgba(0, 255, 136, 0.0)");
              return gradient;
            },
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#00ff88",
            pointBorderColor: "#0a2540",
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
              font: { size: 11, family: "Inter" },
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
            ticks: { color: "#ffffff", font: { size: 10, family: "Inter" } },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "#ffffff",
              font: { size: 10, family: "Inter" },
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
          },
        },
      },
    });
  }

  // ====================================
  // CHART PERIOD SELECTION
  // ====================================
  document.querySelectorAll(".chart-period").forEach((btn) => {
    btn.addEventListener("click", async function () {
      document
        .querySelectorAll(".chart-period")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const period = this.dataset.period;
      await loadEquityData(period);
    });
  });

  // ====================================
  // REFRESH FUNCTIONS
  // ====================================
  async function refreshAllData() {
    if (state.isLoading) return;

    state.isLoading = true;
    const refreshBtns = document.querySelectorAll(".refresh-btn");
    refreshBtns.forEach((btn) => {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      btn.disabled = true;
    });

    try {
      await Promise.all([
        loadTradingStats(),
        loadOpenTrades(),
        loadTradeHistory(),
      ]);

      showToast("Data refreshed successfully!", "success");
    } catch (error) {
      console.error("Refresh error:", error);
      showToast("Failed to refresh data", "error");
    } finally {
      state.isLoading = false;
      refreshBtns.forEach((btn) => {
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        btn.disabled = false;
      });
    }
  }

  document
    .getElementById("refreshTradesBtn")
    ?.addEventListener("click", refreshAllData);
  document
    .getElementById("refreshHistoryBtn")
    ?.addEventListener("click", refreshAllData);

  // ====================================
  // VIEW PERFORMANCE
  // ====================================
  function scrollToPerformance() {
    const chartSection = document.querySelector(".chart-section");
    if (chartSection) {
      chartSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  document
    .getElementById("viewPerformanceBtn")
    ?.addEventListener("click", scrollToPerformance);
  document
    .getElementById("ctaViewPerformance")
    ?.addEventListener("click", scrollToPerformance);

  // ====================================
  // COPY TRADING MODAL
  // ====================================
  const copyModal = document.getElementById("copyModal");
  const modalClose = document.getElementById("copyModalClose");
  const startCopyBtn = document.getElementById("startCopyBtn");
  const ctaStartCopyBtn = document.getElementById("ctaStartCopyBtn");

  function openCopyModal() {
    copyModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCopyModal() {
    copyModal.classList.remove("active");
    document.body.style.overflow = "";
  }

  startCopyBtn?.addEventListener("click", openCopyModal);
  ctaStartCopyBtn?.addEventListener("click", openCopyModal);
  modalClose?.addEventListener("click", closeCopyModal);

  copyModal?.addEventListener("click", function (e) {
    if (e.target === this) closeCopyModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && copyModal.classList.contains("active")) {
      closeCopyModal();
    }
  });

  // ====================================
  // COPY TRADING FORM
  // ====================================
  const copyForm = document.getElementById("copyTradingForm");
  const copyStatus = document.getElementById("copyStatus");

  if (copyForm) {
    copyForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const accountType = document.getElementById("copyAccountType").value;
      const accountNumber = document
        .getElementById("copyAccountNumber")
        .value.trim();
      const investment = document.getElementById("copyInvestment").value;
      const riskLevel = document.getElementById("copyRiskLevel").value;
      const agree = document.getElementById("copyAgree").checked;

      if (!accountType || !accountNumber || !investment) {
        showStatus(copyStatus, "Please fill in all required fields.", "error");
        return;
      }

      if (parseFloat(investment) < 500) {
        showStatus(copyStatus, "Minimum investment is $500.", "error");
        return;
      }

      if (!agree) {
        showStatus(
          copyStatus,
          "Please agree to the Terms and Conditions.",
          "error",
        );
        return;
      }

      const submitBtn = document.getElementById("copySubmitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Starting Copy Trading...';

      try {
        const result = await TradingAPI.startCopyTrading({
          accountType: accountType,
          accountNumber: accountNumber,
          investmentAmount: parseFloat(investment),
          riskLevel: riskLevel,
        });

        showStatus(
          copyStatus,
          "✅ Copy trading started successfully!",
          "success",
        );

        setTimeout(() => {
          closeCopyModal();
          showToast("🎉 You are now copying the master trader!", "success");
        }, 1500);
      } catch (error) {
        console.error("Copy trading error:", error);
        showStatus(
          copyStatus,
          `Failed to start copy trading: ${error.message}`,
          "error",
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-copy"></i> Start Copy Trading';
      }
    });
  }

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

  checkUserSession();

  // ====================================
  // LOGOUT
  // ====================================
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn?.addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("nanaForexUser");
      sessionStorage.removeItem("nanaForexUser");
      window.location.href = "login.html";
    }
  });

  // ====================================
  // INITIALIZATION
  // ====================================
  async function init() {
    console.log("🚀 Copy Trading Platform Initializing...");
    console.log("📡 Using Demo Data:", API_CONFIG.USE_DEMO_DATA);

    try {
      await Promise.all([
        loadTraderInfo(),
        loadTradingStats(),
        loadOpenTrades(),
        loadTradeHistory(),
        loadEquityData("1Y"),
      ]);

      console.log("✅ All data loaded successfully!");
      console.log("👤 Trader:", state.trader);
      console.log("📊 Stats:", state.stats);
      console.log("📈 Open Trades:", state.openTrades.length);
      console.log("📋 Trade History:", state.tradeHistory.length);

      // Auto-refresh every 60 seconds
      state.refreshInterval = setInterval(() => {
        console.log("🔄 Auto-refreshing data...");
        refreshAllData();
      }, 60000);
    } catch (error) {
      console.error("❌ Initialization error:", error);
    }
  }

  // Start the application
  init();

  // Cleanup on page unload
  window.addEventListener("beforeunload", function () {
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval);
    }
    if (state.chartInstance) {
      state.chartInstance.destroy();
    }
  });

  console.log("✅ Copy Trading JavaScript loaded successfully!");
});
