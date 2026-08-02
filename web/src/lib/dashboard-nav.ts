/**
 * Sidebar nav configuration for /users/(dashboard)/* pages.
 * `ready: true` means the page is migrated to React and lives inside /web.
 * `ready: false` items render greyed-out ("coming soon") until we ship them.
 * `admin: true` items only show for users whose profiles.role='admin'.
 */
export type NavItem = {
  href: string;
  label: string;
  icon: string;
  ready: boolean;
  admin?: boolean;
};

export const NAV: NavItem[] = [
  { href: "/users/client-dashboard", label: "Dashboard", icon: "fa-th-large", ready: true },
  { href: "/users/profile", label: "Profile", icon: "fa-user", ready: true },
  { href: "/users/competitions", label: "Competitions", icon: "fa-trophy", ready: false },
  { href: "/users/admin-competitions", label: "Admin", icon: "fa-shield-halved", ready: false, admin: true },
  { href: "/users/academy", label: "Academy", icon: "fa-graduation-cap", ready: false },
  { href: "/users/signals", label: "Signals", icon: "fa-signal", ready: false },
  { href: "/users/copy-trading", label: "Copy Trading", icon: "fa-copy", ready: false },
  { href: "/users/mentorship", label: "Mentorship", icon: "fa-chalkboard-teacher", ready: false },
  { href: "/users/ib-partnership", label: "IB Partnership", icon: "fa-handshake", ready: false },
  { href: "/users/trading-tools", label: "Trading Tools", icon: "fa-tools", ready: false },
  { href: "/users/market-analysis", label: "Market Analysis", icon: "fa-chart-line", ready: false },
  { href: "/users/settings", label: "Settings", icon: "fa-cog", ready: true },
];
