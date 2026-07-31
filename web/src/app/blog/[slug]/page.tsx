import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { supabase } from "@/lib/supabase";

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
  content: string | null;
  category: string | null;
  image_url: string | null;
  read_time: string | null;
  created_at: string;
};

async function getPost(idOrSlug: string): Promise<Post | null> {
  const bySlug = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, content, category, image_url, read_time, created_at")
    .eq("slug", idOrSlug)
    .maybeSingle();
  if (bySlug.data) return bySlug.data as Post;

  const byId = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, content, category, image_url, read_time, created_at")
    .eq("id", idOrSlug)
    .maybeSingle();
  return (byId.data as Post) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.image_url ? [post.image_url] : undefined,
      type: "article",
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const cat = post.category
    ? CATEGORY_LABELS[post.category] || post.category
    : null;
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell>
      <article className="pt-32 md:pt-40 pb-24">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-secondary mb-6 transition-colors"
          >
            <i className="fas fa-arrow-left" /> All posts
          </Link>

          {cat && (
            <span className="inline-block px-2.5 py-1 rounded-full bg-gold/12 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-4">
              {cat}
            </span>
          )}

          <h1 className="font-display font-extrabold text-3xl md:text-5xl leading-tight mb-4">
            {post.title}
          </h1>

          <div className="flex items-center gap-5 text-sm text-white/50 mb-8">
            <span>
              <i className="far fa-calendar mr-1.5" />
              {date}
            </span>
            {post.read_time && (
              <span>
                <i className="far fa-clock mr-1.5" />
                {post.read_time}
              </span>
            )}
          </div>

          {post.image_url && (
            <div className="rounded-3xl overflow-hidden mb-10 border border-white/6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {post.excerpt && (
            <p className="text-xl text-white/80 leading-relaxed mb-8 border-l-4 border-secondary/60 pl-5 italic">
              {post.excerpt}
            </p>
          )}

          <div className="prose prose-invert prose-lg max-w-none text-white/85 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </article>
    </PageShell>
  );
}
