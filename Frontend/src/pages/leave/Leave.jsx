import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

const statusClasses = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${
        statusClasses[status] || "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      {status}
    </span>
  );
}

const emptyForm = () => ({
  leaveTypeId: "",
  startDate: "",
  endDate: "",
  reason: "",
});

const fetchLeaveData = async (includeBalances) => {
  const requests = [API.get("/leave"), API.get("/leave-types")];
  if (includeBalances) requests.push(API.get("/leave/balances"));
  const [leaveResponse, typeResponse, balanceResponse] =
    await Promise.all(requests);
  return {
    leaves: leaveResponse.data || [],
    leaveTypes: typeResponse.data || [],
    balances: balanceResponse?.data || [],
  };
};

export default function Leave() {
  const { user } = useAuth();
  const role = user?.role;
  const isSelfService = role === "employee" || role === "hr";
  const isReviewer = role === "hr";
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyForm);
  const [smartText, setSmartText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvalComments, setApprovalComments] = useState({});

  const loadData = useCallback(async () => {
    try {
      const result = await fetchLeaveData(isSelfService);
      setLeaves(result.leaves);
      setLeaveTypes(result.leaveTypes);
      setBalances(result.balances);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }, [isSelfService]);

  useEffect(() => {
    let active = true;
    fetchLeaveData(isSelfService)
      .then((result) => {
        if (!active) return;
        setLeaves(result.leaves);
        setLeaveTypes(result.leaveTypes);
        setBalances(result.balances);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load leave data",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isSelfService]);

  const ownEmployeeId = user?.employeeId?._id || user?.employeeId;
  const isOwnLeave = useCallback(
    (leave) =>
      leave.employee?._id === ownEmployeeId ||
      leave.employee === ownEmployeeId ||
      leave.appliedBy?._id === user?.id ||
      leave.appliedBy === user?.id,
    [ownEmployeeId, user?.id],
  );

  const ownLeaves = useMemo(
    () => leaves.filter(isOwnLeave),
    [leaves, isOwnLeave],
  );
  const pendingApprovals = useMemo(
    () => leaves.filter((leave) => leave.status === "pending" && !isOwnLeave(leave)),
    [leaves, isOwnLeave],
  );

  const applySmartLeave = async () => {
    if (!smartText.trim()) return;
    setParsing(true);
    try {
      const response = await API.post("/ai/smart-leave", { text: smartText });
      const data = response.data;
      const typeMap = {
        casual: leaveTypes.find((type) =>
          type.name.toLowerCase().includes("casual"),
        )?._id,
        sick: leaveTypes.find((type) =>
          type.name.toLowerCase().includes("sick"),
        )?._id,
        annual: leaveTypes.find((type) =>
          type.name.toLowerCase().includes("annual"),
        )?._id,
        unpaid: leaveTypes.find((type) =>
          type.name.toLowerCase().includes("unpaid"),
        )?._id,
      };
      setFormData({
        leaveTypeId: typeMap[data.type] || leaveTypes[0]?._id || "",
        startDate: data.startDate || "",
        endDate: data.endDate || "",
        reason: data.reason || smartText,
      });
      toast.success("Form pre-filled — review and submit");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not understand that leave",
      );
    } finally {
      setParsing(false);
    }
  };

  const submitLeave = async (event) => {
    event.preventDefault();
    if (formData.startDate > formData.endDate) {
      toast.error("Start date must be before end date");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/leave/apply", formData);
      toast.success("Leave request submitted");
      setFormData(emptyForm());
      setSmartText("");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to apply for leave");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelLeave = async (id) => {
    try {
      await API.put(`/leave/${id}/cancel`);
      toast.success("Leave cancelled");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel leave");
    }
  };

  const reviewLeave = async (id, decision) => {
    try {
      await API.put(`/leave/${id}/${decision}`, {
        comment: approvalComments[id] || "",
      });
      toast.success(decision === "approve" ? "Leave approved" : "Leave rejected");
      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Failed to ${decision} leave`,
      );
    }
  };

  const renderLeaveRow = (leave, showEmployee) => (
    <div
      key={leave._id}
      className="flex flex-col gap-3 rounded-xl border border-slate-200/80 p-4 transition hover:border-slate-300 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {showEmployee && (
            <p className="font-medium text-slate-900">
              {leave.employee?.firstName} {leave.employee?.lastName}
            </p>
          )}
          <p
            className={`${showEmployee ? "text-sm text-slate-500" : "font-medium text-slate-900"}`}
          >
            {leave.leaveType?.name || "Leave"}
          </p>
          <StatusBadge status={leave.status} />
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {formatDate(leave.startDate)} → {formatDate(leave.endDate)} ·{" "}
          {leave.workingDays} working day{leave.workingDays === 1 ? "" : "s"}
        </p>
        {leave.reason && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {leave.reason}
          </p>
        )}
        {leave.approvalComment && (
          <p className="mt-1 text-xs text-slate-400">
            Decision note: {leave.approvalComment}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {leave.status === "pending" && isOwnLeave(leave) && (
          <button
            type="button"
            onClick={() => cancelLeave(leave._id)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              {isSelfService ? "Time off" : "Leave control"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Leave management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {isReviewer
                ? "Approve your team’s time off and keep your own balance in one place."
                : isSelfService
                  ? "Apply in seconds, see your balance, or describe your leave in plain words."
                  : "A complete view of leave requests across the company."}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-200">
            <CalendarDays className="h-4 w-4 text-emerald-300" />
            Working days computed automatically
          </span>
        </div>
      </header>

      {isSelfService && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {balances.length ? (
            balances.map((balance) => {
              const quota = Number(balance.quota) || 0;
              const remaining = Number(balance.remaining) || 0;
              const usedPercent = quota
                ? Math.min(100, Math.round((remaining / quota) * 100))
                : 0;
              return (
                <div
                  key={balance._id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                >
                  <p className="truncate text-xs font-medium text-slate-500">
                    {balance.leaveType?.name || "Leave"}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {remaining}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      left
                    </span>
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {balance.used || 0} of {quota} used
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              Leave balances will appear after HR configures leave types.
            </div>
          )}
        </section>
      )}

      {isSelfService && (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                  Smart leave
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Tell us in plain words
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  e.g. “Need next Monday and Tuesday off for a wedding.”
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={smartText}
                onChange={(event) => setSmartText(event.target.value)}
                placeholder="Describe your leave in English or Roman Urdu"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
              <button
                type="button"
                onClick={applySmartLeave}
                disabled={parsing || !smartText.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
              >
                {parsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {parsing ? "Reading..." : "Pre-fill"}
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or fill it manually
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={submitLeave} className="space-y-3">
              <label className="block text-xs font-medium text-slate-500">
                Leave type
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={formData.leaveTypeId}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      leaveTypeId: event.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name} · {type.quota} days
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-500">
                  From
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={formData.startDate}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        startDate: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  To
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={formData.endDate}
                    onChange={(event) =>
                      setFormData({ ...formData, endDate: event.target.value })
                    }
                    required
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-500">
                Reason
                <textarea
                  rows={2}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={formData.reason}
                  onChange={(event) =>
                    setFormData({ ...formData, reason: event.target.value })
                  }
                  required
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit leave request
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  My requests
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Leave history
                </h2>
              </div>
              <FileText className="h-5 w-5 text-slate-300" />
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : ownLeaves.length ? (
              <div className="mt-4 space-y-2">
                {ownLeaves.slice(0, 6).map((leave) =>
                  renderLeaveRow(leave, false),
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                You have not applied for leave yet.
              </p>
            )}
          </div>
        </section>
      )}

      {isReviewer && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                Approval inbox
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Pending leave requests
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              {pendingApprovals.length} waiting
            </span>
          </div>

          {pendingApprovals.length ? (
            <div className="mt-4 space-y-3">
              {pendingApprovals.map((leave) => (
                <div
                  key={leave._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-medium text-slate-900">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {leave.leaveType?.name} · {formatDate(leave.startDate)}{" "}
                        → {formatDate(leave.endDate)} · {leave.workingDays} day
                        {leave.workingDays === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {leave.reason}
                      </p>
                    </div>
                    <div className="flex min-w-60 flex-col gap-2">
                      <input
                        aria-label={`Decision comment for ${leave.employee?.firstName || "employee"}`}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                        placeholder="Comment (optional)"
                        value={approvalComments[leave._id] || ""}
                        onChange={(event) =>
                          setApprovalComments({
                            ...approvalComments,
                            [leave._id]: event.target.value,
                          })
                        }
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => reviewLeave(leave._id, "approve")}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewLeave(leave._id, "reject")}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-10 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Your approval inbox is clear.
            </p>
          )}
        </section>
      )}

      {role === "admin" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Company leave
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                All requests
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {leaves.length}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : leaves.length ? (
            <div className="mt-4 space-y-2">
              {leaves.map((leave) => renderLeaveRow(leave, true))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No leave requests yet.
            </p>
          )}
        </section>
      )}

      {role === "admin" && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          Admin has a company-wide view. HR approves or rejects requests.
        </p>
      )}
    </div>
  );
}
