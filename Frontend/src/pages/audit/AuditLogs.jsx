import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import { PageHeader } from "../../components/ui";
import toast from "react-hot-toast";
import {
  Activity,
  ChevronRight,
  Clock3,
  FileClock,
  Filter,
  Loader2,
  Search,
  Shield,
  UserRound,
  X,
} from "lucide-react";

const actionTone = {
  create: "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20",
  update: "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20",
  update_status: "bg-amber-50 text-amber-700 ring-amber-600/20",
  update_salary: "bg-violet-50 text-violet-700 ring-violet-600/20",
  update_profile: "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20",
  delete: "bg-rose-50 text-rose-700 ring-rose-600/20",
  approve: "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20",
  reject: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancel: "bg-orange-50 text-orange-700 ring-orange-600/20",
  login: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  change_password: "bg-hcm-canvas-deep text-hcm-ink ring-hcm-muted/20",
  reset_password: "bg-amber-50 text-amber-700 ring-amber-600/20",
  finalize: "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20",
};

const dateLabel = (value) =>
  new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const pretty = (value) => {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    let active = true;
    API.get("/audit-logs")
      .then((response) => {
        if (active) setLogs(response.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load audit logs",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const actions = useMemo(
    () => [...new Set(logs.map((log) => log.action))].sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (!query) return true;
      return [
        log.actor?.firstName,
        log.actor?.lastName,
        log.actor?.email,
        log.actorRole,
        log.action,
        log.entity,
        log.entityId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [logs, search, actionFilter]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter((log) => new Date(log.createdAt).toDateString() === today)
      .length;
  }, [logs]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accountability"
        title="Audit logs"
        description="A read-only trail of important actions. Credential fields are redacted before storage."
        meta={
          <>
            <span className="hcm-chip-dark">
              <FileClock className="h-3.5 w-3.5" />
              {logs.length} recent events
            </span>
            <span className="hcm-chip-dark">
              <Clock3 className="h-3.5 w-3.5" />
              {todayCount} today
            </span>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Recent events", value: logs.length, icon: FileClock },
          { label: "Today", value: todayCount, icon: Clock3 },
          { label: "Unique actions", value: actions.length, icon: Activity },
          {
            label: "Tracked entities",
            value: new Set(logs.map((log) => log.entity)).size,
            icon: Shield,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-hcm-line bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-hcm-muted">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-hcm-muted/40" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-hcm-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-hcm-line bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-hcm-line/80 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-hcm-ink">
              Activity trail
            </h2>
            <p className="mt-0.5 text-sm text-hcm-muted">
              {filtered.length} of {logs.length} events
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search actor, action or entity"
                className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-7 text-sm capitalize text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white sm:w-48"
              >
                <option value="all">All actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-hcm-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading audit trail...
          </div>
        ) : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-hcm-surface-soft text-left text-[11px] uppercase tracking-wide text-hcm-muted">
                  <tr>
                    <th className="px-6 py-3">When</th>
                    <th className="px-6 py-3">Actor</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Entity</th>
                    <th className="px-6 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hcm-line">
                  {filtered.map((log) => (
                    <tr key={log._id} className="hover:bg-hcm-surface-soft">
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-hcm-muted">
                        {dateLabel(log.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-hcm-ink">
                          {log.actor?.firstName
                            ? `${log.actor.firstName} ${log.actor.lastName || ""}`
                            : "System"}
                        </p>
                        <p className="text-xs capitalize text-hcm-muted">
                          {log.actorRole || "unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${actionTone[log.action] || "bg-hcm-canvas-deep text-hcm-muted ring-hcm-muted/20"}`}
                        >
                          {log.action.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="capitalize text-hcm-muted">
                          {log.entity?.replaceAll("_", " ")}
                        </p>
                        {log.entityId && (
                          <p className="max-w-32 truncate text-xs text-hcm-muted">
                            {log.entityId}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          disabled={!log.before && !log.after}
                          className="inline-flex items-center gap-1 rounded-lg border border-hcm-line px-3 py-1.5 text-xs font-medium text-hcm-ink hover:bg-hcm-canvas disabled:cursor-not-allowed disabled:text-hcm-muted/40"
                        >
                          Inspect
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-hcm-line md:hidden">
              {filtered.map((log) => (
                <button
                  key={log._id}
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  disabled={!log.before && !log.after}
                  className="block w-full p-4 text-left transition hover:bg-hcm-canvas disabled:cursor-default"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-hcm-ink">
                        {log.actor?.firstName
                          ? `${log.actor.firstName} ${log.actor.lastName || ""}`
                          : "System"}
                      </p>
                      <p className="mt-0.5 text-xs text-hcm-muted">
                        {dateLabel(log.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${actionTone[log.action] || "bg-hcm-canvas-deep text-hcm-muted ring-hcm-muted/20"}`}
                    >
                      {log.action.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs capitalize text-hcm-muted">
                    {log.entity?.replaceAll("_", " ")} ·{" "}
                    {log.actorRole || "unknown"}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <FileClock className="mx-auto h-8 w-8 text-hcm-muted/40" />
            <p className="mt-2 text-sm font-medium text-hcm-ink">
              No audit events match
            </p>
            <p className="mt-1 text-xs text-hcm-muted">
              Adjust the search or action filter.
            </p>
          </div>
        )}
      </section>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-hcm-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-detail-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-hcm-surface shadow-hcm sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-hcm-line/80 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-muted">
                  Audit detail
                </p>
                <h2
                  id="audit-detail-title"
                  className="mt-1 text-xl font-semibold capitalize text-hcm-ink"
                >
                  {selectedLog.action.replaceAll("_", " ")}
                </h2>
                <p className="mt-1 text-sm text-hcm-muted">
                  {dateLabel(selectedLog.createdAt)} ·{" "}
                  {selectedLog.actor?.firstName || "System"}{" "}
                  {selectedLog.actor?.lastName || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas"
                aria-label="Close audit details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-hcm-line/80 p-5 sm:grid-cols-4 sm:p-6">
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Entity
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-hcm-ink">
                  {selectedLog.entity?.replaceAll("_", " ")}
                </p>
              </div>
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Role
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-hcm-ink">
                  {selectedLog.actorRole || "—"}
                </p>
              </div>
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Entity ID
                </p>
                <p className="mt-1 truncate text-sm text-hcm-ink">
                  {selectedLog.entityId || "—"}
                </p>
              </div>
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  IP address
                </p>
                <p className="mt-1 text-sm text-hcm-ink">
                  {selectedLog.ipAddress || "—"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hcm-muted">
                    <UserRound className="h-3.5 w-3.5" /> Before
                  </p>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-[10px] bg-hcm-ink p-4 text-[11px] leading-5 text-white/70">
                    {pretty(selectedLog.before) || "No snapshot recorded"}
                  </pre>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hcm-muted">
                    <UserRound className="h-3.5 w-3.5" /> After
                  </p>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-[10px] bg-hcm-ink p-4 text-[11px] leading-5 text-white/70">
                    {pretty(selectedLog.after) || "No snapshot recorded"}
                  </pre>
                </div>
              </div>
              {selectedLog.userAgent && (
                <p className="mt-4 break-words rounded-xl bg-hcm-surface-soft p-3 text-xs text-hcm-muted">
                  <span className="font-medium text-hcm-ink">User agent:</span>{" "}
                  {selectedLog.userAgent}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
