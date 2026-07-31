import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the Nana Forex team — Emmanuel Tuffour and the mentors — via Telegram, WhatsApp, email or the form.",
};

const CHANNELS = [
  {
    icon: "fas fa-phone",
    title: "Call / WhatsApp",
    body: "+233 247 107 781",
    href: "https://wa.me/233247107781",
  },
  {
    icon: "fas fa-envelope",
    title: "Email",
    body: "info@nanaforex.com",
    href: "mailto:info@nanaforex.com",
  },
  {
    icon: "fab fa-telegram",
    title: "Telegram",
    body: "learnforexforfreegh",
    href: "https://t.me/learnforexforfreegh",
  },
  {
    icon: "fas fa-clock",
    title: "Support Hours",
    body: "Mon–Fri 9AM–6PM GMT",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <PageShell
      header={
        <PageHero
          eyebrow="Get in Touch"
          title={<>We&apos;re here to <span className="gold-text">help</span></>}
        >
          Fastest response is Telegram or WhatsApp. Otherwise we reply to
          email + the form within 24 hours.
        </PageHero>
      }
    >
      <section className="px-4 md:px-16 pb-24">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1fr_1.35fr]">
          {/* Channels */}
          <Reveal direction="left">
            <div className="rounded-3xl border border-white/6 bg-white/[0.04] p-6 md:p-8 h-full">
              <h2 className="font-display font-bold text-2xl mb-6">Reach us directly</h2>
              <div className="space-y-4">
                {CHANNELS.map((c) => {
                  const inner = (
                    <div className="flex items-start gap-4 group">
                      <div className="shrink-0 w-11 h-11 grid place-items-center rounded-xl bg-gradient-primary text-dark transition-transform group-hover:-translate-y-1">
                        <i className={c.icon} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wider text-white/55">
                          {c.title}
                        </h3>
                        <p className="text-white/90">{c.body}</p>
                      </div>
                    </div>
                  );
                  return c.href ? (
                    <a
                      key={c.title}
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="block"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={c.title}>{inner}</div>
                  );
                })}
              </div>
              <div className="mt-8 pt-6 border-t border-white/8">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white/55 mb-3">
                  Follow us
                </h3>
                <div className="flex gap-2">
                  <a
                    href="https://www.instagram.com/tuffourofficial?igsh=MWVieXhibXM1dDc2ZA%3D%3D&utm_source=qr"
                    className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-gradient-primary hover:text-dark transition-all"
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-instagram" />
                  </a>
                  <a
                    href="https://t.me/learnforexforfreegh"
                    className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-gradient-primary hover:text-dark transition-all"
                    aria-label="Telegram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-telegram" />
                  </a>
                  <a
                    href="https://wa.me/233247107781"
                    className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-gradient-primary hover:text-dark transition-all"
                    aria-label="WhatsApp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-whatsapp" />
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal direction="right">
            <div className="rounded-3xl border border-white/6 bg-white/[0.04] p-6 md:p-8">
              <h2 className="font-display font-bold text-2xl mb-2">Send us a message</h2>
              <p className="text-white/60 mb-6 text-sm">
                We reply within 24 hours on business days.
              </p>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
