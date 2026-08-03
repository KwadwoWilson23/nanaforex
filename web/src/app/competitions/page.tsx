import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Trading Competitions",
  description:
    "Live Nana Forex trading competitions — watch real traders compete for real prize pools in real time.",
};

export const revalidate = 300;

type Comp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string;
  prize_pool: number | null;
};

function stateOf(c: Comp): "active" | "upcoming" | "ended" | "cancelled" {
  if (c.status === "cancelled") return "cancelled";
  const now = new Date();
  if (c.status === "ended" || new Date(c.end_date) < now) return "ended";
  if (c.status === "upcoming" || new Date(c.start_date) > now) return "upcoming";
  return "active";
}
const stateStyle: Record<string, { cls: string; icon: string; label: string }> = {
  active:    { cls: "bg-profit-green/12 text-profit-green border-profit-green/35", icon: "fa-circle",         label: "Live" },
  upcoming:  { cls: "bg-gold/12 text-gold border-gold/35",                          icon: "fa-clock",          label: "Upcoming" },
  ended:     { cls: "bg-white/6 text-white/65 border-white/12",                     icon: "fa-flag-checkered", label: "Ended" },
  cancelled: { cls: "bg-danger/12 text-danger border-danger/35",                    icon: "fa-ban",            label: "Cancelled" },
};

export default async function PublicCompetitionsPage() {
  const { data } = await supabase
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool")
    .order("start_date", { ascending: true });

  const rows = (data || []) as Comp[];

  return (
    <PageShell
      header={
        <PageHero
          eyebrow="Trading Competitions"
          title={<>Watch real traders <span className="gold-text">compete live</span></>}
        >
          Public leaderboards for every active challenge. Or join one — you&apos;ll
          need a Nana Forex account and an MT5 investor password.
        </PageHero>
      }
    >
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-24">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-10 text-center">
            <i className="fas fa-trophy text-3xl text-gold/60 block mb-3" />
            <h2 className="font-bold text-lg">No competitions yet</h2>
            <p className="text-white/60 mt-1">
              Check back soon — the next challenge is on the way.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((c, i) => {
              const st = stateOf(c);
              const style = stateStyle[st];
              return (
                <Reveal key={c.id} delay={Math.min(i, 6) * 0.05}>
                  <Link
                    href={`/competitions/${c.slug}/leaderboard`}
                    className="block h-full rounded-2xl border border-white/6 bg-white/[0.03] p-6 flex flex-col gap-3 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-elevated transition-all"
                  >
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.cls}`}
                      >
                        <i className={`fas ${style.icon} text-[8px]`} />
                        {style.label}
                      </span>
                      <span className="text-gold text-xs font-bold uppercase tracking-wider">
                        {c.prize_pool
                          ? "$" + Number(c.prize_pool).toLocaleString()
                          : "—"}{" "}
                        prize
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg">{c.name}</h3>
                    {c.description && (
                      <p className="text-white/65 text-sm leading-relaxed line-clamp-3">
                        {c.description}
                      </p>
                    )}
                    <div className="mt-auto pt-3 border-t border-white/6 text-xs text-white/55 flex justify-between">
                      <span>
                        {new Date(c.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" – "}
                        {new Date(c.end_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-secondary font-semibold inline-flex items-center gap-1">
                        View <i className="fas fa-arrow-right text-[10px]" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
