// ====================================
// MARKET ANALYSIS - Real-time Market Data
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
  // API CONFIGURATION
  // ====================================
  const API_CONFIG = {
    ALPHA_VANTAGE: "https://www.alphavantage.co/query",
    ALPHA_VANTAGE_KEY: "YOUR_API_KEY",
    EXCHANGE_RATE_API: "https://api.exchangerate-api.com/v4/latest/",
    NEWS_API: "https://api.marketaux.com/v1/news/all",
    NEWS_API_KEY: "YOUR_NEWS_API_KEY",
    ECONOMIC_CALENDAR:
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  };

  // ====================================
  // SYMBOLS CONFIGURATION
  // ====================================
  const SYMBOLS = {
    EURUSD: { name: "EUR/USD", type: "fx", apiSymbol: "EURUSD" },
    GBPUSD: { name: "GBP/USD", type: "fx", apiSymbol: "GBPUSD" },
    USDJPY: { name: "USD/JPY", type: "fx", apiSymbol: "USDJPY" },
    XAUUSD: { name: "XAU/USD", type: "fx", apiSymbol: "XAUUSD" },
    BTCUSD: { name: "BTC/USD", type: "crypto", apiSymbol: "BTCUSD" },
    NAS100: { name: "NAS100", type: "index", apiSymbol: "NAS100" },
  };

  // ====================================
  // PRICE UPDATE FUNCTION
  // ====================================
  async function fetchLivePrices() {
    const symbols = [
      "EURUSD",
      "GBPUSD",
      "USDJPY",
      "XAUUSD",
      "BTCUSD",
      "NAS100",
    ];

    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `${API_CONFIG.ALPHA_VANTAGE}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.ALPHA_VANTAGE_KEY}`,
        );
        const data = await response.json();

        if (data["Global Quote"]) {
          const quote = data["Global Quote"];
          const price = parseFloat(quote["05. price"]);
          const change = parseFloat(quote["09. change"]);
          const changePercent = parseFloat(
            quote["10. change percent"].replace("%", ""),
          );

          updatePriceDisplay(symbol, price, change, changePercent);
        }
      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        const fallback = getFallbackPrice(symbol);
        updatePriceDisplay(
          symbol,
          fallback.price,
          fallback.change,
          fallback.changePercent,
        );
      }
    }

    updateLastUpdated();
  }

  function getFallbackPrice(symbol) {
    const prices = {
      EURUSD: { price: 1.0845, change: 0.0023, changePercent: 0.21 },
      GBPUSD: { price: 1.265, change: -0.0018, changePercent: -0.14 },
      USDJPY: { price: 148.5, change: 0.45, changePercent: 0.3 },
      XAUUSD: { price: 2180.0, change: 15.0, changePercent: 0.69 },
      BTCUSD: { price: 62450.0, change: -350.0, changePercent: -0.56 },
      NAS100: { price: 18200.0, change: 120.0, changePercent: 0.66 },
    };
    return prices[symbol] || { price: 0, change: 0, changePercent: 0 };
  }

  function updatePriceDisplay(symbol, price, change, changePercent) {
    const priceEl = document.getElementById(`price-${symbol}`);
    const changeEl = document.getElementById(`change-${symbol}`);

    if (priceEl) {
      priceEl.textContent = price.toFixed(4);
    }

    if (changeEl) {
      const isPositive = change >= 0;
      changeEl.textContent = `${isPositive ? "+" : ""}${changePercent.toFixed(2)}%`;
      changeEl.className = `price-change ${isPositive ? "positive" : "negative"}`;
    }
  }

  function updateLastUpdated() {
    const el = document.getElementById("lastUpdated");
    if (el) {
      const now = new Date();
      el.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    }
  }

  // ====================================
  // CHART FUNCTIONALITY
  // ====================================
  let priceChart = null;

  async function updateChart() {
    const symbol = document.getElementById("chartSymbol").value;
    const interval = document.getElementById("chartInterval").value;
    const ctx = document.getElementById("priceChart").getContext("2d");

    try {
      const response = await fetch(
        `${API_CONFIG.ALPHA_VANTAGE}?function=FX_DAILY&from_symbol=${symbol.substring(0, 3)}&to_symbol=${symbol.substring(3)}&apikey=${API_CONFIG.ALPHA_VANTAGE_KEY}`,
      );
      const data = await response.json();

      if (data["Time Series FX (Daily)"]) {
        const dates = Object.keys(data["Time Series FX (Daily)"]).sort();
        const prices = dates.map((date) =>
          parseFloat(data["Time Series FX (Daily)"][date]["4. close"]),
        );
        const labels = dates.map((date) => {
          const d = new Date(date);
          return d.toLocaleDateString();
        });

        let limit = 30;
        if (interval === "1week") limit = 90;
        if (interval === "1month") limit = 180;

        const slicedLabels = labels.slice(-limit);
        const slicedPrices = prices.slice(-limit);

        if (priceChart) {
          priceChart.destroy();
        }

        priceChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: slicedLabels,
            datasets: [
              {
                label: symbol,
                data: slicedPrices,
                borderColor: "#00ff88",
                backgroundColor: "rgba(0, 255, 136, 0.1)",
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#00ff88",
                pointRadius: 1,
                pointHoverRadius: 5,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: { color: "#ffffff", font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `${context.dataset.label}: ${context.raw.toFixed(4)}`;
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
                ticks: { color: "#ffffff", font: { size: 10 } },
              },
            },
          },
        });

        updateTechnicalLevels(slicedPrices);
      }
    } catch (error) {
      console.error("Chart error:", error);
      const fallbackPrices = generateFallbackPrices();
      const labels = fallbackPrices.map((_, i) => `Day ${i + 1}`);

      if (priceChart) {
        priceChart.destroy();
      }

      priceChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: symbol,
              data: fallbackPrices,
              borderColor: "#00ff88",
              backgroundColor: "rgba(0, 255, 136, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#00ff88",
              pointRadius: 1,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#ffffff", font: { size: 11 } } },
          },
          scales: {
            x: {
              grid: { color: "rgba(255,255,255,0.05)" },
              ticks: { color: "#ffffff", font: { size: 10 } },
            },
            y: {
              grid: { color: "rgba(255,255,255,0.05)" },
              ticks: { color: "#ffffff", font: { size: 10 } },
            },
          },
        },
      });

      updateTechnicalLevels(fallbackPrices);
    }
  }

  function generateFallbackPrices() {
    const prices = [];
    let price = 1.08;
    for (let i = 0; i < 30; i++) {
      price += (Math.random() - 0.5) * 0.01;
      prices.push(price);
    }
    return prices;
  }

  function updateTechnicalLevels(prices) {
    if (!prices || prices.length === 0) return;

    const sorted = [...prices].sort((a, b) => a - b);
    const current = prices[prices.length - 1];
    const high = sorted[sorted.length - 1];
    const low = sorted[0];
    const range = high - low;

    const support1 = low + range * 0.236;
    const support2 = low + range * 0.382;
    const resistance1 = high - range * 0.236;
    const resistance2 = high - range * 0.382;

    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);

    document.getElementById("support1").textContent = support1.toFixed(4);
    document.getElementById("support2").textContent = support2.toFixed(4);
    document.getElementById("resistance1").textContent = resistance1.toFixed(4);
    document.getElementById("resistance2").textContent = resistance2.toFixed(4);
    document.getElementById("rsiValue").textContent = rsi.toFixed(2);
    document.getElementById("macdValue").textContent = macd.toFixed(4);

    document.getElementById("rsiValue").className = `indicator-value ${
      rsi > 70 ? "bearish" : rsi < 30 ? "bullish" : "neutral"
    }`;
    document.getElementById("macdValue").className = `indicator-value ${
      macd > 0 ? "bullish" : macd < 0 ? "bearish" : "neutral"
    }`;
  }

  function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0,
      losses = 0;
    const start = prices.length - period;

    for (let i = start; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  function calculateMACD(prices) {
    if (prices.length < 26) return 0;

    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;

    const fastMA =
      prices.slice(-fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
    const slowMA =
      prices.slice(-slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;

    return fastMA - slowMA;
  }

  // ====================================
  // ECONOMIC CALENDAR
  // ====================================
  async function loadEconomicCalendar() {
    const container = document.getElementById("economicEvents");
    const filter = document.getElementById("calendarFilter").value;

    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">
      <i class="fas fa-spinner fa-spin"></i> Loading economic events...
    </p>`;

    try {
      const response = await fetch(API_CONFIG.ECONOMIC_CALENDAR);
      const data = await response.json();

      let events = data || getFallbackEvents();

      if (filter !== "all") {
        events = events.filter((e) => e.currency === filter);
      }

      if (events.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No events found for this currency.</p>`;
      } else {
        container.innerHTML = events
          .map(
            (event) => `
          <div class="event-item">
            <span class="event-time">${event.time || "TBD"}</span>
            <span class="event-currency">${event.currency || "USD"}</span>
            <span class="event-impact ${(event.impact || "low").toLowerCase()}">${event.impact || "Low"}</span>
            <span class="event-name">${event.event || "Economic Event"}</span>
          </div>
        `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Economic calendar error:", error);
      const fallbackEvents = getFallbackEvents();
      container.innerHTML = fallbackEvents
        .map(
          (event) => `
        <div class="event-item">
          <span class="event-time">${event.time || "TBD"}</span>
          <span class="event-currency">${event.currency || "USD"}</span>
          <span class="event-impact ${(event.impact || "low").toLowerCase()}">${event.impact || "Low"}</span>
          <span class="event-name">${event.event || "Economic Event"}</span>
        </div>
      `,
        )
        .join("");
    }
  }

  function getFallbackEvents() {
    return [
      {
        time: "10:30 AM",
        currency: "USD",
        impact: "High",
        event: "FOMC Meeting Minutes",
      },
      {
        time: "08:30 AM",
        currency: "EUR",
        impact: "High",
        event: "ECB Interest Rate Decision",
      },
      {
        time: "02:00 PM",
        currency: "GBP",
        impact: "Medium",
        event: "UK CPI Inflation",
      },
      {
        time: "09:45 AM",
        currency: "JPY",
        impact: "Medium",
        event: "BOJ Policy Statement",
      },
      {
        time: "08:15 AM",
        currency: "CAD",
        impact: "Low",
        event: "Canadian Employment Change",
      },
      {
        time: "11:00 AM",
        currency: "AUD",
        impact: "Low",
        event: "RBA Minutes",
      },
      {
        time: "01:30 PM",
        currency: "USD",
        impact: "High",
        event: "Non-Farm Payrolls",
      },
      {
        time: "10:00 AM",
        currency: "EUR",
        impact: "Medium",
        event: "German ZEW Economic Sentiment",
      },
      {
        time: "12:00 PM",
        currency: "GBP",
        impact: "Low",
        event: "UK Manufacturing PMI",
      },
      {
        time: "09:00 AM",
        currency: "JPY",
        impact: "High",
        event: "Japan GDP Growth Rate",
      },
    ];
  }

  // ====================================
  // MARKET NEWS
  // ====================================
  async function loadMarketNews() {
    const container = document.getElementById("marketNews");

    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">
      <i class="fas fa-spinner fa-spin"></i> Loading news...
    </p>`;

    try {
      const response = await fetch(
        `${API_CONFIG.NEWS_API}?api_token=${API_CONFIG.NEWS_API_KEY}&currencies=USD,EUR,GBP&limit=10`,
      );
      const data = await response.json();

      if (data.data && data.data.length > 0) {
        container.innerHTML = data.data
          .map(
            (article) => `
          <div class="news-item">
            <div class="news-title">
              <a href="${article.url}" target="_blank">${article.title}</a>
            </div>
            <div class="news-meta">
              <span class="news-source">${article.source}</span>
              <span>${new Date(article.published_at).toLocaleDateString()}</span>
            </div>
          </div>
        `,
          )
          .join("");
      } else {
        container.innerHTML = getFallbackNews();
      }
    } catch (error) {
      console.error("News error:", error);
      container.innerHTML = getFallbackNews();
    }
  }

  function getFallbackNews() {
    const news = [
      {
        title: "Fed Signals Rate Cuts in 2024 as Inflation Eases",
        source: "Bloomberg",
        date: "Today",
      },
      {
        title: "EUR/USD Rallies as ECB Maintains Hawkish Stance",
        source: "Reuters",
        date: "Today",
      },
      {
        title: "Gold Hits New Record High Amid Geopolitical Tensions",
        source: "CNBC",
        date: "Yesterday",
      },
      {
        title: "Oil Prices Surge as OPEC+ Extends Supply Cuts",
        source: "Financial Times",
        date: "Yesterday",
      },
      {
        title: "Bitcoin Breaks $65,000 as Institutional Inflows Continue",
        source: "CoinDesk",
        date: "2 days ago",
      },
    ];

    return news
      .map(
        (item) => `
      <div class="news-item">
        <div class="news-title">
          <a href="#">${item.title}</a>
        </div>
        <div class="news-meta">
          <span class="news-source">${item.source}</span>
          <span>${item.date}</span>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // ====================================
  // SENTIMENT DATA
  // ====================================
  function updateSentiment() {
    const sentiments = [
      { pair: "EUR/USD", bullish: 65 },
      { pair: "GBP/USD", bullish: 55 },
      { pair: "XAU/USD", bullish: 72 },
      { pair: "BTC/USD", bullish: 58 },
    ];

    const cards = document.querySelectorAll(".sentiment-card");
    cards.forEach((card, index) => {
      if (index < sentiments.length) {
        const data = sentiments[index];
        const fill = card.querySelector(".sentiment-fill");
        const stats = card.querySelector(".sentiment-stats");

        if (fill) {
          fill.style.width = `${data.bullish}%`;
          fill.className = `sentiment-fill ${data.bullish > 60 ? "bullish" : data.bullish < 40 ? "bearish" : "bullish"}`;
        }

        if (stats) {
          stats.innerHTML = `
            <span>Bullish: ${data.bullish}%</span>
            <span>Bearish: ${100 - data.bullish}%</span>
          `;
        }
      }
    });

    const fgiValue = document.getElementById("fgiValue");
    const fgiLabel = document.getElementById("fgiLabel");
    const fgiFill = document.getElementById("fgiFill");

    if (fgiValue && fgiLabel && fgiFill) {
      const value = 52 + Math.floor(Math.random() * 10) - 5;
      fgiValue.textContent = value;
      fgiFill.style.width = `${value}%`;

      if (value < 30) {
        fgiLabel.textContent = "Extreme Fear";
        fgiLabel.className = "fgi-label fear";
      } else if (value < 45) {
        fgiLabel.textContent = "Fear";
        fgiLabel.className = "fgi-label fear";
      } else if (value < 55) {
        fgiLabel.textContent = "Neutral";
        fgiLabel.className = "fgi-label neutral";
      } else if (value < 70) {
        fgiLabel.textContent = "Greed";
        fgiLabel.className = "fgi-label greed";
      } else {
        fgiLabel.textContent = "Extreme Greed";
        fgiLabel.className = "fgi-label greed";
      }
    }
  }

  // ====================================
  // TABS
  // ====================================
  const tabs = document.querySelectorAll(".analysis-tab");
  const tabContents = document.querySelectorAll(".analysis-tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      this.classList.add("active");
      const tabId = this.dataset.tab;
      const content = document.getElementById(`tab-${tabId}`);
      if (content) content.classList.add("active");
    });
  });

  // ====================================
  // REFRESH BUTTONS
  // ====================================
  document
    .getElementById("refreshMarketData")
    ?.addEventListener("click", function () {
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
      this.disabled = true;

      Promise.all([fetchLivePrices(), updateChart()]).then(() => {
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        this.disabled = false;
        showToast("Market data refreshed!", "success");
      });
    });

  document
    .getElementById("updateChartBtn")
    ?.addEventListener("click", function () {
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      this.disabled = true;

      updateChart().then(() => {
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Update';
        this.disabled = false;
        showToast("Chart updated!", "success");
      });
    });

  document
    .getElementById("refreshCalendarBtn")
    ?.addEventListener("click", function () {
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      this.disabled = true;

      loadEconomicCalendar().then(() => {
        this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        this.disabled = false;
        showToast("Calendar updated!", "success");
      });
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
  // INITIALIZE
  // ====================================
  fetchLivePrices();
  updateChart();
  loadEconomicCalendar();
  loadMarketNews();
  updateSentiment();

  setInterval(fetchLivePrices, 60000);
  setInterval(updateSentiment, 30000);

  console.log("✅ Market Analysis page initialized");
});
