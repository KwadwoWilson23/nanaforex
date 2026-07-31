import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of Nana Forex — an Accra-based trading education home founded by Emmanuel Tuffour to give Ghanaian traders a real, structured path to consistent profitability.",
};

const VALUES = [
  {
    icon: "fas fa-compass",
    title: "Structure over hype",
    body: "No get-rich-quick promises. A 12-week curriculum, weekly live sessions, verifiable process.",
  },
  {
    icon: "fas fa-shield-halved",
    title: "Risk-first thinking",
    body: "Position sizing, drawdown control, and psychology come before entries and exits.",
  },
  {
    icon: "fas fa-people-arrows",
    title: "Real community",
    body: "A Telegram community, WhatsApp support, and Ghana-based mentors you can reach.",
  },
  {
    icon: "fas fa-chart-line",
    title: "Verified performance",
    body: "Copy trading through HFM. Live-tracked competitions. No cherry-picked screenshots.",
  },
];

const MILESTONES = [
  { year: "2020", body: "Nana Forex launched in Accra with a handful of one-on-one students." },
  { year: "2022", body: "Copy trading rolled out via HFM partnership, first funded students placed." },
  { year: "2024", body: "12-week structured mentorship formalized. Weekly live sessions begin." },
  { year: "2026", body: "Public leaderboard, live trading competitions, funded accounts up to $200K." },
];

export default function AboutPage() {
  return (
    <PageShell
      header={
        <PageHero
          eyebrow="About Nana Forex"
          title={<>Built in Ghana. Built for <span className="gold-text">serious traders</span>.</>}
        >
          A forex education home founded by Emmanuel Tuffour to give beginners
          a real, structured path to consistent profitability — without the noise.
        </PageHero>
      }
    >
      {/* Founder story */}
      <section className="px-4 md:px-16 pb-20">
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[minmax(260px,380px)_1fr] items-center">
          <Reveal direction="left">
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-gold/25 shadow-elevated bg-gradient-to-br from-gold/15 to-secondary/10">
              <Image
                src="/images/image1(4).jpeg"
                alt="Emmanuel Tuffour"
                fill
                sizes="(max-width: 820px) 100vw, 380px"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal direction="right">
            <div>
              <span className="section-eyebrow">The Story</span>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-4">
                From self-taught trader to Ghana&apos;s most structured mentorship.
              </h2>
              <p className="text-white/70 mb-4">
                Emmanuel Tuffour started trading forex in his early twenties,
                self-taught, from a laptop in Accra. Blowing accounts, learning
                the hard way, and eventually finding the discipline that
                separates consistent traders from everyone else.
              </p>
              <p className="text-white/70 mb-4">
                In 2020 he began mentoring a handful of one-on-one students.
                What started as WhatsApp voice notes turned into a 12-week
                structured curriculum, weekly live sessions, and hundreds of
                Ghanaian traders working through the program.
              </p>
              <p className="text-white/70">
                Nana Forex today: mentorship, copy trading, funded accounts, and
                a public leaderboard where the best students compete for real
                prizes. All backed by verified partnerships with HFM and Exness.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 md:px-16 py-20 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="section-eyebrow">What we stand for</span>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl">
                Four principles, <span className="gold-text">no exceptions</span>.
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-white/5 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25">
                  <i className={`${v.icon} text-2xl text-gold mb-4 block`} />
                  <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-white/65 leading-relaxed">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-4 md:px-16 py-20">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <span className="section-eyebrow">The Journey</span>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl">
                Milestones since <span className="gold-text">2020</span>
              </h2>
            </div>
          </Reveal>
          <div className="relative">
            <div
              aria-hidden
              className="absolute left-6 md:left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-gold/40 via-secondary/40 to-transparent -translate-x-1/2"
            />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <Reveal key={m.year} delay={i * 0.05}>
                  <div className={`relative pl-16 md:pl-0 md:grid md:grid-cols-2 md:gap-10 md:items-center ${i % 2 === 1 ? "md:[&>*:nth-child(1)]:order-2" : ""}`}>
                    <div className={`${i % 2 === 0 ? "md:text-right md:pr-10" : "md:pl-10"}`}>
                      <div className="inline-flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl gold-text">
                          {m.year}
                        </span>
                      </div>
                      <p className="text-white/75 mt-1">{m.body}</p>
                    </div>
                    <div className="hidden md:block" />
                    <div
                      aria-hidden
                      className="absolute left-6 md:left-1/2 top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-gradient-primary ring-4 ring-bg-dark"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-16 py-20 text-center">
        <Reveal>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl mb-4">
            Curious? <span className="gold-text">Start free.</span>
          </h2>
          <p className="text-white/65 max-w-xl mx-auto mb-8">
            Join the Telegram community to see how we work, or reach out to
            the team directly.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://t.me/learnforexforfreegh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <i className="fab fa-telegram" /> Join Telegram
            </a>
            <Link href="/contact" className="btn-secondary">
              Talk to the Team
            </Link>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
