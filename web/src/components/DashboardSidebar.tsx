"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { NAV } from "@/lib/dashboard-nav";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Props = {
  user: User;
  isAdmin: boolean;
  displayName: string;
  open: boolean;
  onClose: () => void;
};

export default function DashboardSidebar({ user, isAdmin, displayName, open, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [signingOut, setSigningOut] = useState(false);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  async function logout() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const items = NAV.filter((n) => !n.admin || isAdmin);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        aria-hidden
      />

      <aside
        className={`fixed lg:static top-0 left-0 z-50 h-screen w-64 flex flex-col bg-[rgba(5,10,22,0.98)] backdrop-blur-xl border-r border-white/6 transform transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/logo.jpg"
              alt="Nana Forex"
              width={32}
              height={32}
              className="rounded-full ring-1 ring-gold/40"
            />
            <span className="font-black text-lg bg-gradient-gold bg-clip-text text-transparent">
              NanaForex
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 grid place-items-center rounded-full bg-white/5 border border-white/10 text-white/70"
            aria-label="Close menu"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* User strip */}
        <div className="px-5 py-4 border-b border-white/6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary text-dark font-black grid place-items-center text-sm shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {displayName}
            </div>
            <div className="text-xs text-white/50 truncate">{user.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const disabled = !item.ready;
            const cls = `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? "bg-secondary/12 text-secondary border-l-2 border-secondary"
                : disabled
                  ? "text-white/35 cursor-not-allowed"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
            } ${item.admin ? "text-gold" : ""}`;
            const inner = (
              <>
                <i className={`fas ${item.icon} w-4 text-center`} />
                <span>{item.label}</span>
                {disabled && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-white/35">
                    soon
                  </span>
                )}
              </>
            );
            if (disabled) {
              return (
                <div key={item.href} className={cls} aria-disabled>
                  {inner}
                </div>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {inner}
              </Link>
            );
          })}
        </nav>

        {/* Footer: logout */}
        <div className="px-3 py-3 border-t border-white/6">
          <button
            onClick={logout}
            disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors disabled:opacity-60"
          >
            <i
              className={`fas ${signingOut ? "fa-spinner fa-spin" : "fa-sign-out-alt"} w-4 text-center`}
            />
            {signingOut ? "Signing out…" : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
