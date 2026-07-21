"use client";

import { motion } from "framer-motion";
import Reveal from "./Reveal";

const FEATURES = [
  "Real-time trade ideas",
  "Daily market briefings",
  "Beginner-friendly Q&A",
  "Zero cost, zero commitment",
];

export default function TelegramFeature() {
  return (
    <section className="px-4 md:px-16 py-16">
      <div className="max-w-6xl mx-auto rounded-3xl border border-[#229ED9]/30 bg-gradient-to-br from-[#229ED9]/15 to-secondary/8 p-8 md:p-12 grid md:grid-cols-[1fr_auto] gap-10 items-center overflow-hidden">
        <Reveal direction="left">
          <div>
            <span className="section-eyebrow">
              <i className="fab fa-telegram" style={{ color: "#229ED9" }} />
              Free Community
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl mb-3">
              Join our Telegram — <span className="gold-text">free forever</span>
            </h2>
            <p className="text-white/70 mb-5 max-w-xl">
              Get daily market analysis, trade setups, and live discussions
              with other Ghanaian traders. It&apos;s the fastest way to see
              if Nana Forex is the right home for your trading journey.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-7 max-w-lg">
              {FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-white/80"
                >
                  <i className="fas fa-check-circle" style={{ color: "#229ED9" }} />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="https://t.me/learnforexforfreegh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <i className="fab fa-telegram" /> Join the Telegram
            </a>
          </div>
        </Reveal>

        <div className="relative aspect-square w-[240px] md:w-[320px] mx-auto grid place-items-center">
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(34,158,217,0.35), transparent 60%)",
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <i
            className="fab fa-telegram relative text-[9rem]"
            style={{
              color: "#229ED9",
              filter: "drop-shadow(0 20px 40px rgba(34,158,217,0.45))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
