// Equity Curve Chart
const equityCtx = document.getElementById("equityCurveChart")?.getContext("2d");
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
        "Week 9",
        "Week 10",
        "Week 11",
        "Week 12",
      ],
      datasets: [
        {
          label: "Account Balance ($)",
          data: [
            10000, 11200, 12800, 14100, 15900, 17200, 19800, 21500, 24200,
            26800, 29100, 31000,
          ],
          borderColor: "#00ff88",
          backgroundColor: "rgba(0, 255, 136, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "#fff" } },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff" },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff", callback: (v) => "$" + v.toLocaleString() },
        },
      },
    },
  });
}

// Monthly Returns Chart
const monthlyCtx = document
  .getElementById("monthlyReturnsChart")
  ?.getContext("2d");
if (monthlyCtx) {
  new Chart(monthlyCtx, {
    type: "bar",
    data: {
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
      datasets: [
        {
          label: "Monthly Return (%)",
          data: [5.2, 8.1, 12.3, 6.8, 9.5, 7.2, 11.4, 8.9, 4.2, 10.1, 7.8, 9.3],
          backgroundColor: "#00ff88",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "#fff" } },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff" },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff", callback: (v) => v + "%" },
        },
      },
    },
  });
}

// Win/Loss Chart
const winLossCtx = document.getElementById("winLossChart")?.getContext("2d");
if (winLossCtx) {
  new Chart(winLossCtx, {
    type: "doughnut",
    data: {
      labels: ["Winning Trades (85.7%)", "Losing Trades (14.3%)"],
      datasets: [
        {
          data: [85.7, 14.3],
          backgroundColor: ["#00ff88", "#ff4d4d"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: "bottom", labels: { color: "#fff" } },
      },
    },
  });
}

// Copy Performance Chart
const copyCtx = document
  .getElementById("copyPerformanceChart")
  ?.getContext("2d");
if (copyCtx) {
  new Chart(copyCtx, {
    type: "line",
    data: {
      labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
      datasets: [
        {
          label: "Copy Trading Portfolio",
          data: [10000, 11200, 12800, 14100, 15900, 17500],
          borderColor: "#f5b700",
          backgroundColor: "rgba(245, 183, 0, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Benchmark (S&P 500)",
          data: [10000, 10200, 10500, 10800, 11000, 11200],
          borderColor: "#00c896",
          backgroundColor: "rgba(0, 200, 150, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "#fff" } },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff" },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.1)" },
          ticks: { color: "#fff", callback: (v) => "$" + v.toLocaleString() },
        },
      },
    },
  });
}
