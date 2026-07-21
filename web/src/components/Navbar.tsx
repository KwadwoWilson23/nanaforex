"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/dashboard", label: "Performance" },
  { href: "/blog", label: "Blogs" },
  { href: "/contact", label: "Contact" },
];

const SOCIAL = [
  {
    href: "https://www.instagram.com/tuffourofficial?igsh=MWVieXhibXM1dDc2ZA%3D%3D&utm_source=qr",
    icon: "fab fa-instagram",
    label: "Instagram",
  },
  {
    href: "https://t.me/learnforexforfreegh",
    icon: "fab fa-telegram",
    label: "Telegram",
  },
  {
    href: "https://wa.me/233247107781",
    icon: "fab fa-whatsapp",
    label: "WhatsApp",
  },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-4 md:px-16 py-4 backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(5,10,22,0.92)] shadow-[0_10px_30px_rgba(0,0,0,0.45)] py-2 border-b border-[rgba(0,200,150,0.25)]"
            : "bg-[rgba(5,10,22,0.75)] border-b border-white/10"
        }`}
      >
        <Link href="/" className="inline-flex items-center gap-2 font-black">
          <Image
            src="/images/logo.jpg"
            alt="Nana Forex"
            width={40}
            height={40}
            className="rounded-full ring-1 ring-gold/40 shadow-[0_0_14px_rgba(245,183,0,0.35)]"
            priority
          />
          <span className="bg-gradient-gold bg-clip-text text-transparent text-xl font-black">
            NanaForex
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative font-medium transition-colors hover:text-secondary group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded" />
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/users/login"
            className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-secondary/10 hover:border-secondary/40 transition-colors"
            aria-label="Sign in"
          >
            <i className="fa fa-user text-sm" />
          </Link>
          {SOCIAL.map((s) => (
            <a
              key={s.href}
              href={s.href}
              aria-label={s.label}
              className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-gradient-primary hover:text-dark hover:-translate-y-1 transition-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className={s.icon} />
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`h-0.5 w-7 bg-white transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-7 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-7 bg-white transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </header>

      {/* Mobile menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-[rgba(0,0,0,0.6)] backdrop-blur-md transition-opacity ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setOpen(false)}
      />
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "100%" }}
        transition={{ type: "tween", duration: 0.35 }}
        className="lg:hidden fixed right-0 top-0 h-full w-[85vw] max-w-[320px] z-50 bg-[rgba(5,10,22,0.98)] backdrop-blur-2xl p-6 flex flex-col gap-6"
      >
        <button
          className="self-end w-10 h-10 rounded-full bg-white/5 border border-white/10"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <i className="fas fa-times" />
        </button>
        <nav className="flex flex-col gap-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-medium py-2 border-b border-white/10 hover:text-gold hover:pl-2 transition-all"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/users/login"
            className="text-lg font-medium py-2 border-b border-white/10 hover:text-gold hover:pl-2 transition-all"
            onClick={() => setOpen(false)}
          >
            Sign Up
          </Link>
        </nav>
      </motion.aside>
    </>
  );
}
