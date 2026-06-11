const ctx = document.getElementById("equityChart");

new Chart(ctx, {
  type: "line",

  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],

    datasets: [
      {
        label: "Account Growth",

        data: [1000, 1250, 1500, 1800, 2400, 3100],

        borderColor: "#00ff88",

        backgroundColor: "rgba(0,255,136,.08)",

        fill: true,

        tension: 0.4,
      },
    ],
  },

  options: {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
    },
  },
});
