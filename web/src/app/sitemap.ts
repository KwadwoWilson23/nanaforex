import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const BASE = "https://nanaforex.com";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`,         lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/services`,      lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/contact`,       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog`,          lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/dashboard`,     lastModified: now, changeFrequency: "hourly",  priority: 0.7 },
    { url: `${BASE}/competitions`,  lastModified: now, changeFrequency: "daily",   priority: 0.9 },
  ];

  const [{ data: comps }, { data: posts }] = await Promise.all([
    supabase.from("competitions").select("slug, end_date").order("start_date", { ascending: false }),
    supabase.from("blog_posts").select("slug, updated_at").order("created_at", { ascending: false }).limit(200),
  ]);

  const compPages: MetadataRoute.Sitemap = (comps || []).map((c) => ({
    url: `${BASE}/competitions/${c.slug}/leaderboard`,
    lastModified: c.end_date ? new Date(c.end_date) : now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...compPages, ...blogPages];
}
