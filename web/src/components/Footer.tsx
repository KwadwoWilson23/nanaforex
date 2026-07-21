import Link from "next/link";

const LINKS = {
  quick: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/dashboard", label: "Performance" },
    { href: "/blog", label: "Blogs" },
    { href: "/contact", label: "Contact" },
  ],
  services: [
    { href: "/services#mentorship", label: "Forex Mentorship" },
    { href: "/services#copy-trading", label: "Copy Trading" },
    { href: "/services#funded-account", label: "Funded Accounts" },
    { href: "/services#market-analysis", label: "Market Analysis" },
  ],
};

const SOCIAL = [
  {
    href: "https://www.instagram.com/tuffourofficial?igsh=MWVieXhibXM1dDc2ZA%3D%3D&utm_source=qr",
    icon: "fab fa-instagram",
  },
  { href: "https://t.me/learnforexforfreegh", icon: "fab fa-telegram" },
  { href: "https://wa.me/233247107781", icon: "fab fa-whatsapp" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/30">
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-16 grid gap-10 md:grid-cols-4">
        <div>
          <h2 className="font-display font-black text-2xl text-gold mb-3">
            NanaForex
          </h2>
          <p className="text-white/60 text-sm mb-5">
            Trade Smarter. Grow Faster. Profit Consistently.
          </p>
          <div className="flex gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-gradient-primary hover:text-dark hover:-translate-y-1 transition-all"
              >
                <i className={s.icon} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">
            Quick Links
          </h4>
          <div className="flex flex-col gap-2 text-sm text-white/65">
            {LINKS.quick.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-secondary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">
            Services
          </h4>
          <div className="flex flex-col gap-2 text-sm text-white/65">
            {LINKS.services.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-secondary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">
            Contact
          </h4>
          <div className="flex flex-col gap-2 text-sm text-white/65">
            <a href="mailto:info@nanaforex.com" className="hover:text-secondary transition-colors">
              info@nanaforex.com
            </a>
            <a href="tel:+233247107781" className="hover:text-secondary transition-colors">
              +233 247 107 781
            </a>
            <span>Accra, Ghana</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-4 md:px-16 py-6 text-center text-xs text-white/50 space-y-2">
        <p>© 2026 Nana Forex. All rights reserved.</p>
        <p>
          ⚠️ Risk Warning: Forex trading involves substantial risk of loss.
          Past performance is not indicative of future results. Trade
          responsibly.
        </p>
      </div>
    </footer>
  );
}
