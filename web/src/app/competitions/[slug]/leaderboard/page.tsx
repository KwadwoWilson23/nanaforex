import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import PublicLeaderboard from "@/components/PublicLeaderboard";
import { supabase } from "@/lib/supabase";

// Fresh at the edge every 60s; then the client polls after paint.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("competitions")
    .select("name, description, prize_pool")
    .eq("slug", slug)
    .maybeSingle();
  const title = data?.name ? `${data.name} — Live Leaderboard` : "Live Leaderboard";
  const desc =
    data?.description ||
    "Live rankings for Nana Forex trading competitions. Watch traders compete in real time.";
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: ["/images/logo.jpg"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ["/images/logo.jpg"],
    },
  };
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: comp } = await supabase
    .from("competitions")
    .select("id, slug, name, description, status, start_date, end_date, prize_pool")
    .eq("slug", slug)
    .maybeSingle();
  if (!comp) notFound();

  return (
    <PageShell>
      <PublicLeaderboard competition={comp} />
    </PageShell>
  );
}
