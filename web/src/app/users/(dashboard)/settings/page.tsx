import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase-server";
import SettingsEditor from "@/components/SettingsEditor";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="p-4 md:p-8">
      <SettingsEditor
        email={user.email || ""}
        initialPreferences={profile?.preferences || {}}
      />
    </div>
  );
}
