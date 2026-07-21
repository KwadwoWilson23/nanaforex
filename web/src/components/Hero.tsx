"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Background image + overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(rgba(5,10,22,0.75), rgba(5,10,22,0.95)), url('/images/forexbg.jpg') center/cover",
        }}
      />

      {/* Floating glow blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
        style={{ background: "rgba(0,200,150,0.25)" }}
        animate={{
          x: [0, 22, 0],
          y: [0, -26, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-24 -left-24 w-[380px] h-[380px] rounded-full blur-3xl"
        style={{ background: "rgba(245,183,0,0.18)" }}
        animate={{
          x: [0, -18, 0],
          y: [0, 24, 0],
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 19, delay: -5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur text-sm font-semibold"
        >
          <i className="fas fa-star text-gold" />
          Ghana&apos;s Home for Ambitious Traders
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-extrabold mt-6 leading-[1.05] tracking-tight text-[clamp(3rem,8vw,6rem)]"
        >
          The structured path to{" "}
          <span className="gold-text">consistent forex profits</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 mx-auto max-w-2xl text-white/75 text-[clamp(1rem,1.4vw,1.15rem)]"
        >
          12 weeks of live mentorship. Copy trading with a proven trader.
          Funded accounts up to $200K. Built for beginners who want to
          become pros — no hype, no gurus.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex gap-3 justify-center flex-wrap"
        >
          <a
            href="https://t.me/learnforexforfreegh"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <i className="fab fa-telegram" /> Join Free Telegram
          </a>
          <Link href="/services" className="btn-secondary">
            Explore Programs
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-8 flex gap-5 justify-center flex-wrap text-sm text-white/55"
        >
          {["12-week curriculum", "Live weekly sessions", "Since 2020"].map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <i className="fas fa-check-circle text-profit-green" /> {s}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
