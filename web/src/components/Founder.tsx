import Image from "next/image";
import Reveal from "./Reveal";

const FEATURED = [
  { src: "/images/image1(5).jpeg", caption: "Industry Recognition" },
  { src: "/images/image1(10).jpeg", caption: "Broker Partner Visit" },
  { src: "/images/image1(6).jpeg", caption: "Partner Summit" },
  { src: "/images/image1(1).jpeg", caption: "Trading Gala Night" },
];

export default function Founder() {
  return (
    <section className="px-4 md:px-16 py-24">
      <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-[minmax(260px,380px)_1fr] items-center">
        <Reveal direction="left">
          <div className="relative aspect-square">
            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-gold/25 shadow-[0_30px_60px_rgba(0,0,0,0.5)] bg-gradient-to-br from-gold/15 to-secondary/10">
              <Image
                src="/images/image1(4).jpeg"
                alt="Emmanuel Tuffour — Founder of Nana Forex"
                fill
                className="object-cover"
                sizes="(max-width: 820px) 100vw, 380px"
              />
            </div>
            <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/85 backdrop-blur border border-gold/50 text-gold font-bold text-xs shadow-lg">
              <i className="fas fa-check-circle" /> Verified Educator · Since 2020
            </span>
          </div>
        </Reveal>

        <Reveal direction="right">
          <div>
            <span className="section-eyebrow">Meet the Founder</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-2">
              Emmanuel Tuffour
            </h2>
            <p className="text-gold font-semibold mb-5">
              Professional Trader &amp; Mentor · Accra, Ghana
            </p>
            <p className="text-white/70 mb-8 max-w-xl">
              After years trading his own live accounts and mentoring hundreds
              of Ghanaian traders, Emmanuel built Nana Forex to give beginners
              a real, structured path to consistent profitability — without
              the noise of trading gurus.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-xl">
              {[
                { top: "12 Weeks", bottom: "Structured curriculum" },
                { top: "HFM Partner", bottom: "Verified copy trader" },
                { top: "Live Weekly", bottom: "Mentorship sessions" },
              ].map((s) => (
                <div
                  key={s.top}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <strong className="block text-white text-base">
                    {s.top}
                  </strong>
                  <span className="block text-[10px] uppercase tracking-wider text-white/45 mt-1">
                    {s.bottom}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <a
                href="https://www.instagram.com/tuffourofficial?igsh=MWVieXhibXM1dDc2ZA%3D%3D&utm_source=qr"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-secondary/10 hover:border-secondary/40 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram" /> @tuffourofficial
              </a>
              <a
                href="https://t.me/learnforexforfreegh"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-secondary/10 hover:border-secondary/40 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-telegram" /> Telegram
              </a>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Featured At strip */}
      <div className="max-w-6xl mx-auto mt-14 pt-8 border-t border-white/5 text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[1.4px] font-bold text-white/45 block mb-6">
            On the ground
          </span>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURED.map((f, i) => (
            <Reveal key={f.src} delay={i * 0.06}>
              <a
                href={f.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[4/3] rounded-xl overflow-hidden border border-white/5 hover:border-gold/40 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300"
              >
                <Image
                  src={f.src}
                  alt={f.caption}
                  fill
                  sizes="(max-width: 820px) 50vw, 25vw"
                  className="object-cover saturate-90 brightness-90 group-hover:saturate-100 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                />
                <span className="absolute inset-x-0 bottom-0 py-3 px-3.5 text-left text-xs font-semibold text-white bg-gradient-to-t from-black/85 to-transparent">
                  {f.caption}
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
