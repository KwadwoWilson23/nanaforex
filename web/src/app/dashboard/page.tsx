import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import PublicLeaderboard from "@/components/PublicLeaderboard";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Performance",
  description:
    "Live challenge leaderboard — real Nana Forex traders competing on real broker accounts.",
};

export const revalidate = 60;

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

function pickFeatured(rows: Comp[]): Comp | null {
  if (!rows.length) return null;
  const now = Date.now();
  const active = rows.find(
    (c) =>
      c.status === "active" &&
      new Date(c.start_date).getTime() <= now &&
      new Date(c.end_date).getTime() >= now,
  );
  if (active) return active;
  const upcoming = rows
    .filter((c) => c.status === "upcoming" || new Date(c.start_date).getTime() > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  if (upcoming) return upcoming;
  return rows
    .slice()
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
}

export default async function PerformancePage() {
  const { data } = await supabase
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool")
    .order("start_date", { ascending: false });

  const rows = (data || []) as Comp[];
  const featured = pickFeatured(rows);

  return (
    <PageShell
      header={
        <PageHero
          eyebrow="Live Performance"
          title={<>The Nana Forex <span className="gold-text">Leaderboard</span></>}
        >
          {featured
            ? `${featured.name} — see who's topping the ranking in real time.`
            : "Live rankings will appear here once a competition is running."}
        </PageHero>
      }
    >
      <section className="px-4 md:px-8 pb-24 max-w-6xl mx-auto space-y-10">
        {featured ? (
          <PublicLeaderboard competition={featured} />
        ) : (
          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-12 text-center">
            <i className="fas fa-trophy text-gold text-3xl mb-3 block" />
            <h2 className="font-bold text-xl mb-2">No competition running right now</h2>
            <p className="text-white/60 mb-5">
              When the next challenge kicks off, its live leaderboard will show
              up here automatically.
            </p>
            <Link href="/competitions" className="btn-primary">
              Browse competitions
            </Link>
          </div>
        )}

        {rows.length > 1 && (
          <div>
            <h3 className="font-display font-bold text-lg mb-3">
              Other competitions
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rows
                .filter((c) => !featured || c.id !== featured.id)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/competitions/${c.slug}/leaderboard`}
                    className="rounded-2xl border border-white/6 bg-white/[0.03] p-5 hover:-translate-y-0.5 hover:border-secondary/25 transition-all block"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-white/45 mb-1">
                      {c.status}
                    </div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-white/55 mt-1">
                      {new Date(c.start_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                      {" – "}
                      {new Date(c.end_date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-white/40">
          Updates automatically as trades post. Powered by verified broker data.
        </p>
      </section>
    </PageShell>
  );
}
