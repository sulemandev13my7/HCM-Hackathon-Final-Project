import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../contexts/useAuth";
import { Button, PageHeader } from "../../components/ui";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const periodLabel = (month, year) =>
  `${MONTHS[Number(month) - 1] || "Period"} ${year}`;

const loadPayslips = () => API.get("/payroll/my/payslips");
const loadRuns = () => API.get("/payroll");

export default function Payroll() {
  const { user } = useAuth();
  const role = user?.role;
  const isEmployee = role === "employee";
  const canCreatePayroll = role === "hr";
  const canFinalizePayroll = role === "admin";
  const [runs, setRuns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [selectedRun, setSelectedRun] = useState(null);
  const [runLoading, setRunLoading] = useState("");
  const [runSearch, setRunSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [downloading, setDownloading] = useState("");

  const refresh = useCallback(async () => {
    try {
      if (isEmployee) {
        const response = await loadPayslips();
        setPayslips(response.data || []);
      } else {
        const response = await loadRuns();
        setRuns(response.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load payroll");
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    let active = true;
    const request = isEmployee ? loadPayslips() : loadRuns();
    request
      .then((response) => {
        if (!active) return;
        if (isEmployee) setPayslips(response.data || []);
        else setRuns(response.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load payroll",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEmployee]);

  const metrics = useMemo(() => {
    if (isEmployee) {
      const totalEarned = payslips.reduce(
        (sum, payslip) => sum + Number(payslip.netPay || 0),
        0,
      );
      return {
        primary: payslips.length,
        primaryLabel: "Payslips available",
        totalEarned,
        latest: payslips[0],
      };
    }
    const finalized = runs.filter((run) => run.status === "finalized");
    return {
      totalPaid: finalized.reduce(
        (sum, run) => sum + Number(run.totalNet || 0),
        0,
      ),
      drafts: runs.filter((run) => run.status === "draft").length,
      finalized: finalized.length,
      latest: finalized[0],
    };
  }, [isEmployee, payslips, runs]);

  const createRun = async (event) => {
    event.preventDefault();
    if (Number(formData.year) < 2000 || Number(formData.year) > 9999) {
      toast.error("Enter a valid payroll year");
      return;
    }
    setBusy("create");
    try {
      await API.post("/payroll", {
        month: Number(formData.month),
        year: Number(formData.year),
      });
      toast.success("Payroll run created");
      setShowForm(false);
      await refresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create payroll run",
      );
    } finally {
      setBusy("");
    }
  };

  const finalize = async (id) => {
    if (!window.confirm("Finalize this payroll run? Payslips will be unlocked.")) {
      return;
    }
    setBusy(id);
    try {
      await API.put(`/payroll/${id}/finalize`);
      toast.success("Payroll finalized");
      setSelectedRun(null);
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to finalize payroll");
    } finally {
      setBusy("");
    }
  };

  const openRun = async (run) => {
    setRunLoading(run._id);
    setRunSearch("");
    try {
      const response = await API.get(`/payroll/${run._id}`);
      setSelectedRun(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load payroll");
    } finally {
      setRunLoading("");
    }
  };

  const downloadPayslip = async ({ runId, employeeId, year, month }) => {
    const key = `${runId}-${employeeId || "self"}`;
    setDownloading(key);
    try {
      const path = employeeId
        ? `/payroll/${runId}/payslip/${employeeId}/pdf`
        : `/payroll/${runId}/payslip.pdf`;
      const response = await API.get(path, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payslip_${year}_${month}${
        employeeId ? `_${employeeId}` : ""
      }.pdf`;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      toast.success("Payslip downloaded");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to download payslip");
    } finally {
      setDownloading("");
    }
  };

  const filteredItems = useMemo(() => {
    const items = selectedRun?.items || [];
    const query = runSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => {
      const employee = item.employee;
      return (
        `${employee?.firstName || ""} ${employee?.lastName || ""}`
          .toLowerCase()
          .includes(query) ||
        `${employee?.employeeId || ""}`.toLowerCase().includes(query)
      );
    });
  }, [selectedRun, runSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isEmployee ? "Compensation" : "Payroll control"}
        title={isEmployee ? "My payslips" : "Payroll"}
        description={
          isEmployee
            ? "Every finalized payslip, ready to download."
            : "Create runs, validate totals and release payslips with confidence."
        }
        meta={
          <>
            <span className="hcm-chip-dark">
              <Wallet className="h-3.5 w-3.5" />
              {isEmployee ? `${payslips.length} payslips` : `${runs.length} runs`}
            </span>
            <span className="hcm-chip-dark">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finalized payslips only
            </span>
          </>
        }
        actions={
          canCreatePayroll && (
            <Button
              variant="inverse"
              onClick={() => setShowForm((value) => !value)}
            >
              <Plus className="h-4 w-4" />
              Create payroll run
            </Button>
          )
        }
      />

      {canCreatePayroll && showForm && (
        <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-accent">
                New run
              </p>
              <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                Choose a payroll period
              </h2>
              <p className="mt-1 text-sm text-hcm-muted">
                Attendance, leave and salary structures are calculated by the
                server.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas"
              aria-label="Close payroll form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form
            onSubmit={createRun}
            className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_1fr_auto]"
          >
            <label className="text-xs font-medium text-hcm-muted">
              Month
              <select
                className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10"
                value={formData.month}
                onChange={(event) =>
                  setFormData({ ...formData, month: event.target.value })
                }
                required
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-hcm-muted">
              Year
              <input
                type="number"
                min="2000"
                max="9999"
                className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10"
                value={formData.year}
                onChange={(event) =>
                  setFormData({ ...formData, year: event.target.value })
                }
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy === "create"}
              className="self-end inline-flex items-center justify-center gap-2 rounded-xl bg-hcm-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-hcm-accent-strong disabled:opacity-60"
            >
              {busy === "create" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeDollarSign className="h-4 w-4" />
              )}
              Generate
            </button>
          </form>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-hcm-line bg-white p-16 text-sm text-hcm-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading payroll...
        </div>
      ) : isEmployee ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-hcm-ink/10 bg-hcm-ink p-5 text-white">
              <p className="text-sm text-white/55">Total net earned</p>
              <p className="mt-2 text-2xl font-semibold">
                {currency(metrics.totalEarned)}
              </p>
              <p className="mt-1 text-xs text-white/55">
                Across {metrics.primary} finalized payslip
                {metrics.primary === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm">
              <p className="text-sm text-hcm-muted">Latest payslip</p>
              <p className="mt-2 text-lg font-semibold text-hcm-ink">
                {metrics.latest
                  ? periodLabel(metrics.latest.month, metrics.latest.year)
                  : "No payslip yet"}
              </p>
              <p className="mt-1 text-xs text-hcm-muted">
                {metrics.latest
                  ? currency(metrics.latest.netPay)
                  : "HR has not finalized a run for you."}
              </p>
            </div>
            <div className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm">
              <p className="text-sm text-hcm-muted">Downloads</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-hcm-ink">
                <FileText className="h-5 w-5 text-hcm-accent" />
                PDF payslip
              </p>
              <p className="mt-1 text-xs text-hcm-muted">
                Generated from finalized payroll data.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-hcm-line bg-white shadow-sm">
            <div className="border-b border-hcm-line/80 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-hcm-ink">
                Payslip history
              </h2>
              <p className="mt-0.5 text-sm text-hcm-muted">
                Only finalized runs can be downloaded.
              </p>
            </div>
            {payslips.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-hcm-surface-soft text-left text-[11px] uppercase tracking-wide text-hcm-muted">
                      <tr>
                        <th className="px-6 py-3">Period</th>
                        <th className="px-6 py-3">Gross</th>
                        <th className="px-6 py-3">Net pay</th>
                        <th className="px-6 py-3 text-right">Payslip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hcm-line">
                      {payslips.map((payslip) => {
                        const key = `${payslip.runId}-self`;
                        return (
                          <tr
                            key={payslip.runId}
                            className="transition hover:bg-hcm-surface-soft"
                          >
                            <td className="px-6 py-4 font-medium text-hcm-ink">
                              {periodLabel(payslip.month, payslip.year)}
                            </td>
                            <td className="px-6 py-4 text-hcm-muted">
                              {currency(payslip.gross)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-hcm-ink">
                              {currency(payslip.netPay)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  downloadPayslip({
                                    runId: payslip.runId,
                                    year: payslip.year,
                                    month: payslip.month,
                                  })
                                }
                                disabled={downloading === key}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-hcm-accent px-3 py-2 text-xs font-semibold text-white hover:bg-hcm-accent-strong disabled:opacity-60"
                              >
                                {downloading === key ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ArrowDownToLine className="h-3.5 w-3.5" />
                                )}
                                Download
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-hcm-line md:hidden">
                  {payslips.map((payslip) => {
                    const key = `${payslip.runId}-self`;
                    return (
                      <div key={payslip.runId} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-hcm-ink">
                              {periodLabel(payslip.month, payslip.year)}
                            </p>
                            <p className="mt-1 text-xs text-hcm-muted">
                              Gross {currency(payslip.gross)}
                            </p>
                          </div>
                          <p className="font-semibold text-hcm-ink">
                            {currency(payslip.netPay)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            downloadPayslip({
                              runId: payslip.runId,
                              year: payslip.year,
                              month: payslip.month,
                            })
                          }
                          disabled={downloading === key}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-hcm-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {downloading === key ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                          )}
                          Download payslip
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-hcm-muted/40" />
                <p className="mt-2 text-sm font-medium text-hcm-ink">
                  No payslips yet
                </p>
                <p className="mt-1 text-xs text-hcm-muted">
                  Your first payslip appears after HR finalizes a payroll run.
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-hcm-ink/10 bg-hcm-ink p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/55">Total net paid</p>
                <Wallet className="h-5 w-5 text-hcm-lime" />
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {currency(metrics.totalPaid)}
              </p>
              <p className="mt-1 text-xs text-white/55">
                From {metrics.finalized} finalized run
                {metrics.finalized === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-hcm-muted">Draft runs</p>
                <Clock3 className="h-5 w-5 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-hcm-ink">
                {metrics.drafts}
              </p>
              <p className="mt-1 text-xs text-hcm-muted">
                Awaiting admin finalization
              </p>
            </div>
            <div className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-hcm-muted">Total runs</p>
                <CalendarDays className="h-5 w-5 text-hcm-accent" />
              </div>
              <p className="mt-2 text-2xl font-semibold text-hcm-ink">
                {runs.length}
              </p>
              <p className="mt-1 text-xs text-hcm-muted">
                Across all payroll periods
              </p>
            </div>
            <div className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-hcm-muted">Latest release</p>
                <CheckCircle2 className="h-5 w-5 text-hcm-accent" />
              </div>
              <p className="mt-2 text-lg font-semibold text-hcm-ink">
                {metrics.latest
                  ? periodLabel(metrics.latest.month, metrics.latest.year)
                  : "No release"}
              </p>
              <p className="mt-1 text-xs text-hcm-muted">
                {metrics.latest
                  ? currency(metrics.latest.totalNet)
                  : "Finalize a run to release payslips."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-hcm-line bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hcm-line/80 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-hcm-ink">
                  Payroll runs
                </h2>
                <p className="mt-0.5 text-sm text-hcm-muted">
                  Latest periods first. Open a run to review every employee.
                </p>
              </div>
              <span className="rounded-full bg-hcm-canvas-deep px-3 py-1.5 text-xs font-semibold text-hcm-muted">
                {runs.length} periods
              </span>
            </div>

            {runs.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-hcm-surface-soft text-left text-[11px] uppercase tracking-wide text-hcm-muted">
                      <tr>
                        <th className="px-6 py-3">Period</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Working days</th>
                        <th className="px-6 py-3">Gross</th>
                        <th className="px-6 py-3">Net</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hcm-line">
                      {runs.map((run) => (
                        <tr
                          key={run._id}
                          className="transition hover:bg-hcm-surface-soft"
                        >
                          <td className="px-6 py-4">
                            <p className="font-medium text-hcm-ink">
                              {periodLabel(run.month, run.year)}
                            </p>
                            <p className="text-xs text-hcm-muted">
                              {run.items?.length || 0} employees
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${
                                run.status === "finalized"
                                  ? "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20"
                                  : "bg-amber-50 text-amber-700 ring-amber-600/20"
                              }`}
                            >
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-hcm-muted">
                            {run.workingDays}
                          </td>
                          <td className="px-6 py-4 text-hcm-muted">
                            {currency(run.totalGross)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-hcm-ink">
                            {currency(run.totalNet)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openRun(run)}
                                disabled={runLoading === run._id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-hcm-line px-3 py-2 text-xs font-medium text-hcm-ink hover:bg-hcm-canvas disabled:opacity-60"
                              >
                                {runLoading === run._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                                View
                              </button>
                              {run.status === "draft" &&
                                canFinalizePayroll && (
                                  <button
                                    type="button"
                                    onClick={() => finalize(run._id)}
                                    disabled={busy === run._id}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-hcm-accent px-3 py-2 text-xs font-semibold text-white hover:bg-hcm-accent-strong disabled:opacity-60"
                                  >
                                    {busy === run._id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    Finalize
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-hcm-line md:hidden">
                  {runs.map((run) => (
                    <div key={run._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-hcm-ink">
                            {periodLabel(run.month, run.year)}
                          </p>
                          <p className="mt-0.5 text-xs text-hcm-muted">
                            {run.items?.length || 0} employees ·{" "}
                            {run.workingDays} working days
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${
                            run.status === "finalized"
                              ? "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20"
                              : "bg-amber-50 text-amber-700 ring-amber-600/20"
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-hcm-surface-soft p-3 text-xs">
                        <div>
                          <p className="text-hcm-muted">Gross</p>
                          <p className="font-semibold text-hcm-ink">
                            {currency(run.totalGross)}
                          </p>
                        </div>
                        <div>
                          <p className="text-hcm-muted">Net</p>
                          <p className="font-semibold text-hcm-ink">
                            {currency(run.totalNet)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openRun(run)}
                          disabled={runLoading === run._id}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hcm-line px-3 py-2 text-xs font-medium text-hcm-ink disabled:opacity-60"
                        >
                          {runLoading === run._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          View run
                        </button>
                        {run.status === "draft" && canFinalizePayroll && (
                          <button
                            type="button"
                            onClick={() => finalize(run._id)}
                            disabled={busy === run._id}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-hcm-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {busy === run._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Finalize
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <Users className="mx-auto h-8 w-8 text-hcm-muted/40" />
                <p className="mt-2 text-sm font-medium text-hcm-ink">
                  No payroll runs
                </p>
                <p className="mt-1 text-xs text-hcm-muted">
                  HR can generate the first payroll period from the button above.
                </p>
              </div>
            )}
          </section>
        </>
      )}

      {selectedRun && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-hcm-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payroll-run-title"
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-hcm-surface shadow-hcm sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-hcm-line/80 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-muted">
                  Payroll detail
                </p>
                <h2
                  id="payroll-run-title"
                  className="mt-1 text-xl font-semibold text-hcm-ink"
                >
                  {periodLabel(selectedRun.month, selectedRun.year)}
                </h2>
                <p className="mt-1 text-sm text-hcm-muted">
                  {selectedRun.items?.length || 0} employees ·{" "}
                  {selectedRun.workingDays} working days ·{" "}
                  <span className="capitalize">{selectedRun.status}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas"
                aria-label="Close payroll details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedRun.status !== "finalized" && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800 sm:px-6">
                <span>
                  This run is still a draft. Finalize it to unlock payslips.
                </span>
                {canFinalizePayroll && (
                  <button
                    type="button"
                    onClick={() => finalize(selectedRun._id)}
                    disabled={busy === selectedRun._id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-hcm-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-hcm-accent-strong disabled:opacity-60"
                  >
                    {busy === selectedRun._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Finalize now
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-b border-hcm-line/80 p-5 sm:grid-cols-4 sm:p-6">
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Gross
                </p>
                <p className="mt-1 text-sm font-semibold text-hcm-ink">
                  {currency(selectedRun.totalGross)}
                </p>
              </div>
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Net
                </p>
                <p className="mt-1 text-sm font-semibold text-hcm-ink">
                  {currency(selectedRun.totalNet)}
                </p>
              </div>
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Employees
                </p>
                <p className="mt-1 text-sm font-semibold text-hcm-ink">
                  {selectedRun.items?.length || 0}
                </p>
              </div>
              <div className="rounded-xl bg-hcm-surface-soft p-3">
                <p className="text-[11px] uppercase tracking-wide text-hcm-muted">
                  Working days
                </p>
                <p className="mt-1 text-sm font-semibold text-hcm-ink">
                  {selectedRun.workingDays}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-hcm-line/80 px-5 py-3 sm:px-6">
              <Search className="h-4 w-4 text-hcm-muted" />
              <input
                value={runSearch}
                onChange={(event) => setRunSearch(event.target.value)}
                placeholder="Search employee or ID"
                className="w-full bg-transparent text-sm text-hcm-ink outline-none placeholder:text-hcm-muted"
              />
            </div>

            <div className="flex-1 overflow-auto">
              {filteredItems.length ? (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[46rem] text-sm">
                      <thead className="sticky top-0 bg-hcm-surface-soft text-left text-[11px] uppercase tracking-wide text-hcm-muted">
                        <tr>
                          <th className="px-5 py-3">Employee</th>
                          <th className="px-5 py-3">Gross</th>
                          <th className="px-5 py-3">Deductions</th>
                          <th className="px-5 py-3">Net pay</th>
                          <th className="px-5 py-3 text-right">Payslip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hcm-line">
                        {filteredItems.map((item) => {
                          const employee = item.employee;
                          const employeeId = employee?._id || item.employee;
                          const key = `${selectedRun._id}-${employeeId}`;
                          return (
                            <tr key={employeeId} className="hover:bg-hcm-surface-soft">
                              <td className="px-5 py-3.5">
                                <p className="font-medium text-hcm-ink">
                                  {employee?.firstName
                                    ? `${employee.firstName} ${employee.lastName || ""}`
                                    : "Unknown employee"}
                                </p>
                                <p className="text-xs text-hcm-muted">
                                  {employee?.employeeId || "—"}
                                </p>
                              </td>
                              <td className="px-5 py-3.5 text-hcm-muted">
                                {currency(item.gross)}
                              </td>
                              <td className="px-5 py-3.5 text-hcm-muted">
                                {currency(item.deductions)}
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-hcm-ink">
                                {currency(item.netPay)}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {selectedRun.status === "finalized" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadPayslip({
                                        runId: selectedRun._id,
                                        employeeId,
                                        year: selectedRun.year,
                                        month: selectedRun.month,
                                      })
                                    }
                                    disabled={downloading === key}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-hcm-line px-3 py-1.5 text-xs font-medium text-hcm-ink hover:bg-hcm-canvas disabled:opacity-60"
                                  >
                                    {downloading === key ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <ArrowDownToLine className="h-3.5 w-3.5" />
                                    )}
                                    PDF
                                  </button>
                                ) : (
                                  <span className="text-xs text-hcm-muted">
                                    Locked
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-hcm-line md:hidden">
                    {filteredItems.map((item) => {
                      const employee = item.employee;
                      const employeeId = employee?._id || item.employee;
                      const key = `${selectedRun._id}-${employeeId}`;
                      return (
                        <div key={employeeId} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-hcm-ink">
                                {employee?.firstName
                                  ? `${employee.firstName} ${employee.lastName || ""}`
                                  : "Unknown employee"}
                              </p>
                              <p className="text-xs text-hcm-muted">
                                {employee?.employeeId || "—"}
                              </p>
                            </div>
                            <p className="font-semibold text-hcm-ink">
                              {currency(item.netPay)}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-hcm-muted">
                            Gross {currency(item.gross)} · Deductions{" "}
                            {currency(item.deductions)}
                          </p>
                          {selectedRun.status === "finalized" && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadPayslip({
                                  runId: selectedRun._id,
                                  employeeId,
                                  year: selectedRun.year,
                                  month: selectedRun.month,
                                })
                              }
                              disabled={downloading === key}
                              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-hcm-line px-3 py-2 text-xs font-medium text-hcm-ink disabled:opacity-60"
                            >
                              {downloading === key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ArrowDownToLine className="h-3.5 w-3.5" />
                              )}
                              Download payslip
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="p-10 text-center text-sm text-hcm-muted">
                  No employees match this search.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
