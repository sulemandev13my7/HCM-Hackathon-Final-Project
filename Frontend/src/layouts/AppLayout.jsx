import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import NotificationBell from "../components/NotificationBell";
import CommandPalette from "../components/CommandPalette";
import {
  Building2,
  CalendarDays,
  KeyRound,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

const roleAccent = {
  admin: "bg-hcm-lime",
  hr: "bg-[#f3b66f]",
  employee: "bg-[#93d8f0]",
};

const roleWord = {
  admin: "Administrator",
  hr: "People team",
  employee: "Team member",
};

export default function AppLayout({
  navItems,
  homePath,
  roleLabel,
  fallbackTitle,
  accent = "admin",
  mobileNav,
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const dot = roleAccent[accent] || roleAccent.admin;

  const isActive = (path) =>
    path === homePath
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const activeItem = [...navItems]
    .filter((item) => isActive(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  const groups = useMemo(() => {
    const result = [];
    navItems.forEach((item) => {
      const group = item.group || "Workspace";
      const existing = result.find((entry) => entry.name === group);
      if (existing) existing.items.push(item);
      else result.push({ name: group, items: [item] });
    });
    return result;
  }, [navItems]);

  const compactNav = mobileNav || navItems.slice(0, 4);
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-hcm-canvas">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-hcm-ink/45 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col bg-hcm-ink text-hcm-surface shadow-2xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={`${roleLabel} navigation`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hcm-grid-pattern-dark opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-hcm-lime/10 blur-3xl"
        />

        <div className="relative flex items-center justify-between px-5 pb-4 pt-5">
          <Link
            to={homePath}
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-lime/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hcm-lime text-hcm-ink shadow-[0_14px_34px_-18px_rgba(215,245,159,0.9)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[17px] font-semibold tracking-[-0.02em]">
                HCM Lite
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fa79b]">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {roleLabel}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-[#9cb0a5] transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative px-3 pb-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs text-[#9fb2a7] transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Search or jump to</span>
            <kbd className="rounded border border-white/10 bg-black/10 px-1.5 py-0.5 font-mono text-[9px] text-[#8fa79b]">
              Ctrl K
            </kbd>
          </button>
        </div>

        <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.name} className="mb-4 last:mb-0">
              <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6f8a7d]">
                {group.name}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition ${
                        active
                          ? "bg-hcm-lime font-semibold text-hcm-ink shadow-[0_12px_30px_-18px_rgba(215,245,159,0.95)]"
                          : "text-[#a9bbb1] hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          active
                            ? "text-hcm-ink"
                            : "text-[#7f978a] group-hover:text-[#c8d8cf]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            active
                              ? "bg-hcm-ink/10 text-hcm-ink"
                              : "bg-white/10 text-[#d7e0da]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7f2e6] text-[11px] font-bold text-hcm-ink">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-hcm-ink bg-[#8bd17c]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[10px] text-[#8fa79b]">
                {roleWord[accent] || roleLabel}
              </p>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <Link
              to="/change-password"
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] text-[#9cb0a5] transition hover:bg-white/5 hover:text-white"
            >
              <KeyRound className="h-3.5 w-3.5" /> Password
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] text-[#9cb0a5] transition hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-hcm-line/80 bg-hcm-canvas/85 px-3 py-2.5 backdrop-blur-xl sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-1 rounded-xl p-2 text-hcm-ink transition hover:bg-hcm-ink/5 lg:hidden"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-hcm-ink">
                {activeItem?.label || fallbackTitle}
              </p>
              <p className="hidden text-[10px] text-hcm-muted sm:flex sm:items-center sm:gap-1.5">
                <CalendarDays className="h-3 w-3" />
                {today}
                <span className="text-hcm-line-strong">/</span>
                {user?.firstName
                  ? `Signed in as ${user.firstName}`
                  : roleLabel}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-xl border border-hcm-line bg-white/70 px-3 text-xs text-hcm-muted transition hover:border-hcm-line-strong hover:bg-white hover:text-hcm-ink md:flex"
              aria-label="Search or jump to a page"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Search or jump to...</span>
              <kbd className="rounded border border-hcm-line bg-hcm-canvas px-1.5 py-0.5 font-mono text-[9px]">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="rounded-xl p-2 text-hcm-muted transition hover:bg-hcm-ink/5 hover:text-hcm-ink md:hidden"
              aria-label="Search or jump to a page"
            >
              <Search className="h-4 w-4" />
            </button>
            <NotificationBell />
            <Link
              to="/change-password"
              className="hidden rounded-xl p-2 text-hcm-muted transition hover:bg-hcm-ink/5 hover:text-hcm-ink sm:block"
              title="Change password"
              aria-label="Change password"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
            <span
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-hcm-ink text-[10px] font-bold text-hcm-lime"
              title={`${user?.firstName || ""} ${user?.lastName || ""}`}
            >
              {initials}
            </span>
          </div>
        </header>

        <div className="hcm-safe-bottom flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-7 lg:pb-7">
          <div className="hcm-page hcm-fade-in">
            <Outlet />
          </div>
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-hcm-line bg-hcm-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          aria-label="Quick navigation"
        >
          <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
            {compactNav.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[9px] font-semibold transition ${
                    active ? "text-hcm-ink" : "text-hcm-muted"
                  }`}
                >
                  <span
                    className={`flex h-8 w-11 items-center justify-center rounded-xl transition ${
                      active ? "bg-hcm-lime" : "bg-transparent"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="max-w-full truncate">
                    {item.shortLabel || item.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[9px] font-semibold text-hcm-muted"
            >
              <span className="flex h-8 w-11 items-center justify-center rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </span>
              More
            </button>
          </div>
        </nav>
      </main>

      {commandOpen && (
        <CommandPalette
          onClose={() => {
            setCommandOpen(false);
            setSidebarOpen(false);
          }}
          navItems={navItems}
          roleLabel={roleLabel}
          onLogout={logout}
        />
      )}
    </div>
  );
}
