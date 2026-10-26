import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
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
  create: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  update: "bg-blue-50 text-blue-700 ring-blue-600/20",
  update_status: "bg-amber-50 text-amber-700 ring-amber-600/20",
  update_salary: "bg-violet-50 text-violet-700 ring-violet-600/20",
  update_profile: "bg-blue-50 text-blue-700 ring-blue-600/20",
  delete: "bg-rose-50 text-rose-700 ring-rose-600/20",
  approve: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  reject: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancel: "bg-orange-50 text-orange-700 ring-orange-600/20",
  login: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  change_password: "bg-slate-100 text-slate-700 ring-slate-500/20",
  reset_password: "bg-amber-50 text-amber-700 ring-amber-600/20",
  finalize: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
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
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Accountability
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Audit logs
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            A read-only trail of important actions. Credential fields are
            redacted before storage.
          </p>
        </div>
      </header>

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
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Activity trail
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {filtered.length} of {logs.length} events
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search actor, action or entity"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-7 text-sm capitalize text-slate-800 outline-none focus:border-blue-400 focus:bg-white sm:w-48"
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
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading audit trail...
          </div>
        ) : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3">When</th>
                    <th className="px-6 py-3">Actor</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Entity</th>
                    <th className="px-6 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                        {dateLabel(log.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">
                          {log.actor?.firstName
                            ? `${log.actor.firstName} ${log.actor.lastName || ""}`
                            : "System"}
                        </p>
                        <p className="text-xs capitalize text-slate-400">
                          {log.actorRole || "unknown"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${actionTone[log.action] || "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
                        >
                          {log.action.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="capitalize text-slate-600">
                          {log.entity?.replaceAll("_", " ")}
                        </p>
                        {log.entityId && (
                          <p className="max-w-32 truncate text-xs text-slate-400">
                            {log.entityId}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          disabled={!log.before && !log.after}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
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

            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((log) => (
                <button
                  key={log._id}
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  disabled={!log.before && !log.after}
                  className="block w-full p-4 text-left transition hover:bg-slate-50 disabled:cursor-default"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {log.actor?.firstName
                          ? `${log.actor.firstName} ${log.actor.lastName || ""}`
                          : "System"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {dateLabel(log.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${actionTone[log.action] || "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
                    >
                      {log.action.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs capitalize text-slate-500">
                    {log.entity?.replaceAll("_", " ")} ·{" "}
                    {log.actorRole || "unknown"}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <FileClock className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No audit events match
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Adjust the search or action filter.
            </p>
          </div>
        )}
      </section>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-detail-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Audit detail
                </p>
                <h2
                  id="audit-detail-title"
                  className="mt-1 text-xl font-semibold capitalize text-slate-900"
                >
                  {selectedLog.action.replaceAll("_", " ")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {dateLabel(selectedLog.createdAt)} ·{" "}
                  {selectedLog.actor?.firstName || "System"}{" "}
                  {selectedLog.actor?.lastName || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close audit details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-5 sm:grid-cols-4 sm:p-6">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Entity
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-800">
                  {selectedLog.entity?.replaceAll("_", " ")}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Role
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-800">
                  {selectedLog.actorRole || "—"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Entity ID
                </p>
                <p className="mt-1 truncate text-sm text-slate-700">
                  {selectedLog.entityId || "—"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  IP address
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedLog.ipAddress || "—"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <UserRound className="h-3.5 w-3.5" /> Before
                  </p>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-200">
                    {pretty(selectedLog.before) || "No snapshot recorded"}
                  </pre>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <UserRound className="h-3.5 w-3.5" /> After
                  </p>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-200">
                    {pretty(selectedLog.after) || "No snapshot recorded"}
                  </pre>
                </div>
              </div>
              {selectedLog.userAgent && (
                <p className="mt-4 break-words rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">User agent:</span>{" "}
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
