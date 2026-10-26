import { useCallback, useEffect, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import CheckInCard from "../../components/CheckInCard";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const statusClasses = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  late: "bg-amber-50 text-amber-700 ring-amber-600/20",
  half_day: "bg-orange-50 text-orange-700 ring-orange-600/20",
  absent: "bg-rose-50 text-rose-700 ring-rose-600/20",
  on_leave: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  missing_checkout: "bg-rose-50 text-rose-700 ring-rose-600/20",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

const statusLabel = (value) => (value || "unknown").replaceAll("_", " ");

const fetchAttendanceData = async (range) => {
  const [attendanceResponse, correctionResponse] = await Promise.all([
    API.get("/attendance", { params: { ...range, limit: 60 } }),
    API.get("/attendance-corrections"),
  ]);
  return {
    attendance: attendanceResponse.data.attendance || [],
    corrections: correctionResponse.data || [],
  };
};

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "—";

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${
        statusClasses[status] || "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  const role = user?.role;
  const isSelfService = role === "employee" || role === "hr";
  const isReviewer = role === "hr";
  const [attendance, setAttendance] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: "", endDate: "" });
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const [reviewComments, setReviewComments] = useState({});
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    checkIn: "",
    checkOut: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAttendance = useCallback(async (range) => {
    setLoading(true);
    try {
      const result = await fetchAttendanceData(range);
      setAttendance(result.attendance);
      setCorrections(result.corrections);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAttendanceData(appliedFilters)
      .then((result) => {
        if (!active) return;
        setAttendance(result.attendance);
        setCorrections(result.corrections);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load attendance",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedFilters]);

  const applyFilters = (event) => {
    event.preventDefault();
    setLoading(true);
    setAppliedFilters({ ...filters });
  };

  const requestCorrection = async (event) => {
    event.preventDefault();
    if (!formData.checkIn && !formData.checkOut) {
      toast.error("Provide a corrected check-in or check-out time.");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/attendance-corrections/request", {
        date: formData.date,
        checkIn: formData.checkIn
          ? new Date(`${formData.date}T${formData.checkIn}`).toISOString()
          : undefined,
        checkOut: formData.checkOut
          ? new Date(`${formData.date}T${formData.checkOut}`).toISOString()
          : undefined,
        reason: formData.reason,
      });
      toast.success("Correction request submitted");
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        checkIn: "",
        checkOut: "",
        reason: "",
      });
      await loadAttendance(appliedFilters);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const reviewCorrection = async (correction, decision) => {
    try {
      await API.put(`/attendance-corrections/${correction._id}/${decision}`, {
        comment: reviewComments[correction._id] || "",
      });
      toast.success(
        decision === "approve" ? "Correction approved" : "Correction rejected",
      );
      await loadAttendance(appliedFilters);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to review request");
    }
  };

  const pendingCorrections = corrections.filter(
    (correction) => correction.status === "pending",
  );

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              {isSelfService ? "Time & attendance" : "Attendance control"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Attendance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {isSelfService
                ? "Check in, review your calendar and raise a correction if something went wrong."
                : "A live view of the daily board, correction queue and attendance history."}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Server-stamped time
          </div>
        </div>
      </header>

      {isSelfService && <CheckInCard compact />}

      {isSelfService && (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Correction request
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Something not recorded?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Request a fix. HR will review it with your reason.
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <RefreshCw className="h-5 w-5" />
              </span>
            </div>
            <form onSubmit={requestCorrection} className="mt-5 space-y-3">
              <label className="block text-xs font-medium text-slate-500">
                Date
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={formData.date}
                  onChange={(event) =>
                    setFormData({ ...formData, date: event.target.value })
                  }
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-500">
                  Correct check-in
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={formData.checkIn}
                    onChange={(event) =>
                      setFormData({ ...formData, checkIn: event.target.value })
                    }
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Correct check-out
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    value={formData.checkOut}
                    onChange={(event) =>
                      setFormData({ ...formData, checkOut: event.target.value })
                    }
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-500">
                Reason
                <textarea
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  placeholder="What happened?"
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
                  <Check className="h-4 w-4" />
                )}
                Submit correction
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Your requests
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Correction history
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {corrections.length}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {corrections.length ? (
                corrections.slice(0, 5).map((correction) => (
                  <div
                    key={correction._id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800">
                        {formatDate(correction.date)}
                      </p>
                      <StatusBadge status={correction.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {correction.requestedCheckIn
                        ? `In ${formatTime(correction.requestedCheckIn)}`
                        : "No check-in"}{" "}
                      ·{" "}
                      {correction.requestedCheckOut
                        ? `Out ${formatTime(correction.requestedCheckOut)}`
                        : "No check-out"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {correction.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No correction requests yet.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {isReviewer && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                HR approval queue
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Attendance corrections
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              {pendingCorrections.length} pending
            </span>
          </div>

          {corrections.length ? (
            <div className="mt-4 space-y-3">
              {corrections.map((correction) => (
                <div
                  key={correction._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {correction.employee?.firstName}{" "}
                          {correction.employee?.lastName}
                        </p>
                        <StatusBadge status={correction.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(correction.date)} ·{" "}
                        {correction.requestedCheckIn
                          ? `In ${formatTime(correction.requestedCheckIn)}`
                          : "No check-in"}{" "}
                        ·{" "}
                        {correction.requestedCheckOut
                          ? `Out ${formatTime(correction.requestedCheckOut)}`
                          : "No check-out"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {correction.reason}
                      </p>
                      {correction.reviewComment && (
                        <p className="mt-1 text-xs text-slate-400">
                          HR comment: {correction.reviewComment}
                        </p>
                      )}
                    </div>
                    {correction.status === "pending" && (
                      <div className="flex min-w-56 flex-col gap-2 sm:items-end">
                        <input
                          aria-label={`Review comment for ${correction.employee?.firstName || "employee"}`}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
                          placeholder="Optional comment"
                          value={reviewComments[correction._id] || ""}
                          onChange={(event) =>
                            setReviewComments({
                              ...reviewComments,
                              [correction._id]: event.target.value,
                            })
                          }
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              reviewCorrection(correction, "approve")
                            }
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reviewCorrection(correction, "reject")
                            }
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700">
              No correction requests in the queue.
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-end sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {isSelfService ? "My calendar" : "Daily board"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Attendance history
            </h2>
          </div>
          <form
            onSubmit={applyFilters}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="text-xs font-medium text-slate-500">
              From
              <input
                type="date"
                className="mt-1 block rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-400"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters({ ...filters, startDate: event.target.value })
                }
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              To
              <input
                type="date"
                className="mt-1 block rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-400"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters({ ...filters, endDate: event.target.value })
                }
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
            {(appliedFilters.startDate || appliedFilters.endDate) && (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setFilters({ startDate: "", endDate: "" });
                  setAppliedFilters({ startDate: "", endDate: "" });
                }}
                className="rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading attendance...
          </div>
        ) : attendance.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    {!isSelfService && <th className="px-5 py-3">Employee</th>}
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Check in</th>
                    <th className="px-5 py-3">Check out</th>
                    <th className="px-5 py-3">Hours</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((record) => (
                    <tr
                      key={record._id}
                      className="transition hover:bg-slate-50/60"
                    >
                      {!isSelfService && (
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800">
                            {record.employee?.firstName}{" "}
                            {record.employee?.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {record.employee?.employeeId}
                          </p>
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatTime(record.checkIn)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {formatTime(record.checkOut)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {record.hoursWorked || 0}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs capitalize text-slate-500">
                          {record.source === "camera" ? (
                            <Camera className="h-3.5 w-3.5 text-blue-500" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          {record.source || "web"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {attendance.map((record) => (
                <div key={record._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {isSelfService
                          ? formatDate(record.date)
                          : `${record.employee?.firstName || ""} ${record.employee?.lastName || ""}`}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {isSelfService
                          ? "Your record"
                          : formatDate(record.date)}
                      </p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">In</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {formatTime(record.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Out</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {formatTime(record.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">
                        Hours
                      </p>
                      <p className="text-xs font-semibold text-slate-700">
                        {record.hoursWorked || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No attendance records
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Records appear after the first check-in.
            </p>
          </div>
        )}
      </section>

      {!isSelfService && !isReviewer && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Admin can view every attendance record and correction. HR approves or
          rejects correction requests.
        </div>
      )}

      {isReviewer && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="h-3.5 w-3.5" />
          Approved corrections update the attendance record through the server.
        </p>
      )}
    </div>
  );
}
