"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import DashboardSidebar from "./DashboardSidebar";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Props = {
  user: User;
  isAdmin: boolean;
  displayName: string;
  children: React.ReactNode;
};

/**
 * Full-page dashboard shell: fixed sidebar (collapsible on mobile) +
 * sticky top header with hamburger, page title, notification bell, avatar.
 */
export default function DashboardShell({
  user,
  isAdmin,
  displayName,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const supabase = createSupabaseBrowser();

  const title = pageTitle(pathname);

  // Load unread notification count once + subscribe to inserts/updates.
  useEffect(() => {
    let mounted = true;
    async function load() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (mounted) setUnread(count || 0);
    }
    load();
    const ch = supabase
      .channel("notif-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [supabase, user.id]);

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <DashboardSidebar
        user={user}
        isAdmin={isAdmin}
        displayName={displayName}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col lg:pl-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 md:px-8 py-3 border-b border-white/6 bg-[rgba(5,10,22,0.9)] backdrop-blur-xl">
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden w-9 h-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 text-white/85"
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars" />
          </button>
          <h1 className="text-lg md:text-xl font-bold tracking-tight flex-1 min-w-0 truncate">
            {title}
          </h1>
          <button
            className="relative w-10 h-10 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-secondary/10 hover:border-secondary/40 transition-colors"
            aria-label="Notifications"
          >
            <i className="fas fa-bell" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center">
                {unread}
              </span>
            )}
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-primary text-dark font-black grid place-items-center text-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function pageTitle(path: string) {
  const leaf = path.split("/").filter(Boolean).pop() || "";
  const map: Record<string, string> = {
    "client-dashboard": "Dashboard",
    profile: "Profile",
    settings: "Settings",
    competitions: "Competitions",
    "admin-competitions": "Admin — Competitions",
    academy: "Academy",
    signals: "Signals",
    "copy-trading": "Copy Trading",
    mentorship: "Mentorship",
    "ib-partnership": "IB Partnership",
    "trading-tools": "Trading Tools",
    "market-analysis": "Market Analysis",
  };
  return map[leaf] || "Dashboard";
}
