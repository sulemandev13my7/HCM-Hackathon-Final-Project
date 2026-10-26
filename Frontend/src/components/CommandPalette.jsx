import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CornerDownLeft,
  KeyRound,
  LogOut,
  Search,
  X,
} from "lucide-react";

export default function CommandPalette({
  onClose,
  navItems,
  roleLabel,
  onLogout,
}) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(
    () => [
      ...navItems.map((item) => ({
        id: item.path,
        label: item.label,
        group: item.group || "Workspace",
        icon: item.icon,
        run: () => navigate(item.path),
      })),
      {
        id: "change-password",
        label: "Change password",
        group: "Account",
        icon: KeyRound,
        run: () => navigate("/change-password"),
      },
      {
        id: "logout",
        label: "Sign out",
        group: "Account",
        icon: LogOut,
        run: onLogout,
      },
    ],
    [navItems, navigate, onLogout],
  );

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands.filter((command) =>
      `${command.label} ${command.group}`.toLowerCase().includes(value),
    );
  }, [commands, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const safeIndex = Math.min(
    activeIndex,
    Math.max(0, filtered.length - 1),
  );

  const runCommand = (command) => {
    onClose();
    command.run();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(
        filtered.length ? (safeIndex + 1) % filtered.length : 0,
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        filtered.length
          ? (safeIndex - 1 + filtered.length) % filtered.length
          : 0,
      );
    }
    if (event.key === "Enter" && filtered[safeIndex]) {
      event.preventDefault();
      runCommand(filtered[safeIndex]);
    }
  };

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-hcm-ink/55 px-4 pt-[12vh] backdrop-blur-sm sm:pt-[16vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        className="hcm-rise-in w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-hcm-surface shadow-[0_40px_120px_-30px_rgba(16,37,31,0.75)]"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-hcm-line px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-hcm-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm text-hcm-ink outline-none placeholder:text-[#9aa39e]"
            aria-label="Search pages and actions"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-hcm-muted transition hover:bg-hcm-ink/5 hover:text-hcm-ink"
            aria-label="Close command menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filtered.length ? (
            filtered.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;
              return (
                <div key={command.id}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-hcm-muted first:pt-1.5">
                      {command.group}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => runCommand(command)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      index === safeIndex
                        ? "bg-hcm-ink text-hcm-surface"
                        : "text-hcm-ink hover:bg-[#f3efe5]"
                    }`}
                  >
                    <command.icon
                      className={`h-4 w-4 shrink-0 ${
                        index === safeIndex
                          ? "text-hcm-lime"
                          : "text-hcm-muted"
                      }`}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {command.label}
                    </span>
                    <ArrowRight
                      className={`h-3.5 w-3.5 shrink-0 ${
                        index === safeIndex ? "text-hcm-lime" : "text-[#b5b0a4]"
                      }`}
                    />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="px-4 py-10 text-center text-sm text-hcm-muted">
              No results. Try a different search.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hcm-line bg-[#faf7f0] px-4 py-2.5 text-[10px] font-medium text-hcm-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded border border-hcm-line bg-white px-1.5 py-0.5 font-mono">
              ↑ ↓
            </span>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> Open
          </span>
          <span className="hidden sm:inline">{roleLabel} workspace</span>
        </div>
      </div>
    </div>
  );
}
