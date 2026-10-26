import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import NotificationBell from "../components/NotificationBell";
import {
  Building2,
  KeyRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const accents = {
  admin: {
    logo: "from-blue-400 to-indigo-500",
    glow: "bg-blue-500/25",
    badge: "bg-blue-400/10 text-blue-300",
    active: "from-blue-500 to-indigo-500",
  },
  hr: {
    logo: "from-violet-400 to-fuchsia-500",
    glow: "bg-violet-500/25",
    badge: "bg-violet-400/10 text-violet-300",
    active: "from-violet-500 to-fuchsia-500",
  },
  employee: {
    logo: "from-emerald-400 to-teal-500",
    glow: "bg-emerald-500/25",
    badge: "bg-emerald-400/10 text-emerald-300",
    active: "from-emerald-500 to-teal-500",
  },
};

export default function AppLayout({
  navItems,
  homePath,
  roleLabel,
  fallbackTitle,
  accent = "admin",
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tone = accents[accent] || accents.admin;

  const isActive = (path) =>
    path === homePath
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const activeItem = [...navItems]
    .filter((item) => isActive(item.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl ${tone.glow}`} />

        <div className="relative flex items-center justify-between px-5 py-5">
          <Link
            to={homePath}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tone.logo} text-slate-950 shadow-lg`}
            >
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">
                HCM Lite
              </span>
              <span
                className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.badge}`}
              >
                {roleLabel}
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </p>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? `bg-gradient-to-r ${tone.active} font-medium text-white shadow-lg`
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone.logo} text-xs font-bold text-slate-950`}
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <Link
              to="/change-password"
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <KeyRound className="h-3.5 w-3.5" /> Password
            </Link>
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-ml-2 rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {activeItem?.label || fallbackTitle}
              </p>
              <p className="hidden text-[11px] text-slate-400 sm:block">
                {user?.firstName
                  ? `Signed in as ${user.firstName} · ${roleLabel}`
                  : roleLabel}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <Link
              to="/change-password"
              className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 sm:block"
              title="Change password"
              aria-label="Change password"
            >
              <KeyRound className="h-4 w-4" />
            </Link>
            <span
              className={`ml-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${tone.logo} text-[11px] font-bold text-slate-950`}
              title={`${user?.firstName || ""} ${user?.lastName || ""}`}
            >
              {initials}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
