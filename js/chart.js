// Equity chart for performance preview
document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("equityChart")?.getContext("2d");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
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
            label: "Equity Growth",
            data: [
              10000, 11200, 12800, 14100, 15900, 17200, 19800, 21500, 24200,
              26800, 29100, 31000,
            ],
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
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                return `$${context.raw.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#ffffff",
            },
          },
          y: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "#ffffff",
              callback: function (value) {
                return "$" + value.toLocaleString();
              },
            },
          },
        },
      },
    });
  }
});
