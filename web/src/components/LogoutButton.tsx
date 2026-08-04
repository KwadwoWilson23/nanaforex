"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LogoutButton({
  className,
  children,
  redirectTo = "/",
}: {
  className?: string;
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={className}
    >
      {children}
    </button>
  );
}
