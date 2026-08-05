import Image from "next/image";
import Reveal from "./Reveal";


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
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-2">
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
                { top: "Verified", bottom: "Broker-tracked results" },
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

    </section>
  );
}
