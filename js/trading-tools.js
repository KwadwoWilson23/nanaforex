// ====================================
// TRADING TOOLS - With Real-time API Integration
// ====================================

// ====================================
// GLOBAL FUNCTIONS - Exposed for HTML onclick
// ====================================

// 1. Position Size Calculator
function calculatePositionSize() {
  const balance = parseFloat(document.getElementById("psBalance").value);
  const risk = parseFloat(document.getElementById("psRisk").value);
  const stopLoss = parseFloat(document.getElementById("psStopLoss").value);
  const result = document.getElementById("psResult");

  if (!balance || !risk || !stopLoss) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const riskAmount = balance * (risk / 100);
  const pipValue = 10;
  const lots = riskAmount / (stopLoss * pipValue);

  document.getElementById("psLots").textContent = lots.toFixed(2);
  document.getElementById("psRiskAmount").textContent =
    `$${riskAmount.toFixed(2)}`;
  result.classList.add("show");
}

// 2. Pip Value Calculator
function calculatePipValue() {
  const pair = document.getElementById("pvPair").value;
  const lots = parseFloat(document.getElementById("pvLots").value);
  const price = parseFloat(document.getElementById("pvPrice").value);
  const result = document.getElementById("pvResult");

  if (!lots) {
    showToast("Please enter a position size.", "error");
    return;
  }

  let pipValue = 10 * lots;
  if (pair === "USDJPY") {
    const rate = price || 110;
    pipValue = (10 * lots) / rate;
  }
  if (pair === "XAUUSD") pipValue = 1 * lots;
  if (pair === "BTCUSD") pipValue = 1 * lots;

  document.getElementById("pvValue").textContent = `$${pipValue.toFixed(4)}`;
  document.getElementById("pvTenPips").textContent =
    `$${(pipValue * 10).toFixed(2)}`;
  result.classList.add("show");
}

// 3. Risk/Reward Calculator
function calculateRiskReward() {
  const entry = parseFloat(document.getElementById("rrEntry").value);
  const stopLoss = parseFloat(document.getElementById("rrStopLoss").value);
  const takeProfit = parseFloat(document.getElementById("rrTakeProfit").value);
  const type = document.getElementById("rrType").value;
  const result = document.getElementById("rrResult");

  if (!entry || !stopLoss || !takeProfit) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  let risk, reward;
  if (type === "long") {
    risk = entry - stopLoss;
    reward = takeProfit - entry;
  } else {
    risk = stopLoss - entry;
    reward = entry - takeProfit;
  }

  const riskPips = Math.abs(risk) * 10000;
  const rewardPips = Math.abs(reward) * 10000;
  const ratio = rewardPips / riskPips;

  document.getElementById("rrRisk").textContent = riskPips.toFixed(0);
  document.getElementById("rrReward").textContent = rewardPips.toFixed(0);
  document.getElementById("rrRatio").textContent = `1:${ratio.toFixed(2)}`;
  result.classList.add("show");
}

// 4. Currency Converter
function convertCurrency() {
  const amount = parseFloat(document.getElementById("ccAmount").value);
  const rate = parseFloat(document.getElementById("ccRate").value);
  const from = document.getElementById("ccFrom").value;
  const to = document.getElementById("ccTo").value;
  const result = document.getElementById("ccResult");

  if (!amount || !rate) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const converted = amount * rate;
  document.getElementById("ccConverted").textContent = converted.toFixed(2);
  const rateDisplay = document.getElementById("ccRateDisplay");
  if (rateDisplay) {
    rateDisplay.textContent = `Rate: 1 ${from} = ${rate.toFixed(4)} ${to}`;
  }
  result.classList.add("show");
}

// 5. Profit/Loss Calculator
function calculateProfitLoss() {
  const entry = parseFloat(document.getElementById("plEntry").value);
  const exit = parseFloat(document.getElementById("plExit").value);
  const lots = parseFloat(document.getElementById("plLots").value);
  const type = document.getElementById("plType").value;
  const result = document.getElementById("plResult");

  if (!entry || !exit || !lots) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  let pips;
  if (type === "long") {
    pips = (exit - entry) * 10000;
  } else {
    pips = (entry - exit) * 10000;
  }

  const pipValue = 10 * lots;
  const amount = pips * pipValue;

  document.getElementById("plPips").textContent = pips.toFixed(0);
  document.getElementById("plAmount").textContent =
    `${amount >= 0 ? "+" : ""}$${amount.toFixed(2)}`;
  document.getElementById("plAmount").style.color =
    amount >= 0 ? "var(--profit-green)" : "var(--danger)";
  result.classList.add("show");
}

// 6. RSI Calculator
function calculateRSI() {
  const dataText = document.getElementById("rsiData").value;
  const period = parseInt(document.getElementById("rsiPeriod").value);
  const result = document.getElementById("rsiResult");

  if (!dataText || !period) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const prices = dataText
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (prices.length < period + 1) {
    showToast("Not enough data for the selected period.", "error");
    return;
  }

  let gains = 0,
    losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  let signal = "Neutral";
  let color = "var(--gold)";
  if (rsi > 70) {
    signal = "🔴 Overbought";
    color = "var(--danger)";
  } else if (rsi < 30) {
    signal = "🟢 Oversold";
    color = "var(--profit-green)";
  }

  document.getElementById("rsiValue").textContent = rsi.toFixed(2);
  const signalEl = document.getElementById("rsiSignal");
  signalEl.textContent = signal;
  signalEl.style.color = color;
  result.classList.add("show");
}

// 7. Fibonacci Calculator
function calculateFibonacci() {
  const high = parseFloat(document.getElementById("fibHigh").value);
  const low = parseFloat(document.getElementById("fibLow").value);
  const result = document.getElementById("fibResult");

  if (!high || !low) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const diff = high - low;
  const levels = {
    236: high - diff * 0.236,
    382: high - diff * 0.382,
    500: high - diff * 0.5,
    618: high - diff * 0.618,
    786: high - diff * 0.786,
    100: low,
  };

  document.getElementById("fib236").textContent = levels["236"].toFixed(4);
  document.getElementById("fib382").textContent = levels["382"].toFixed(4);
  document.getElementById("fib500").textContent = levels["500"].toFixed(4);
  document.getElementById("fib618").textContent = levels["618"].toFixed(4);
  document.getElementById("fib786").textContent = levels["786"].toFixed(4);
  document.getElementById("fib100").textContent = levels["100"].toFixed(4);
  result.classList.add("show");
}

// 8. Economic Calendar
async function loadEconomicCalendar() {
  const filter = document.getElementById("ecFilter").value;
  const container = document.getElementById("ecEvents");
  const result = document.getElementById("ecResult");

  container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">
    <i class="fas fa-spinner fa-spin"></i> Loading economic events...
  </p>`;

  try {
    const events = await fetchEconomicCalendar();
    let filtered = events;

    if (filter !== "all") {
      filtered = events.filter((e) => e.currency === filter);
    }

    if (filtered.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">No events found for this currency.</p>`;
    } else {
      container.innerHTML = filtered
        .map(
          (event) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">${event.time || "TBD"}</span>
          <span style="font-weight: 600;">${event.currency || "USD"}</span>
          <span style="color: ${event.impact === "High" ? "var(--danger)" : event.impact === "Medium" ? "var(--gold)" : "var(--text-muted)"}; font-size: 0.8rem; font-weight: 600;">${event.impact || "Low"}</span>
          <span style="font-size: 0.85rem; flex: 1;">${event.event || "Economic Event"}</span>
        </div>
      `,
        )
        .join("");
    }
  } catch (error) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Failed to load economic calendar. Please try again.</p>`;
  }

  result.classList.add("show");
}

// 9. Volatility Calculator
function calculateVolatility() {
  const dataText = document.getElementById("volData").value;
  const period = parseInt(document.getElementById("volPeriod").value);
  const result = document.getElementById("volResult");

  if (!dataText || !period) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const prices = dataText
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (prices.length < period) {
    showToast("Not enough data for the selected period.", "error");
    return;
  }

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const tr = [];
  for (let i = 1; i < prices.length; i++) {
    const high = prices[i];
    const low = prices[i] > prices[i - 1] ? prices[i - 1] : prices[i];
    const close = prices[i - 1];
    const hl = high - low;
    const hc = Math.abs(high - close);
    const lc = Math.abs(low - close);
    tr.push(Math.max(hl, hc, lc));
  }
  const atr = tr.slice(-period).reduce((a, b) => a + b, 0) / period;

  let level = "Low";
  let color = "var(--profit-green)";
  if (stdDev > 0.03) {
    level = "🟢 High";
    color = "var(--danger)";
  } else if (stdDev > 0.015) {
    level = "🟡 Moderate";
    color = "var(--gold)";
  }

  document.getElementById("volStdDev").textContent =
    (stdDev * 100).toFixed(2) + "%";
  document.getElementById("volATR").textContent = atr.toFixed(4);
  const levelEl = document.getElementById("volLevel");
  levelEl.textContent = level;
  levelEl.style.color = color;
  result.classList.add("show");
}

// 10. Moving Average Crossover
function calculateMACrossover() {
  const dataText = document.getElementById("maData").value;
  const fastPeriod = parseInt(document.getElementById("maFast").value);
  const slowPeriod = parseInt(document.getElementById("maSlow").value);
  const result = document.getElementById("maResult");

  if (!dataText || !fastPeriod || !slowPeriod) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const prices = dataText
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
  if (prices.length < slowPeriod) {
    showToast("Not enough data for the selected periods.", "error");
    return;
  }

  const fastMA =
    prices.slice(-fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
  const slowMA =
    prices.slice(-slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;

  document.getElementById("maFastValue").textContent = fastMA.toFixed(4);
  document.getElementById("maSlowValue").textContent = slowMA.toFixed(4);

  let signal = "📈 Bullish Crossover";
  let color = "var(--profit-green)";
  if (fastMA < slowMA) {
    signal = "📉 Bearish Crossover";
    color = "var(--danger)";
  } else if (Math.abs(fastMA - slowMA) / slowMA < 0.001) {
    signal = "⚖️ Neutral - No Crossover";
    color = "var(--gold)";
  }

  const signalEl = document.getElementById("maSignal");
  signalEl.textContent = signal;
  signalEl.style.color = color;
  result.classList.add("show");
}

// 11. Lot Size Calculator
function calculateLotSize() {
  const balance = parseFloat(document.getElementById("lsBalance").value);
  const riskPercent = parseFloat(
    document.getElementById("lsRiskPercent").value,
  );
  const stopLoss = parseFloat(document.getElementById("lsStopLoss").value);
  const pipValue = parseFloat(document.getElementById("lsPipValue").value);
  const result = document.getElementById("lsResult");

  if (!balance || !riskPercent || !stopLoss || !pipValue) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  const riskAmount = balance * (riskPercent / 100);
  const lots = riskAmount / (stopLoss * pipValue);

  document.getElementById("lsLots").textContent = lots.toFixed(2);
  document.getElementById("lsRiskAmount").textContent =
    `$${riskAmount.toFixed(2)}`;
  result.classList.add("show");
}

// 12. Trading Journal
let journalEntries = JSON.parse(localStorage.getItem("tradingJournal") || "[]");

function renderJournal() {
  const container = document.getElementById("journalEntries");
  if (!container) return;

  if (journalEntries.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No journal entries yet. Click "Add Entry" to get started.</p>`;
    return;
  }

  container.innerHTML = journalEntries
    .slice()
    .reverse()
    .map((entry, index) => {
      const realIndex = journalEntries.length - 1 - index;
      const resultColor =
        entry.result === "win"
          ? "var(--profit-green)"
          : entry.result === "loss"
            ? "var(--danger)"
            : "var(--gold)";
      return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div style="font-weight: 600;">${entry.symbol} - ${entry.position}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Entry: ${entry.entry} | Exit: ${entry.exit} | Lots: ${entry.lots}</div>
          ${entry.notes ? `<div style="font-size: 0.8rem; color: var(--text-muted);">${entry.notes}</div>` : ""}
        </div>
        <div>
          <span style="color: ${resultColor}; font-weight: 600; text-transform: uppercase;">${entry.result}</span>
          <button onclick="deleteJournalEntry(${realIndex})" style="background: none; border: none; color: var(--danger); cursor: pointer; margin-left: 0.5rem;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

function addJournalEntry() {
  const form = document.getElementById("journalForm");
  if (form) {
    form.style.display = "block";
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function cancelJournalEntry() {
  const form = document.getElementById("journalForm");
  if (form) {
    form.style.display = "none";
    document.getElementById("jSymbol").value = "";
    document.getElementById("jEntry").value = "";
    document.getElementById("jExit").value = "";
    document.getElementById("jLots").value = "";
    document.getElementById("jNotes").value = "";
  }
}

function saveJournalEntry() {
  const symbol = document.getElementById("jSymbol").value;
  const position = document.getElementById("jPosition").value;
  const entry = parseFloat(document.getElementById("jEntry").value);
  const exit = parseFloat(document.getElementById("jExit").value);
  const lots = parseFloat(document.getElementById("jLots").value);
  const result = document.getElementById("jResult").value;
  const notes = document.getElementById("jNotes").value;

  if (!symbol || !entry || !exit || !lots) {
    showToast("Please fill in all required fields.", "error");
    return;
  }

  journalEntries.push({
    symbol,
    position,
    entry,
    exit,
    lots,
    result,
    notes,
    date: new Date().toISOString(),
  });
  localStorage.setItem("tradingJournal", JSON.stringify(journalEntries));
  renderJournal();
  cancelJournalEntry();
  showToast("📝 Journal entry saved!", "success");
}

function deleteJournalEntry(index) {
  if (confirm("Delete this journal entry?")) {
    journalEntries.splice(index, 1);
    localStorage.setItem("tradingJournal", JSON.stringify(journalEntries));
    renderJournal();
    showToast("Entry deleted.", "info");
  }
}

function exportJournal() {
  if (journalEntries.length === 0) {
    showToast("No journal entries to export.", "warning");
    return;
  }

  const data = JSON.stringify(journalEntries, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trading-journal-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Journal exported successfully!", "success");
}

// 13. API Integration Functions
async function fetchExchangeRates(baseCurrency = "USD") {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
    );
    if (!response.ok) throw new Error("Failed to fetch exchange rates");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Exchange rate API error:", error);
    return null;
  }
}

async function fetchAlphaVantageData(symbol, functionName = "FX_DAILY") {
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Data fetch error:", error);
    return null;
  }
}

async function fetchEconomicCalendar() {
  try {
    const response = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    );
    if (!response.ok) throw new Error("Failed to fetch economic calendar");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Economic calendar API error:", error);
    return getFallbackEconomicEvents();
  }
}

function getFallbackEconomicEvents() {
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

// 14. Currency Converter - Fetch live exchange rates
async function updateCurrencyRate() {
  const from = document.getElementById("ccFrom").value;
  const to = document.getElementById("ccTo").value;
  const rateInput = document.getElementById("ccRate");
  const rateDisplay = document.getElementById("ccRateDisplay");

  if (!from || !to) return;

  rateInput.placeholder = "Loading...";
  rateInput.value = "";

  try {
    const data = await fetchExchangeRates(from);
    if (data && data.rates && data.rates[to]) {
      const rate = data.rates[to];
      rateInput.value = rate.toFixed(6);
      if (rateDisplay) {
        rateDisplay.textContent = `Rate: 1 ${from} = ${rate.toFixed(4)} ${to}`;
      }
      showToast(
        `Exchange rate updated: 1 ${from} = ${rate.toFixed(4)} ${to}`,
        "success",
      );
    } else {
      rateInput.placeholder = "Failed to fetch rate";
      showToast("Failed to fetch exchange rate. Please try again.", "error");
    }
  } catch (error) {
    rateInput.placeholder = "Error fetching rate";
    showToast("Error fetching exchange rate. Please try again.", "error");
  }
}

// 15. Fetch current price for Pip Value calculator
async function fetchCurrentPrice(pairSelectId, priceInputId) {
  const pairSelect = document.getElementById(pairSelectId);
  const priceInput = document.getElementById(priceInputId);
  if (!pairSelect || !priceInput) return;

  const symbol = pairSelect.value;
  priceInput.placeholder = "Fetching...";

  try {
    const data = await fetchAlphaVantageData(symbol);
    if (data && data.values && data.values.length > 0) {
      const close = parseFloat(data.values[0].close);
      priceInput.value = close.toFixed(4);
      showToast(`Price updated: ${symbol} = ${close}`, "success");
    } else {
      priceInput.placeholder = "Unable to fetch";
      showToast("Unable to fetch price. Please enter manually.", "error");
    }
  } catch (error) {
    priceInput.placeholder = "Error fetching";
    showToast("Error fetching price. Please enter manually.", "error");
  }
}

// 16. Fetch price for Risk/Reward tool
async function fetchCurrentPriceForRR() {
  const entryInput = document.getElementById("rrEntry");
  if (!entryInput) return;

  entryInput.placeholder = "Fetching...";

  try {
    const data = await fetchAlphaVantageData("EURUSD");
    if (data && data.values && data.values.length > 0) {
      const close = parseFloat(data.values[0].close);
      entryInput.value = close.toFixed(4);
      showToast(`Price updated: EUR/USD = ${close}`, "success");
    } else {
      entryInput.placeholder = "Unable to fetch";
      showToast("Unable to fetch price. Please enter manually.", "error");
    }
  } catch (error) {
    entryInput.placeholder = "Error fetching";
    showToast("Error fetching price. Please enter manually.", "error");
  }
}

// 17. Fetch data for RSI indicator
async function fetchRSIData() {
  const symbol = document.getElementById("rsiSymbol").value;
  const dataTextarea = document.getElementById("rsiData");
  if (!symbol || !dataTextarea) return;

  dataTextarea.placeholder = "Fetching data...";

  try {
    const data = await fetchAlphaVantageData(symbol);
    if (data && data.values && data.values.length > 0) {
      const prices = data.values.slice(0, 30).map((v) => parseFloat(v.close));
      dataTextarea.value = prices.join(",");
      showToast(
        `Fetched ${prices.length} data points for ${symbol}`,
        "success",
      );
    } else {
      dataTextarea.placeholder = "Unable to fetch data";
      showToast("Unable to fetch data. Please enter manually.", "error");
    }
  } catch (error) {
    dataTextarea.placeholder = "Error fetching data";
    showToast("Error fetching data. Please enter manually.", "error");
  }
}

// 18. Fetch data for Volatility calculator
async function fetchVolatilityData() {
  const symbol = document.getElementById("volSymbol").value;
  const dataTextarea = document.getElementById("volData");
  if (!symbol || !dataTextarea) return;

  dataTextarea.placeholder = "Fetching data...";

  try {
    const data = await fetchAlphaVantageData(symbol);
    if (data && data.values && data.values.length > 0) {
      const prices = data.values.slice(0, 30).map((v) => parseFloat(v.close));
      dataTextarea.value = prices.join(",");
      showToast(
        `Fetched ${prices.length} data points for ${symbol}`,
        "success",
      );
    } else {
      dataTextarea.placeholder = "Unable to fetch data";
      showToast("Unable to fetch data. Please enter manually.", "error");
    }
  } catch (error) {
    dataTextarea.placeholder = "Error fetching data";
    showToast("Error fetching data. Please enter manually.", "error");
  }
}

// 19. Fetch data for Moving Average crossover
async function fetchMAData() {
  const symbol = document.getElementById("maSymbol").value;
  const dataTextarea = document.getElementById("maData");
  if (!symbol || !dataTextarea) return;

  dataTextarea.placeholder = "Fetching data...";

  try {
    const data = await fetchAlphaVantageData(symbol);
    if (data && data.values && data.values.length > 0) {
      const prices = data.values.slice(0, 50).map((v) => parseFloat(v.close));
      dataTextarea.value = prices.join(",");
      showToast(
        `Fetched ${prices.length} data points for ${symbol}`,
        "success",
      );
    } else {
      dataTextarea.placeholder = "Unable to fetch data";
      showToast("Unable to fetch data. Please enter manually.", "error");
    }
  } catch (error) {
    dataTextarea.placeholder = "Error fetching data";
    showToast("Error fetching data. Please enter manually.", "error");
  }
}

// 20. Tool opening function
function openTool(toolName) {
  let html = "";

  switch (toolName) {
    case "position-size":
      html = getPositionSizeTool();
      break;
    case "pip-value":
      html = getPipValueTool();
      break;
    case "risk-reward":
      html = getRiskRewardTool();
      break;
    case "currency-converter":
      html = getCurrencyConverterTool();
      break;
    case "profit-loss":
      html = getProfitLossTool();
      break;
    case "rsi-indicator":
      html = getRSITool();
      break;
    case "fibonacci":
      html = getFibonacciTool();
      break;
    case "economic-calendar":
      html = getEconomicCalendarTool();
      break;
    case "volatility":
      html = getVolatilityTool();
      break;
    case "ma-crossover":
      html = getMACrossoverTool();
      break;
    case "lot-size":
      html = getLotSizeTool();
      break;
    case "trading-journal":
      html = getTradingJournalTool();
      break;
    default:
      html = `<div class="tool-content"><h2>Tool Coming Soon</h2><p>This tool is currently under development.</p></div>`;
  }

  openToolModal(html);
}

// 21. Tool Templates
function getPositionSizeTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-calculator" style="color: var(--gold);"></i> Position Size Calculator</h2>
      <p class="tool-description">Calculate the optimal position size based on your risk tolerance and account balance.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Account Balance ($) <span class="required">*</span></label>
          <input type="number" id="psBalance" placeholder="10000" value="10000" />
        </div>
        <div class="form-group">
          <label>Risk Percentage (%) <span class="required">*</span></label>
          <input type="number" id="psRisk" placeholder="2" value="2" step="0.5" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Stop Loss (pips) <span class="required">*</span></label>
          <input type="number" id="psStopLoss" placeholder="50" value="50" />
        </div>
        <div class="form-group">
          <label>Currency Pair</label>
          <select id="psPair">
            <option value="EUR/USD">EUR/USD</option>
            <option value="GBP/USD">GBP/USD</option>
            <option value="USD/JPY">USD/JPY</option>
            <option value="XAU/USD">XAU/USD</option>
            <option value="BTC/USD">BTC/USD</option>
          </select>
        </div>
      </div>

      <button class="btn-primary" onclick="calculatePositionSize()">
        <i class="fas fa-calculator"></i> Calculate Position Size
      </button>

      <div class="tool-result" id="psResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Position Size (Lots)</div>
            <div class="result-value" id="psLots">0.00</div>
          </div>
          <div>
            <div class="result-label">Risk Amount ($)</div>
            <div class="result-value" id="psRiskAmount">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getPipValueTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-dollar-sign" style="color: var(--gold);"></i> Pip Value Calculator</h2>
      <p class="tool-description">Calculate the value of each pip movement for any currency pair and position size.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Currency Pair <span class="required">*</span></label>
          <select id="pvPair">
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="XAUUSD">XAU/USD</option>
            <option value="BTCUSD">BTC/USD</option>
          </select>
        </div>
        <div class="form-group">
          <label>Position Size (lots) <span class="required">*</span></label>
          <input type="number" id="pvLots" placeholder="0.01" value="0.01" step="0.01" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Current Price (Optional - for accuracy)</label>
          <input type="number" id="pvPrice" placeholder="Auto-fetch price" step="0.0001" />
          <button class="btn-secondary" style="padding: 0.3rem 1rem; font-size: 0.75rem; background: transparent;" onclick="fetchCurrentPrice('pvPair', 'pvPrice')">
            <i class="fas fa-sync-alt"></i> Fetch Live Price
          </button>
        </div>
      </div>

      <button class="btn-primary" onclick="calculatePipValue()">
        <i class="fas fa-calculator"></i> Calculate Pip Value
      </button>

      <div class="tool-result" id="pvResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Pip Value</div>
            <div class="result-value" id="pvValue">$0.00</div>
          </div>
          <div>
            <div class="result-label">For 10 Pips</div>
            <div class="result-value" id="pvTenPips">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getRiskRewardTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-balance-scale" style="color: var(--gold);"></i> Risk/Reward Calculator</h2>
      <p class="tool-description">Calculate your risk-to-reward ratio before entering any trade.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Entry Price <span class="required">*</span></label>
          <input type="number" id="rrEntry" placeholder="1.2000" value="1.2000" step="0.0001" />
          <button class="btn-secondary" style="padding: 0.3rem 1rem; font-size: 0.75rem; background: transparent; margin-top: 0.3rem;" onclick="fetchCurrentPriceForRR()">
            <i class="fas fa-sync-alt"></i> Fetch Live Price
          </button>
        </div>
        <div class="form-group">
          <label>Stop Loss <span class="required">*</span></label>
          <input type="number" id="rrStopLoss" placeholder="1.1950" value="1.1950" step="0.0001" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Take Profit <span class="required">*</span></label>
          <input type="number" id="rrTakeProfit" placeholder="1.2100" value="1.2100" step="0.0001" />
        </div>
        <div class="form-group">
          <label>Position Type</label>
          <select id="rrType">
            <option value="long">Long (Buy)</option>
            <option value="short">Short (Sell)</option>
          </select>
        </div>
      </div>

      <button class="btn-primary" onclick="calculateRiskReward()">
        <i class="fas fa-balance-scale"></i> Calculate Ratio
      </button>

      <div class="tool-result" id="rrResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Risk (pips)</div>
            <div class="result-value" id="rrRisk">0</div>
          </div>
          <div>
            <div class="result-label">Reward (pips)</div>
            <div class="result-value" id="rrReward">0</div>
          </div>
          <div>
            <div class="result-label">Risk/Reward Ratio</div>
            <div class="result-value highlight" id="rrRatio">1:0</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getCurrencyConverterTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-exchange-alt" style="color: var(--gold);"></i> Currency Converter</h2>
      <p class="tool-description">Convert between different currencies with <strong>real-time exchange rates</strong>.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Amount <span class="required">*</span></label>
          <input type="number" id="ccAmount" placeholder="100" value="100" />
        </div>
        <div class="form-group">
          <label>From <span class="required">*</span></label>
          <select id="ccFrom" onchange="updateCurrencyRate()">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="GHS">GHS - Ghana Cedi</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            <option value="ZAR">ZAR - South African Rand</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>To <span class="required">*</span></label>
          <select id="ccTo" onchange="updateCurrencyRate()">
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="GHS" selected>GHS - Ghana Cedi</option>
            <option value="NGN">NGN - Nigerian Naira</option>
            <option value="ZAR">ZAR - South African Rand</option>
            <option value="JPY">JPY - Japanese Yen</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="CHF">CHF - Swiss Franc</option>
          </select>
        </div>
        <div class="form-group">
          <label>Exchange Rate (Live)</label>
          <input type="number" id="ccRate" placeholder="Loading..." step="0.0001" readonly />
          <button class="btn-secondary" style="padding: 0.3rem 1rem; font-size: 0.75rem; background: transparent; margin-top: 0.3rem;" onclick="updateCurrencyRate()">
            <i class="fas fa-sync-alt"></i> Refresh Rate
          </button>
        </div>
      </div>

      <button class="btn-primary" onclick="convertCurrency()">
        <i class="fas fa-exchange-alt"></i> Convert
      </button>

      <div class="tool-result" id="ccResult">
        <div>
          <div class="result-label">Converted Amount</div>
          <div class="result-value" id="ccConverted">0.00</div>
          <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);" id="ccRateDisplay">Rate: 1 USD = 0.00 GHS</div>
        </div>
      </div>
    </div>
  `;
}

function getProfitLossTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-chart-bar" style="color: var(--gold);"></i> Profit/Loss Calculator</h2>
      <p class="tool-description">Calculate potential profit or loss for any trade before execution.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Entry Price <span class="required">*</span></label>
          <input type="number" id="plEntry" placeholder="1.2000" value="1.2000" step="0.0001" />
        </div>
        <div class="form-group">
          <label>Exit Price <span class="required">*</span></label>
          <input type="number" id="plExit" placeholder="1.2100" value="1.2100" step="0.0001" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Position Size (lots) <span class="required">*</span></label>
          <input type="number" id="plLots" placeholder="0.01" value="0.01" step="0.01" />
        </div>
        <div class="form-group">
          <label>Position Type</label>
          <select id="plType">
            <option value="long">Long (Buy)</option>
            <option value="short">Short (Sell)</option>
          </select>
        </div>
      </div>

      <button class="btn-primary" onclick="calculateProfitLoss()">
        <i class="fas fa-calculator"></i> Calculate
      </button>

      <div class="tool-result" id="plResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Pip Difference</div>
            <div class="result-value" id="plPips">0</div>
          </div>
          <div>
            <div class="result-label">Profit / Loss</div>
            <div class="result-value" id="plAmount">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getRSITool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-signal" style="color: var(--gold);"></i> RSI Indicator</h2>
      <p class="tool-description">Monitor overbought and oversold conditions with the Relative Strength Index.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Symbol <span class="required">*</span></label>
          <select id="rsiSymbol">
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="XAUUSD">XAU/USD</option>
            <option value="BTCUSD">BTC/USD</option>
          </select>
          <button class="btn-secondary" style="padding: 0.3rem 1rem; font-size: 0.75rem; background: transparent; margin-top: 0.3rem;" onclick="fetchRSIData()">
            <i class="fas fa-sync-alt"></i> Fetch Live Data
          </button>
        </div>
        <div class="form-group">
          <label>Period <span class="required">*</span></label>
          <input type="number" id="rsiPeriod" placeholder="14" value="14" />
        </div>
      </div>
      <div class="form-group">
        <label>Price Data (or click fetch above)</label>
        <textarea id="rsiData" rows="3" placeholder="Enter price data separated by commas or fetch live data">100,102,101,103,105,104,106,108,107,110,112,111,113,115,114,116,118,117,119,120</textarea>
      </div>

      <button class="btn-primary" onclick="calculateRSI()">
        <i class="fas fa-calculator"></i> Calculate RSI
      </button>

      <div class="tool-result" id="rsiResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Current RSI</div>
            <div class="result-value" id="rsiValue">0.00</div>
          </div>
          <div>
            <div class="result-label">Signal</div>
            <div class="result-value" id="rsiSignal" style="font-size: 1.2rem;">Neutral</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getFibonacciTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-chart-pie" style="color: var(--gold);"></i> Fibonacci Retracement</h2>
      <p class="tool-description">Identify potential support and resistance levels using Fibonacci ratios.</p>

      <div class="form-row">
        <div class="form-group">
          <label>High Price <span class="required">*</span></label>
          <input type="number" id="fibHigh" placeholder="1.2500" value="1.2500" step="0.0001" />
        </div>
        <div class="form-group">
          <label>Low Price <span class="required">*</span></label>
          <input type="number" id="fibLow" placeholder="1.1500" value="1.1500" step="0.0001" />
        </div>
      </div>

      <button class="btn-primary" onclick="calculateFibonacci()">
        <i class="fas fa-calculator"></i> Calculate Levels
      </button>

      <div class="tool-result" id="fibResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
          <div><div class="result-label">23.6%</div><div class="result-value" id="fib236">0.0000</div></div>
          <div><div class="result-label">38.2%</div><div class="result-value" id="fib382">0.0000</div></div>
          <div><div class="result-label">50.0%</div><div class="result-value" id="fib500">0.0000</div></div>
          <div><div class="result-label">61.8%</div><div class="result-value" id="fib618">0.0000</div></div>
          <div><div class="result-label">78.6%</div><div class="result-value" id="fib786">0.0000</div></div>
          <div><div class="result-label">100.0%</div><div class="result-value" id="fib100">0.0000</div></div>
        </div>
      </div>
    </div>
  `;
}

function getEconomicCalendarTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-calendar-alt" style="color: var(--gold);"></i> Economic Calendar</h2>
      <p class="tool-description">Stay updated with upcoming economic events and news releases. <strong>Data updates automatically.</strong></p>

      <div style="margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
        <div class="form-group" style="flex: 1;">
          <label>Filter by Currency</label>
          <select id="ecFilter">
            <option value="all">All Currencies</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="NZD">NZD</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
        <button class="btn-secondary" style="padding: 0.5rem 1.5rem; background: transparent; margin-top: 0.5rem;" onclick="loadEconomicCalendar()">
          <i class="fas fa-sync-alt"></i> Refresh Data
        </button>
      </div>

      <div class="tool-result" id="ecResult">
        <div style="max-height: 400px; overflow-y: auto;">
          <div id="ecEvents">
            <p style="color: var(--text-muted); text-align: center; padding: 1rem;">
              <i class="fas fa-spinner fa-spin"></i> Loading economic events...
            </p>
          </div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.7rem; color: var(--text-muted); text-align: center;">
          Data sourced from ForexFactory
        </div>
      </div>
    </div>
  `;
}

function getVolatilityTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-wave-square" style="color: var(--gold);"></i> Volatility Calculator</h2>
      <p class="tool-description">Measure market volatility to adjust your trading strategy accordingly.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Symbol <span class="required">*</span></label>
          <select id="volSymbol">
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="XAUUSD">XAU/USD</option>
            <option value="BTCUSD">BTC/USD</option>
          </select>
          <button class="btn-secondary" style="padding: 0.3rem 1rem; font-size: 0.75rem; background: transparent; margin-top: 0.3rem;" onclick="fetchVolatilityData()">
            <i class="fas fa-sync-alt"></i> Fetch Live Data
          </button>
        </div>
        <div class="form-group">
          <label>Period <span class="required">*</span></label>
          <input type="number" id="volPeriod" placeholder="14" value="14" />
        </div>
      </div>
      <div class="form-group">
        <label>Price Data (or click fetch above)</label>
        <textarea id="volData" rows="3" placeholder="Enter price data separated by commas or fetch live data">100,102,101,103,105,104,106,108,107,110,112,111,113,115,114,116,118,117,119,120</textarea>
      </div>

      <button class="btn-primary" onclick="calculateVolatility()">
        <i class="fas fa-calculator"></i> Calculate Volatility
      </button>

      <div class="tool-result" id="volResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Standard Deviation</div>
            <div class="result-value" id="volStdDev">0.00</div>
          </div>
          <div>
            <div class="result-label">Average True Range</div>
            <div class="result-value" id="volATR">0.00</div>
          </div>
          <div>
            <div class="result-label">Volatility Level</div>
            <div class="result-value" id="volLevel" style="font-size: 1.2rem;">Low</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getMACrossoverTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-line-chart" style="color: var(--gold);"></i> Moving Average Crossover</h2>
      <p class="tool-description">Identify trend reversals with moving average crossover signals.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Symbol <span class="required">*</span></label>
          <select id="maSymbol">
            <option value="EURUSD">EUR/USD</option>
            <option value="GBPUSD">GBP/USD</option>
            <option value="USDJPY">USD/JPY</option>
            <option value="XAUUSD">XAU/USD</option>
            <option value="BTCUSD">BTC/USD</option>
          </select>
          <button class="btn-secondary" style="padding: 0.3rem 1rem; font-size: 0.75rem; background: transparent; margin-top: 0.3rem;" onclick="fetchMAData()">
            <i class="fas fa-sync-alt"></i> Fetch Live Data
          </button>
        </div>
        <div class="form-group">
          <label>Fast MA Period <span class="required">*</span></label>
          <input type="number" id="maFast" placeholder="10" value="10" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Slow MA Period <span class="required">*</span></label>
          <input type="number" id="maSlow" placeholder="30" value="30" />
        </div>
      </div>
      <div class="form-group">
        <label>Price Data (or click fetch above)</label>
        <textarea id="maData" rows="3" placeholder="Enter price data separated by commas or fetch live data">100,102,101,103,105,104,106,108,107,110,112,111,113,115,114,116,118,117,119,120</textarea>
      </div>

      <button class="btn-primary" onclick="calculateMACrossover()">
        <i class="fas fa-calculator"></i> Analyze Crossover
      </button>

      <div class="tool-result" id="maResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Fast MA</div>
            <div class="result-value" id="maFastValue">0.00</div>
          </div>
          <div>
            <div class="result-label">Slow MA</div>
            <div class="result-value" id="maSlowValue">0.00</div>
          </div>
        </div>
        <div style="margin-top: 0.75rem; text-align: center;">
          <div class="result-label">Signal</div>
          <div class="result-value" id="maSignal" style="font-size: 1.2rem;">Waiting for data...</div>
        </div>
      </div>
    </div>
  `;
}

function getLotSizeTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-balance-scale" style="color: var(--gold);"></i> Lot Size Calculator</h2>
      <p class="tool-description">Determine the appropriate lot size for your trades based on risk parameters.</p>

      <div class="form-row">
        <div class="form-group">
          <label>Account Balance ($) <span class="required">*</span></label>
          <input type="number" id="lsBalance" placeholder="10000" value="10000" />
        </div>
        <div class="form-group">
          <label>Risk per Trade (%) <span class="required">*</span></label>
          <input type="number" id="lsRiskPercent" placeholder="2" value="2" step="0.5" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Stop Loss (pips) <span class="required">*</span></label>
          <input type="number" id="lsStopLoss" placeholder="50" value="50" />
        </div>
        <div class="form-group">
          <label>Pip Value ($) <span class="required">*</span></label>
          <input type="number" id="lsPipValue" placeholder="10" value="10" step="0.1" />
        </div>
      </div>

      <button class="btn-primary" onclick="calculateLotSize()">
        <i class="fas fa-calculator"></i> Calculate Lot Size
      </button>

      <div class="tool-result" id="lsResult">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <div class="result-label">Lot Size</div>
            <div class="result-value" id="lsLots">0.00</div>
          </div>
          <div>
            <div class="result-label">Risk Amount ($)</div>
            <div class="result-value" id="lsRiskAmount">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getTradingJournalTool() {
  return `
    <div class="tool-content">
      <h2><i class="fas fa-book" style="color: var(--gold);"></i> Trading Journal</h2>
      <p class="tool-description">Track your trades, analyze performance, and improve your strategy.</p>

      <div style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
        <button class="btn-primary" onclick="addJournalEntry()" style="flex: 1;">
          <i class="fas fa-plus"></i> Add Entry
        </button>
        <button class="btn-secondary" onclick="exportJournal()" style="flex: 1; background: transparent;">
          <i class="fas fa-download"></i> Export Data
        </button>
      </div>

      <div id="journalEntries" style="max-height: 400px; overflow-y: auto;">
        <p style="color: var(--text-muted); text-align: center; padding: 2rem;">
          No journal entries yet. Click "Add Entry" to get started.
        </p>
      </div>

      <div id="journalForm" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--glass-bg); border-radius: 16px;">
        <div class="form-row">
          <div class="form-group">
            <label>Symbol <span class="required">*</span></label>
            <input type="text" id="jSymbol" placeholder="EUR/USD" />
          </div>
          <div class="form-group">
            <label>Position <span class="required">*</span></label>
            <select id="jPosition">
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Entry Price <span class="required">*</span></label>
            <input type="number" id="jEntry" placeholder="1.2000" step="0.0001" />
          </div>
          <div class="form-group">
            <label>Exit Price <span class="required">*</span></label>
            <input type="number" id="jExit" placeholder="1.2100" step="0.0001" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Lot Size <span class="required">*</span></label>
            <input type="number" id="jLots" placeholder="0.01" step="0.01" />
          </div>
          <div class="form-group">
            <label>Result <span class="required">*</span></label>
            <select id="jResult">
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="breakeven">Breakeven</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="jNotes" rows="2" placeholder="What did you learn from this trade?"></textarea>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
          <button class="btn-primary" onclick="saveJournalEntry()" style="flex: 1;">
            <i class="fas fa-save"></i> Save Entry
          </button>
          <button class="btn-secondary" onclick="cancelJournalEntry()" style="flex: 1; background: transparent;">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `;
}

// 22. Modal Functions
function openToolModal(html) {
  const modalBody = document.getElementById("toolModalBody");
  const toolModal = document.getElementById("toolModal");

  if (modalBody && toolModal) {
    modalBody.innerHTML = html;
    toolModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Initialize tool after modal opens
    setTimeout(() => {
      initializeTool();
    }, 100);
  }
}

function closeToolModal() {
  const toolModal = document.getElementById("toolModal");
  if (toolModal) {
    toolModal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

function initializeTool() {
  // Auto-load currency rate if on currency converter
  if (document.getElementById("ccFrom") && document.getElementById("ccTo")) {
    setTimeout(updateCurrencyRate, 500);
  }

  // Auto-load economic calendar if on that tool
  if (document.getElementById("ecEvents")) {
    setTimeout(loadEconomicCalendar, 500);
  }

  // Render journal entries if on journal tool
  if (document.getElementById("journalEntries")) {
    renderJournal();
  }
}

// 23. Toast Notifications
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
// DOM CONTENT LOADED - Event Listeners
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
      const href = this.getAttribute("href");

      if (href && href !== "#" && href !== "") {
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
  // TOOL CATEGORY FILTER
  // ====================================
  const categoryButtons = document.querySelectorAll(".category-btn");
  const toolCards = document.querySelectorAll(".tool-card");

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      categoryButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const category = this.dataset.category;

      toolCards.forEach((card) => {
        if (category === "all" || card.dataset.category === category) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // ====================================
  // TOOL MODAL CLOSE EVENTS
  // ====================================
  const modalClose = document.getElementById("toolModalClose");
  const toolModal = document.getElementById("toolModal");

  modalClose?.addEventListener("click", closeToolModal);

  toolModal?.addEventListener("click", function (e) {
    if (e.target === this) closeToolModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && toolModal?.classList.contains("active")) {
      closeToolModal();
    }
  });

  console.log("✅ Trading Tools page initialized with API support");
});
