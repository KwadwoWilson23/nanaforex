"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Reveal from "./Reveal";

const FAQS = [
  {
    q: "Do I need prior trading experience?",
    a: "No. The mentorship starts from the absolute basics — what forex is, how the market moves, how to read charts — and builds up to professional strategy over 12 weeks.",
  },
  {
    q: "How much money do I need to start?",
    a: "You can join the free Telegram with $0 to see how we work. Copy trading starts at $500 minimum. The Funded Trader Program lets you trade firm capital up to $200,000 without personal risk.",
  },
  {
    q: "Is my capital safe with copy trading?",
    a: "You keep full control of your account through HFM. You can pause, unlink, or withdraw at any time. Nana Forex never touches your funds — we only trigger the trade copies.",
  },
  {
    q: "How do the funded accounts work?",
    a: "You pay a challenge fee (from GHS 1,000), pass a two-phase evaluation of consistent, risk-managed trading, and get funded with up to $200,000 of firm capital. You keep 80–90% of profits.",
  },
  {
    q: "How do I contact Emmanuel or the team?",
    a: "The fastest ways are the Telegram community and WhatsApp (+233 247 107 781). You can also use the contact form on the Contact page — we reply within 24 hours.",
  },
  {
    q: "Where is Nana Forex based?",
    a: "We're headquartered in Accra, Ghana, and serve traders across West Africa and beyond. Mentorship is delivered live online, so you can join from anywhere.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-colors overflow-hidden ${
        open
          ? "border-secondary/35 bg-secondary/[0.06]"
          : "border-white/5 bg-white/[0.04]"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center gap-4 px-5 py-4 font-semibold text-left"
      >
        <span>{q}</span>
        <motion.i
          className={`fas fa-chevron-down ${open ? "text-profit-green" : "text-white/50"}`}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="px-5 pb-5 text-white/70 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  return (
    <section className="px-4 md:px-16 py-24">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <div className="text-center mb-10">
            <span className="section-eyebrow">Frequently Asked</span>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl">
              Answers to{" "}
              <span className="gold-text">common questions</span>
            </h2>
          </div>
        </Reveal>

        <div className="flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i, 4) * 0.05}>
              <Item {...f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
