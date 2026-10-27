import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import NotificationBell from "../components/NotificationBell";
import CommandPalette from "../components/CommandPalette";
import {
  Building2,
  KeyRound,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

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
        className={`fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col bg-hcm-ink text-white shadow-hcm transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={`${roleLabel} navigation`}
      >
        <div className="flex items-center justify-between px-4 pb-4 pt-5">
          <Link
            to={homePath}
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-lime/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-white text-hcm-ink transition-transform duration-200 group-hover:-translate-y-0.5">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[16px] font-semibold tracking-[-0.02em]">
                HCM Lite
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8fa79b]">
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

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left text-xs text-[#a8bbb1] transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Search or jump to</span>
            <kbd className="rounded border border-white/10 bg-black/10 px-1.5 py-0.5 font-mono text-[9px] text-[#8fa79b]">
              Ctrl K
            </kbd>
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.name} className="mb-5 last:mb-0">
              <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6f8a7d]">
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
                      className={`group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] transition ${
                        active
                          ? "bg-white/[0.09] font-semibold text-white"
                          : "text-[#a9bbb1] hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-hcm-lime"
                        />
                      )}
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          active
                            ? "text-hcm-lime"
                            : "text-[#7f978a] group-hover:text-[#c8d8cf]"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            active
                              ? "bg-hcm-lime/15 text-hcm-lime"
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

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-[11px] font-bold text-white">
              {initials}
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
        <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-hcm-line bg-hcm-surface/90 px-3 py-2.5 backdrop-blur-xl sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-1 rounded-[10px] p-2 text-hcm-ink transition hover:bg-hcm-canvas lg:hidden"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="truncate text-[13px] font-semibold text-hcm-ink">
              {activeItem?.label || fallbackTitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-[10px] border border-hcm-line bg-hcm-surface-soft px-3 text-xs text-hcm-muted transition hover:border-hcm-line-strong hover:bg-white hover:text-hcm-ink md:flex"
              aria-label="Search or jump to a page"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Search or jump to...</span>
              <kbd className="rounded border border-hcm-line bg-white px-1.5 py-0.5 font-mono text-[9px]">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="rounded-[10px] p-2 text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink md:hidden"
              aria-label="Search or jump to a page"
            >
              <Search className="h-4 w-4" />
            </button>
            <NotificationBell />
            <Link
              to="/change-password"
              className="hidden rounded-[10px] p-2 text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink sm:block"
              title="Change password"
              aria-label="Change password"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
            <span
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-[10px] bg-hcm-accent-soft text-[10px] font-bold text-hcm-accent"
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
                    active ? "text-hcm-accent" : "text-hcm-muted"
                  }`}
                >
                  <span
                    className={`flex h-8 w-11 items-center justify-center rounded-[10px] transition ${
                      active ? "bg-hcm-accent-soft" : "bg-transparent"
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
