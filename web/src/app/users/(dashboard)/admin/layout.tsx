import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  // The outer /users/(dashboard)/layout already redirects unauthed visitors.
  // We only need the admin role check here.
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="p-8 md:p-12 max-w-2xl mx-auto text-center">
        <div className="rounded-2xl border border-danger/25 bg-danger/6 p-10">
          <i className="fas fa-lock text-3xl text-danger mb-3 block" />
          <h1 className="font-display font-bold text-2xl mb-2">
            Admin access required
          </h1>
          <p className="text-white/65 mb-5">
            You&apos;re signed in, but this area is only for site
            administrators. If this is a mistake, ping the site owner.
          </p>
          <Link href="/users/client-dashboard" className="btn-primary">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
