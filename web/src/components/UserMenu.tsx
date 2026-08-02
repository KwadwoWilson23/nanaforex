"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

function initialsFor(user: User) {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const name = meta?.full_name || meta?.name || user.email || "?";
  return name
    .split(/[ .]/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function UserMenu() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dropRef.current) return;
      if (!dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function logout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (user === undefined) {
    // still loading — reserve space (matches the width of the login pill)
    return <div className="w-10 h-10" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/users/login"
        className="w-10 h-10 grid place-items-center rounded-full bg-white/5 border border-white/10 hover:bg-secondary/10 hover:border-secondary/40 transition-colors"
        aria-label="Sign in"
      >
        <i className="fa fa-user text-sm" />
      </Link>
    );
  }

  const initials = initialsFor(user);
  return (
    <div ref={dropRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-full bg-gradient-primary text-dark font-black text-sm grid place-items-center hover:-translate-y-0.5 transition-transform"
        aria-label="Open user menu"
      >
        {initials}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 w-64 rounded-2xl border border-white/10 bg-[rgba(5,10,22,0.98)] backdrop-blur-xl shadow-elevated overflow-hidden"
          >
            <div className="p-4 border-b border-white/6">
              <p className="text-xs uppercase tracking-wider text-white/45">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-white truncate">
                {user.email}
              </p>
            </div>
            <div className="p-2">
              <MenuLink href="/users/client-dashboard" icon="fa-th-large" onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              <MenuLink href="/users/profile" icon="fa-user" onClick={() => setOpen(false)}>
                Profile
              </MenuLink>
              <MenuLink href="/users/competitions" icon="fa-trophy" onClick={() => setOpen(false)}>
                Competitions
              </MenuLink>
              <MenuLink href="/users/settings" icon="fa-cog" onClick={() => setOpen(false)}>
                Settings
              </MenuLink>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger hover:bg-danger/10 transition-colors text-sm mt-1"
              >
                <i className="fas fa-sign-out-alt w-4" />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string;
  icon: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:bg-white/5 transition-colors text-sm"
    >
      <i className={`fas ${icon} w-4`} />
      {children}
    </Link>
  );
}
