"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "scale";

const variants = {
  up:    { hidden: { opacity: 0, y:  28 }, show: { opacity: 1, y: 0 } },
  down:  { hidden: { opacity: 0, y: -28 }, show: { opacity: 1, y: 0 } },
  left:  { hidden: { opacity: 0, x: -34 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x:  34 }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } },
};

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const v = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : variants[direction];

  return (
    <motion.div
      className={className}
      variants={v}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
