import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import NotificationBell from "../components/NotificationBell";
import CommandPalette from "../components/CommandPalette";
import {
  Building2,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
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
  const scrollRef = useRef(null);

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
  const ActiveIcon = activeItem?.icon;

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

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-hcm-canvas">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-hcm-ink/35 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`hcm-sidebar fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col border-r border-hcm-line text-hcm-ink shadow-hcm transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={`${roleLabel} navigation`}
      >
        <div className="flex items-center justify-between px-4 pb-4 pt-5">
          <Link
            to={homePath}
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/25"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-hcm-lime text-hcm-ink shadow-[0_8px_24px_-14px_rgba(0,133,115,0.55)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[16px] font-semibold tracking-[-0.02em]">
                HCM Lite
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-hcm-muted">
                {roleLabel}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-[10px] border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-left text-xs text-hcm-muted transition hover:border-hcm-line-strong hover:bg-white hover:text-hcm-ink"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1">Search or jump to</span>
            <kbd className="rounded border border-hcm-line bg-white px-1.5 py-0.5 font-mono text-[9px] text-hcm-muted">
              Ctrl K
            </kbd>
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.name} className="mb-5 last:mb-0">
              <p className="px-3 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-hcm-muted">
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
                      className={`group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                        active
                          ? "hcm-nav-active font-semibold text-hcm-accent-strong"
                          : "text-hcm-muted hover:bg-hcm-surface-soft hover:text-hcm-ink"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-hcm-accent"
                        />
                      )}
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] transition-colors duration-200 ${
                          active
                            ? "bg-hcm-accent-soft text-hcm-accent-strong"
                            : "text-hcm-muted group-hover:bg-hcm-surface-soft group-hover:text-hcm-ink"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            active
                              ? "bg-hcm-accent text-white"
                              : "bg-hcm-line text-hcm-ink-soft"
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

        <div className="border-t border-hcm-line p-3">
          <div className="flex items-center gap-3 rounded-xl border border-hcm-line bg-hcm-surface-soft p-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-hcm-lime text-[11px] font-bold text-hcm-ink">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[10px] text-hcm-muted">
                {roleWord[accent] || roleLabel}
              </p>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <Link
              to="/change-password"
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] text-hcm-muted transition hover:bg-hcm-surface-soft hover:text-hcm-ink"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Security
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] text-hcm-muted transition hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-hcm-line/80 bg-hcm-surface/85 px-3 py-2.5 shadow-[0_8px_30px_-28px_rgba(7,35,51,0.45)] backdrop-blur-xl sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-1 rounded-[10px] p-2 text-hcm-ink transition hover:bg-hcm-canvas lg:hidden"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            {ActiveIcon && (
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-hcm-accent-soft text-hcm-accent sm:flex">
                <ActiveIcon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-hcm-muted">
                {roleLabel}
              </p>
              <p className="truncate font-display text-[14px] font-semibold tracking-[-0.01em] text-hcm-ink">
                {activeItem?.label || fallbackTitle}
              </p>
            </div>
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
              title="Account security"
              aria-label="Account security"
            >
              <ShieldCheck className="h-4 w-4" />
            </Link>
              <span
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-[10px] bg-hcm-accent-soft text-[10px] font-bold text-hcm-accent-strong"
              title={`${user?.firstName || ""} ${user?.lastName || ""}`}
            >
              {initials}
            </span>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="hcm-workspace-scroll hcm-safe-bottom flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-7 lg:pb-7"
        >
          <div key={location.pathname} className="hcm-page hcm-route-in">
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
                    active ? "text-hcm-accent-strong" : "text-hcm-muted"
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
              className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[9px] font-semibold text-hcm-muted transition hover:text-hcm-ink"
            >
              <span className="flex h-8 w-11 items-center justify-center rounded-xl">
                <LayoutGrid className="h-4 w-4" />
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
