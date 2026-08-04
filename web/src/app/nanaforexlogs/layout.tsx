import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

// noindex + nofollow so search engines never discover this URL.
// (We deliberately do NOT list it in robots.txt — that would advertise it.)
export const metadata: Metadata = {
  title: "Console",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const h = await headers();
    const nextPath =
      h.get("x-invoke-path") || h.get("x-matched-path") || "/nanaforexlogs";
    redirect(`/users/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-black text-white">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <i className="fas fa-lock text-3xl text-white/50 block mb-3" />
          <h1 className="font-display font-bold text-xl mb-2">Not found</h1>
          <p className="text-white/60 text-sm">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block text-secondary text-sm font-semibold hover:underline"
          >
            Back to homepage →
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    profile.full_name ||
    (user.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user.email?.split("@")[0] ||
    "Admin";

  return (
    <div className="min-h-screen bg-[#050810] text-white">
      <header className="border-b border-white/6 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            href="/nanaforexlogs"
            className="inline-flex items-center gap-2 font-display font-bold text-sm"
          >
            <span className="w-6 h-6 rounded-md bg-gradient-primary grid place-items-center text-dark">
              <i className="fas fa-shield-halved text-[10px]" />
            </span>
            <span>Nana Forex · Console</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/nanaforexlogs/competitions"
              className="px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/6 transition-all"
            >
              Competitions
            </Link>
            <span className="w-px h-4 bg-white/10 mx-2" />
            <span className="text-white/50 text-xs hidden sm:inline">
              {displayName}
            </span>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/6 transition-all"
            >
              <i className="fas fa-arrow-up-right-from-square" />
              <span className="hidden md:inline ml-1.5">Site</span>
            </Link>
            <LogoutButton className="px-3 py-1.5 rounded-lg text-white/70 hover:text-danger hover:bg-danger/10 transition-all text-sm">
              <i className="fas fa-sign-out-alt" />
              <span className="hidden md:inline ml-1.5">Sign out</span>
            </LogoutButton>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
