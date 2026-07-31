"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared page hero used by every marketing subpage.
 * Under-nav padding, gold + green accent glow.
 */
export default function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative pt-32 md:pt-40 pb-16 md:pb-24 px-4 md:px-16 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 300px at 15% 0%, rgba(0,200,150,0.14), transparent 55%), radial-gradient(500px 260px at 100% 20%, rgba(245,183,0,0.10), transparent 60%)",
        }}
      />
      <div className="relative max-w-4xl mx-auto text-center">
        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="section-eyebrow"
          >
            {eyebrow}
          </motion.span>
        )}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-extrabold text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.05] tracking-tight"
        >
          {title}
        </motion.h1>
        {children && (
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 mx-auto max-w-2xl text-white/70 text-[clamp(1rem,1.4vw,1.15rem)]"
          >
            {children}
          </motion.p>
        )}
      </div>
    </section>
  );
}
