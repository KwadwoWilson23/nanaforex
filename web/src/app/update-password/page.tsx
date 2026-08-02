import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import UpdatePasswordForm from "@/components/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Complete your password reset for Nana Forex.",
};

export default function UpdatePasswordPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 md:pt-32 pb-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-black/40 backdrop-blur-xl p-6 md:p-8 shadow-elevated">
          <h1 className="font-display font-bold text-2xl md:text-3xl mb-2">
            Set a new <span className="gold-text">password</span>
          </h1>
          <p className="text-white/60 text-sm mb-6">
            Enter your new password below.
          </p>
          <UpdatePasswordForm />
          <p className="text-center text-sm text-white/60 mt-6">
            <Link href="/users/login" className="text-secondary font-semibold hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
