import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase-server";
import ProfileEditor from "@/components/ProfileEditor";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // layout guard already redirects

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, country, bio, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="p-4 md:p-8">
      <ProfileEditor
        email={user.email || ""}
        initial={{
          full_name: profile?.full_name || "",
          phone: profile?.phone || "",
          country: profile?.country || "",
          bio: profile?.bio || "",
          avatar_url: profile?.avatar_url || null,
        }}
      />
    </div>
  );
}
