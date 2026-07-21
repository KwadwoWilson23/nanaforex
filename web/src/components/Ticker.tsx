"use client";

const ITEMS = [
  { label: "EUR/USD ▲ +1.43%", up: true },
  { label: "GBP/USD ▲ +0.86%", up: true },
  { label: "XAU/USD ▲ +2.11%", up: true },
  { label: "BTC/USD ▲ +4.58%", up: true },
  { label: "USD/JPY ▼ -0.38%", up: false },
  { label: "NAS100 ▲ +1.75%", up: true },
];

export default function Ticker() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <section className="border-y border-white/5 bg-black/30 overflow-hidden">
      <div className="flex gap-10 py-3 whitespace-nowrap animate-[ticker_30s_linear_infinite] hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-2 text-sm font-medium ${
              item.up ? "text-white" : "text-danger"
            }`}
          >
            <i
              className={`fa-solid ${
                item.up ? "fa-arrow-trend-up text-profit-green" : "fa-arrow-trend-down"
              }`}
            />
            {item.label}
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
