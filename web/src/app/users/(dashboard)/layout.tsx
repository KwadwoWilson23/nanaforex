import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import DashboardShell from "@/components/DashboardShell";

/**
 * Server-side auth guard for every protected /users/* page.
 * If the visitor isn't signed in, they land on /users/login with a
 * `next=` query so we bounce them back where they wanted to go.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const h = await headers();
    const nextPath =
      h.get("x-invoke-path") ||
      h.get("x-matched-path") ||
      "/users/client-dashboard";
    redirect(`/users/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ||
    (user.user_metadata as { full_name?: string; name?: string } | undefined)
      ?.full_name ||
    (user.user_metadata as { name?: string } | undefined)?.name ||
    user.email?.split("@")[0] ||
    "Trader";

  return (
    <DashboardShell
      user={user}
      isAdmin={profile?.role === "admin"}
      displayName={displayName}
    >
      {children}
    </DashboardShell>
  );
}
