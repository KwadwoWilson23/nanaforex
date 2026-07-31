import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Market analysis, trading psychology, strategies, and forex news from the Nana Forex team.",
};

// Revalidate the blog list every 5 minutes on the edge — fresh enough,
// low enough to not thrash Supabase.
export const revalidate = 300;

const CATEGORY_LABELS: Record<string, string> = {
  analysis: "Market Analysis",
  psychology: "Trading Psychology",
  strategy: "Trading Strategies",
  news: "Forex News",
};

type Post = {
  id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  category: string | null;
  image_url: string | null;
  read_time: string | null;
  created_at: string;
};

export default async function BlogPage() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, category, image_url, read_time, created_at")
    .order("created_at", { ascending: false })
    .limit(60);

  const posts = (data || []) as Post[];

  return (
    <PageShell
      header={
        <PageHero
          eyebrow="Insights"
          title={<>Market analysis + <span className="gold-text">trading wisdom</span></>}
        >
          Daily market briefings, trading psychology, strategy deep-dives, and
          the latest forex news.
        </PageHero>
      }
    >
      <section className="px-4 md:px-16 pb-24">
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-6 text-center">
              <i className="fas fa-triangle-exclamation text-danger text-2xl mb-2 block" />
              <p className="text-white/75">
                Couldn&apos;t load posts right now. Please try again in a moment.
              </p>
            </div>
          )}

          {!error && posts.length === 0 && (
            <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-12 text-center">
              <i className="fas fa-chart-line text-gold text-3xl mb-3 block" />
              <h2 className="font-bold text-xl mb-2">No posts yet</h2>
              <p className="text-white/60">
                Check back soon for daily market analysis and insights.
              </p>
            </div>
          )}

          {posts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 6) * 0.05}>
                  <BlogCard post={p} featured={i === 0 && posts.length > 1} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function BlogCard({ post, featured }: { post: Post; featured: boolean }) {
  const href = `/blog/${post.slug || post.id}`;
  const cat = post.category ? CATEGORY_LABELS[post.category] || post.category : null;
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={href}
      className={`group block h-full rounded-3xl border border-white/6 bg-white/[0.04] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-secondary/25 hover:shadow-elevated ${
        featured ? "lg:col-span-2 lg:row-span-1" : ""
      }`}
    >
      {post.image_url ? (
        <div className={`relative w-full ${featured ? "aspect-[2/1]" : "aspect-[16/10]"} overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      ) : (
        <div className={`w-full ${featured ? "aspect-[2/1]" : "aspect-[16/10]"} bg-gradient-to-br from-secondary/20 to-gold/10 grid place-items-center`}>
          <i className="fas fa-chart-line text-4xl text-gold/60" />
        </div>
      )}

      <div className="p-6">
        {cat && (
          <span className="inline-block px-2.5 py-1 rounded-full bg-gold/12 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-3">
            {cat}
          </span>
        )}
        <h3 className={`font-display font-bold mb-2 leading-tight text-white group-hover:text-secondary transition-colors ${featured ? "text-2xl" : "text-lg"}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-white/65 text-sm leading-relaxed mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-white/45">
          <span>
            <i className="far fa-calendar mr-1" />
            {date}
          </span>
          {post.read_time && (
            <span>
              <i className="far fa-clock mr-1" />
              {post.read_time}
            </span>
          )}
          <span className="ml-auto text-secondary font-semibold">
            Read <i className="fas fa-arrow-right ml-1 text-xs" />
          </span>
        </div>
      </div>
    </Link>
  );
}
