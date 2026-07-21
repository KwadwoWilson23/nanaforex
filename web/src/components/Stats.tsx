"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import Reveal from "./Reveal";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v) + suffix);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, { duration: 1.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, to, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

const STATS = [
  { label: "Serving Traders Since", value: 2020, static: true },
  { label: "Programs Offered", value: 4, suffix: "+" },
  { label: "Countries Reached", value: 20, suffix: "+" },
  { label: "Official Partner", icon: "shield", static: "HFM" },
];

export default function Stats() {
  return (
    <section className="px-4 md:px-16 py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-6 text-center transition-transform hover:-translate-y-1 hover:border-secondary/25">
              <h2 className="text-gold font-extrabold text-3xl md:text-4xl font-display mb-1">
                {s.static === true ? (
                  s.value
                ) : s.icon ? (
                  <>
                    <i className="fas fa-shield-alt mr-2" />
                    {s.static}
                  </>
                ) : (
                  <Counter to={s.value as number} suffix={s.suffix} />
                )}
              </h2>
              <p className="text-xs uppercase tracking-wider text-white/55">
                {s.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
