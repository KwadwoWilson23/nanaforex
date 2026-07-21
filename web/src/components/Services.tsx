import Reveal from "./Reveal";

const SERVICES = [
  {
    icon: "fas fa-graduation-cap",
    title: "Forex Mentorship",
    body: "Beginner to advanced training, live sessions & risk management. Learn everything from market fundamentals and technical analysis to advanced price action and trading psychology.",
  },
  {
    icon: "fas fa-copy",
    title: "Copy Trading",
    body: "HFM Copy Trading, verified performance and monthly reports. Connect your account and automatically mirror professionally managed trades.",
  },
  {
    icon: "fas fa-wallet",
    title: "Funded Trader Program",
    body: "Funding from GHS 1,000+ with attractive profit splits. Follow a structured growth plan, demonstrate consistency, and earn while trading larger capital.",
  },
  {
    icon: "fas fa-chart-pie",
    title: "Market Analysis",
    body: "Daily signals, weekly outlooks and professional trade setups. Receive daily market analysis and high-probability trade ideas.",
  },
];

export default function Services() {
  return (
    <section className="px-4 md:px-16 py-24">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-3">
              Our Services
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Everything you need to become a consistently profitable trader.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08} direction="up">
              <div className="group rounded-2xl border border-white/5 bg-white/[0.04] p-8 h-full transition-all duration-300 hover:-translate-y-2 hover:border-secondary/30 hover:shadow-elevated">
                <i
                  className={`${s.icon} text-4xl text-gold mb-4 inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110`}
                />
                <h3 className="font-display font-bold text-xl mb-2.5">
                  {s.title}
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
