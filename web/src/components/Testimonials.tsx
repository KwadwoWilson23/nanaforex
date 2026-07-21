import Reveal from "./Reveal";

const TESTIMONIALS = [
  {
    initials: "KA",
    name: "Kwame A.",
    role: "Funded Trader · Kumasi",
    quote:
      "Coming from zero trading experience, the 12-week mentorship gave me a real framework. I passed my first funded challenge four months after starting.",
  },
  {
    initials: "SM",
    name: "Sarah M.",
    role: "Mentorship Student · Accra",
    quote:
      "The mentorship gave me structure and discipline. The weekly live sessions with Emmanuel were the difference — you can ask real questions and get real answers.",
  },
  {
    initials: "DK",
    name: "Daniel K.",
    role: "Copy Trading Client · Takoradi",
    quote:
      "I don't have time to sit in front of charts, so copy trading through HFM was the right fit. Steady monthly growth without me watching the market.",
  },
];

export default function Testimonials() {
  return (
    <section className="px-4 md:px-16 py-24">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-12">
            <span className="section-eyebrow">Success Stories</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-3">
              Real traders. <span className="gold-text">Real results.</span>
            </h2>
            <p className="text-white/55 max-w-xl mx-auto">
              Sample results from Nana Forex students and copy-trading clients.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <article className="h-full rounded-3xl border border-white/5 bg-white/[0.04] p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-elevated">
                <i className="fas fa-quote-left text-2xl text-gold/60" />
                <p className="text-white/85 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-auto pt-5 border-t border-white/5 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full grid place-items-center bg-gradient-primary text-dark font-black text-sm">
                    {t.initials}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-white text-sm">{t.name}</strong>
                    <span className="text-xs text-white/50">{t.role}</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
