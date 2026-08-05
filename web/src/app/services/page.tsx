import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Forex Mentorship, Copy Trading, Funded Trader Program and Premium Market Analysis — everything you need to trade with confidence and consistency.",
};

const SERVICES = [
  {
    id: "mentorship",
    icon: "fas fa-graduation-cap",
    title: "Forex Mentorship Program",
    body: "Our flagship program takes you from complete beginner to consistently profitable trader. Includes live sessions, recorded modules, trade reviews, and direct mentor access.",
    bullets: [
      "12 weeks structured curriculum",
      "Weekly live trading sessions",
      "Personal trade journal review",
      "Lifetime access to community",
    ],
    cta: "Enroll Now",
  },
  {
    id: "copy-trading",
    icon: "fas fa-copy",
    title: "Copy Trading",
    body: "Mirror professional trades automatically through your own broker account. No experience required — just connect your account and watch your portfolio grow.",
    bullets: [
      "Minimum investment: $500",
      "Verified copy performance via your broker",
      "Full risk-management controls",
      "Withdraw anytime — you own the account",
    ],
    cta: "Start Copy Trading",
  },
  {
    id: "funded-account",
    icon: "fas fa-wallet",
    title: "Funded Trader Program",
    body: "Trade with firm capital up to $200,000. Pass our evaluation phase and earn up to 90% profit split. No personal risk to your capital.",
    bullets: [
      "Challenge fee: GHS 1,000+",
      "Profit splits: 80% – 90%",
      "Daily drawdown: 5%",
      "Unlimited trading period",
    ],
    cta: "Apply Now",
  },
  {
    id: "market-analysis",
    icon: "fas fa-chart-pie",
    title: "Premium Market Analysis",
    body: "Daily professional trade setups delivered to your inbox. Includes technical levels, economic calendar highlights, and actionable trade ideas.",
    bullets: [
      "3–5 high-probability setups daily",
      "Weekly market outlook",
      "Live news trading alerts",
      "Telegram instant notifications",
    ],
    cta: "Subscribe",
  },
];

const PRICING = [
  {
    name: "Basic Mentorship",
    price: "GHS 1,500",
    period: "one-time",
    features: [
      "12-week structured curriculum",
      "Weekly live sessions",
      "Telegram community access",
      "Trade journal template",
    ],
    highlight: false,
    cta: "Enroll",
  },
  {
    name: "Premium Mentorship",
    price: "GHS 3,500",
    period: "one-time",
    features: [
      "Everything in Basic",
      "1-on-1 mentor calls (monthly)",
      "Personal trade reviews",
      "Priority support",
      "Funded challenge coaching",
    ],
    highlight: true,
    cta: "Get Started",
  },
  {
    name: "Copy Trading",
    price: "$500",
    period: "minimum deposit",
    features: [
      "Verified copy trader",
      "Full account control",
      "Real-time performance dashboard",
      "Cancel anytime",
    ],
    highlight: false,
    cta: "Connect Account",
  },
];

export default function ServicesPage() {
  return (
    <PageShell
      header={
        <PageHero
          eyebrow="Our Services"
          title={<>Comprehensive <span className="gold-text">Trading Solutions</span></>}
        >
          Everything you need to trade with confidence and consistency.
        </PageHero>
      }
    >
      {/* Main services (with anchor targets used by the footer links) */}
      <section className="px-4 md:px-16 pb-16">
        <div className="max-w-5xl mx-auto space-y-5">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.05}>
              <article
                id={s.id}
                className="group scroll-mt-28 rounded-3xl border border-white/6 bg-white/[0.04] p-8 md:p-10 transition-all duration-300 hover:border-secondary/30 hover:shadow-elevated"
              >
                <i
                  className={`${s.icon} text-4xl text-gold mb-4 inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110`}
                />
                <h2 className="font-display font-extrabold text-2xl md:text-3xl mb-3">
                  {s.title}
                </h2>
                <p className="text-white/70 max-w-3xl mb-6">{s.body}</p>
                <ul className="grid gap-2 sm:grid-cols-2 mb-6 max-w-2xl">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-white/85">
                      <i className="fas fa-check-circle text-profit-green" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="btn-primary">
                  {s.cta} <i className="fas fa-arrow-right ml-1 text-xs" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 md:px-16 py-20 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="section-eyebrow">Pricing</span>
              <h2 className="font-display font-extrabold text-2xl md:text-4xl">
                Simple, <span className="gold-text">transparent</span> pricing
              </h2>
              <p className="text-white/60 mt-3">No hidden fees. No surprises.</p>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {PRICING.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div
                  className={`h-full rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-2 ${
                    p.highlight
                      ? "border-gold/50 bg-gradient-to-br from-gold/10 to-secondary/5 shadow-gold-glow"
                      : "border-white/8 bg-white/[0.04]"
                  }`}
                >
                  {p.highlight && (
                    <span className="inline-block mb-3 text-xs uppercase tracking-wider font-bold text-gold px-2.5 py-1 rounded-full bg-gold/12 border border-gold/40">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-display font-bold text-xl mb-2">{p.name}</h3>
                  <div className="mb-6">
                    <span className="font-display font-black text-4xl gold-text">
                      {p.price}
                    </span>
                    <span className="ml-2 text-sm text-white/50">/{p.period}</span>
                  </div>
                  <ul className="mb-8 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/80">
                        <i className="fas fa-check text-profit-green mt-1 text-xs" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/contact" className={p.highlight ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}>
                    {p.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-16 py-20 text-center">
        <Reveal>
          <h2 className="font-display font-extrabold text-2xl md:text-4xl mb-4">
            Ready to <span className="gold-text">transform</span> your trading?
          </h2>
          <p className="text-white/65 max-w-xl mx-auto mb-8">
            Talk to the team, or hop into the free Telegram to see the community in action.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contact" className="btn-primary">
              <i className="fas fa-paper-plane" /> Contact Us
            </Link>
            <a
              href="https://t.me/learnforexforfreegh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <i className="fab fa-telegram" /> Join Telegram
            </a>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
