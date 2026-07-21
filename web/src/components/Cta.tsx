import Link from "next/link";
import Reveal from "./Reveal";

export default function Cta() {
  return (
    <section className="px-4 md:px-16 py-24 text-center">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-4">
            Ready to <span className="gold-text">get serious</span> about your
            trading?
          </h2>
          <p className="text-white/65 mb-8 max-w-xl mx-auto">
            Join the free Telegram to see how we work, or reach out for
            mentorship, copy trading and funded accounts.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://t.me/learnforexforfreegh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <i className="fab fa-telegram" /> Join Free Telegram
            </a>
            <Link href="/contact" className="btn-secondary">
              Talk to the Team
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
