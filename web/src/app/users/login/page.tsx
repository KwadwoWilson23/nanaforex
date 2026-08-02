import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import AuthCard from "@/components/AuthCard";
import { createSupabaseServer } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Log in / Register",
  description: "Sign in to your Nana Forex account or create a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  // Already logged in? Skip the page.
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect(next || "/users/client-dashboard");
  }

  return (
    <>
      <Navbar />
      {/* Google Identity Services — loads the popup flow used by AuthCard */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <main className="min-h-screen pt-28 md:pt-32 pb-16 px-4 flex items-center justify-center">
        <AuthCard initialError={error} nextUrl={next} />
      </main>
    </>
  );
}
