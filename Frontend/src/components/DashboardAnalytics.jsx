import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BadgeDollarSign,
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  Filter,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../services/api";
import AdminQuickStart from "./AdminQuickStart";
import CheckInCard from "./CheckInCard";

const getDefaultFilters = () => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    startDate: `${today.slice(0, 7)}-01`,
    endDate: today,
    departmentId: "",
  };
};

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

function Metric({ label, value, detail, icon: Icon, tone, emphasis }) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        emphasis
          ? "border-slate-900 bg-slate-950 text-white"
          : "border-slate-200/80 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-sm font-medium ${
              emphasis ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-2 text-2xl font-semibold tracking-tight ${
              emphasis ? "text-white" : "text-slate-900"
            }`}
          >
            {value}
          </p>
          {detail && (
            <p
              className={`mt-1 text-xs ${
                emphasis ? "text-slate-400" : "text-slate-400"
              }`}
            >
              {detail}
            </p>
          )}
        </div>
        {Icon && (
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              emphasis ? "bg-white/10 text-white" : tone
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

function ChartSection({ title, description, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}
      aria-label={title}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}

export default function DashboardAnalytics({ role }) {
  const [filters, setFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    let active = true;
    API.get(`/dashboard/${role}`, { params: appliedFilters })
      .then((response) => {
        if (!active) return;
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(
          error.response?.data?.message || "Failed to load dashboard",
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role, appliedFilters]);

  const applyFilters = (event) => {
    event.preventDefault();
    if (filters.startDate > filters.endDate) {
      toast.error("Start date must be before end date");
      return;
    }
    setLoading(true);
    setSummary([]);
    setAppliedFilters({ ...filters });
  };

  const summarize = async () => {
    if (!data) return;
    setLoadingSummary(true);
    try {
      const response = await API.post("/ai/summarize", { kpis: data.kpis });
      setSummary(response.data.summary || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to summarize dashboard",
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading && !data) return <DashboardSkeleton />;
  if (!data)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Dashboard data is unavailable. Refresh the page or try again.
      </div>
    );

  const { kpis } = data;
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              {isAdmin ? "Company intelligence" : "People operations"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {isAdmin ? "Company overview" : "HR command center"}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              {isAdmin
                ? "Headcount, payroll and workforce trends — computed live from your company data."
                : "Attendance, leave and workforce signals for the people team."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {data.filters.startDate} to {data.filters.endDate}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
                <Users className="h-3.5 w-3.5" />
                {formatNumber(kpis.totalEmployees)} people
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={summarize}
            disabled={loadingSummary}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {loadingSummary ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
            ) : (
              <Sparkles className="h-4 w-4 text-blue-600" />
            )}
            {loadingSummary ? "Summarizing..." : "AI summary"}
          </button>
        </div>
      </header>

      {isAdmin && <AdminQuickStart />}

      {!isAdmin && <CheckInCard compact />}

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="h-4 w-4 text-slate-400" />
          Dashboard filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_auto]">
          <label className="text-xs font-medium text-slate-500">
            From
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              value={filters.startDate}
              onChange={(event) =>
                setFilters({ ...filters, startDate: event.target.value })
              }
              required
            />
          </label>
          <label className="text-xs font-medium text-slate-500">
            To
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              value={filters.endDate}
              onChange={(event) =>
                setFilters({ ...filters, endDate: event.target.value })
              }
              required
            />
          </label>
          <label className="text-xs font-medium text-slate-500">
            Department
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              value={filters.departmentId}
              onChange={(event) =>
                setFilters({ ...filters, departmentId: event.target.value })
              }
            >
              <option value="">All departments</option>
              {data.departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="self-end rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Apply"}
          </button>
        </div>
      </form>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total headcount"
          value={formatNumber(kpis.totalEmployees)}
          detail="Active workforce in range"
          icon={Users}
          tone="bg-blue-50 text-blue-600"
          emphasis
        />
        {isAdmin ? (
          <>
            <Metric
              label="Attrition YTD"
              value={formatPercent(kpis.attritionYtd)}
              detail="Selected period"
              icon={TrendingDown}
              tone="bg-amber-50 text-amber-600"
            />
            <Metric
              label="Payroll cost"
              value={`Rs ${formatNumber(kpis.payrollCost)}`}
              detail="Finalized runs"
              icon={Wallet}
              tone="bg-violet-50 text-violet-600"
            />
            <Metric
              label="Average salary"
              value={`Rs ${formatNumber(kpis.averageSalary)}`}
              detail="Monthly gross"
              icon={BadgeDollarSign}
              tone="bg-emerald-50 text-emerald-600"
            />
          </>
        ) : (
          <>
            <Metric
              label="Present today"
              value={formatNumber(kpis.presentToday)}
              detail="On the selected end date"
              icon={CalendarCheck}
              tone="bg-emerald-50 text-emerald-600"
            />
            <Metric
              label="Late today"
              value={formatNumber(kpis.lateToday)}
              detail="After grace window"
              icon={Clock3}
              tone="bg-amber-50 text-amber-600"
            />
            <Metric
              label="Pending leave"
              value={formatNumber(kpis.pendingLeaves)}
              detail="Awaiting HR decision"
              icon={FileText}
              tone="bg-rose-50 text-rose-600"
            />
          </>
        )}
        <Metric
          label="Attendance rate"
          value={formatPercent(kpis.attendanceRate)}
          detail="Present + late + half day"
          icon={Activity}
          tone="bg-emerald-50 text-emerald-600"
        />
        <Metric
          label="Absenteeism"
          value={formatPercent(kpis.absenteeismRate)}
          detail="Unplanned absence"
          icon={TrendingDown}
          tone="bg-rose-50 text-rose-600"
        />
        <Metric
          label="On leave today"
          value={formatNumber(kpis.onLeaveToday)}
          detail="Approved leave"
          icon={CalendarDays}
          tone="bg-indigo-50 text-indigo-600"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartSection
          title="Attendance trend"
          description="Daily present, late and absent counts"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" minTickGap={24} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                dataKey="present"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                dataKey="late"
                stroke="#d97706"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                dataKey="absent"
                stroke="#e11d48"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        {isAdmin ? (
          <ChartSection
            title="Headcount by department"
            description="Team distribution in the selected range"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.employeesByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="employeeCount"
                  name="Employees"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        ) : (
          <ChartSection
            title="Absenteeism by department"
            description="Where unplanned absence is concentrated"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.absenteeismByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar
                  dataKey="absenteeismRate"
                  name="Absenteeism"
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isAdmin ? (
          <ChartSection
            title="Payroll cost by department"
            description="Gross vs net for finalized payroll"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.payrollByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => `Rs ${formatNumber(value)}`} />
                <Legend />
                <Bar
                  dataKey="gross"
                  name="Gross"
                  fill="#0f172a"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="net"
                  name="Net"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        ) : (
          <ChartSection
            title="Approved leave by type"
            description="Days approved in the selected range"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.leaveByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="approvedDays"
                  name="Approved days"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {isAdmin ? (
          <ChartSection
            title="Workforce profile"
            description="Gender and tenure mix"
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Gender
                </h3>
                {data.genderDistribution.map((entry) => (
                  <p
                    key={entry.gender}
                    className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0"
                  >
                    <span className="capitalize text-slate-600">
                      {entry.gender}
                    </span>
                    <span className="font-medium text-slate-900">
                      {entry.count}
                    </span>
                  </p>
                ))}
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Tenure
                </h3>
                {data.tenureDistribution.map((entry) => (
                  <p
                    key={entry.tenure}
                    className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0"
                  >
                    <span className="text-slate-600">{entry.tenure}</span>
                    <span className="font-medium text-slate-900">
                      {entry.count}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          </ChartSection>
        ) : (
          <ChartSection
            title="Top late-comers"
            description="Coaching opportunities this period"
          >
            {data.topLateComers.length ? (
              <ol className="divide-y divide-slate-100">
                {data.topLateComers.map((entry, index) => (
                  <li
                    key={entry.employeeId}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <span>
                        <span className="font-medium text-slate-800">
                          {entry.employeeName}
                        </span>
                        <span className="ml-2 text-slate-400">
                          {entry.department}
                        </span>
                      </span>
                    </span>
                    <strong className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                      {entry.count} late
                    </strong>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-xl bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">
                No late attendance in this period.
              </p>
            )}
          </ChartSection>
        )}
      </div>

      {data.leaveUtilization.length > 0 && (
        <ChartSection
          title="Leave utilization"
          description="How much of each annual quota has been used"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.leaveUtilization.map((leaveType) => (
              <div
                key={leaveType.name}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">
                    {leaveType.name}
                  </p>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatPercent(leaveType.utilizationRate)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {leaveType.used} of {leaveType.quota} days used
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Number(leaveType.utilizationRate) || 0,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartSection>
      )}

      {summary.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">
                AI-generated insights
              </h2>
              <p className="text-xs text-slate-500">
                Based only on the KPIs above.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {summary.map((insight, index) => (
              <li
                key={index}
                className="rounded-xl border border-white bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"
              >
                {insight}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
