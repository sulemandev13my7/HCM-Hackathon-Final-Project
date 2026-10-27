import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Filter,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../services/api";
import AdminQuickStart from "./AdminQuickStart";
import CheckInCard from "./CheckInCard";
import {
  Badge,
  Button,
  DashboardSkeleton,
  EmptyState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
} from "./ui";

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
const formatCurrency = (value) => `Rs ${formatNumber(value)}`;
const formatPeriodDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #dce5e0",
  background: "#ffffff",
  boxShadow: "0 18px 45px -30px rgba(16,42,34,.45)",
  fontSize: 12,
  color: "#102a22",
};

function ChartEmpty({ message = "No data for this period." }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-hcm-line-strong bg-hcm-surface-soft text-xs text-hcm-muted">
      {message}
    </div>
  );
}

function AttentionRow({ to, icon: Icon, label, value, detail, tone }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-hcm-line hover:bg-white"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-hcm-ink">
          {label}
        </span>
        <span className="block truncate text-[10px] text-hcm-muted">
          {detail}
        </span>
      </span>
      <span className="flex items-center gap-1">
        <strong className="text-sm font-semibold text-hcm-ink">{value}</strong>
        <ArrowUpRight className="h-3.5 w-3.5 text-hcm-muted/50 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-hcm-accent" />
      </span>
    </Link>
  );
}

function PriorityPanel({ kpis, role }) {
  const absentToday = Math.max(
    0,
    Number(kpis.totalEmployees || 0) -
      Number(kpis.presentToday || 0) -
      Number(kpis.onLeaveToday || 0),
  );
  const pending = Number(kpis.pendingLeaves || 0);
  const late = Number(kpis.lateToday || 0);
  const openItems = pending + late + absentToday;
  const allClear = openItems === 0;

  return (
    <SectionCard
      title="Needs attention"
      description="Items to review today."
      action={
        allClear ? (
          <Badge tone="lime" dot>
            All clear
          </Badge>
        ) : (
          <Badge tone="warning" dot>
            {openItems} open
          </Badge>
        )
      }
      className="h-full"
      bodyClassName="pt-3"
    >
      <div className="space-y-0.5">
        <AttentionRow
          to={`/${role}/leave`}
          icon={FileText}
          label="Leave approvals"
          detail="Requests waiting for a decision"
          value={pending}
          tone="bg-amber-50 text-amber-700"
        />
        <AttentionRow
          to={`/${role}/attendance`}
          icon={Clock3}
          label="Late arrivals"
          detail="Checked in after the grace window"
          value={late}
          tone="bg-amber-50 text-amber-700"
        />
        <AttentionRow
          to={`/${role}/attendance`}
          icon={CalendarDays}
          label="On leave today"
          detail="Approved time away"
          value={kpis.onLeaveToday || 0}
          tone="bg-sky-50 text-sky-700"
        />
        <AttentionRow
          to={`/${role}/attendance`}
          icon={AlertCircle}
          label="Not accounted for"
          detail="No attendance or approved leave"
          value={absentToday}
          tone="bg-rose-50 text-rose-700"
        />
      </div>

      <div className="mt-4 rounded-2xl bg-hcm-ink px-4 py-4 text-white">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
              Attendance coverage
            </p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
              {formatPercent(kpis.attendanceRate)}
            </p>
          </div>
          <Badge tone="dark">
            {formatNumber(kpis.presentToday)} present
          </Badge>
        </div>
        <ProgressBar
          value={kpis.attendanceRate}
          label="Attendance coverage"
          tone="bg-hcm-lime"
          className="mt-3"
        />
      </div>
    </SectionCard>
  );
}

function ChartTooltip({ unit = "" }) {
  return (
    <Tooltip
      contentStyle={tooltipStyle}
      cursor={{ fill: "rgba(15,107,79,.06)" }}
      formatter={(value) =>
        unit === "currency"
          ? [formatCurrency(value), ""]
          : [`${value}${unit}`, ""]
      }
    />
  );
}

function ChartSection({ title, description, children, className = "" }) {
  return (
    <SectionCard
      title={title}
      description={description}
      className={className}
      bodyClassName="pt-4"
    >
      {children}
    </SectionCard>
  );
}

export default function DashboardAnalytics({ role }) {
  const [filters, setFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
    setFiltersOpen(false);
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

  if (!data) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Dashboard unavailable"
        description="Refresh the page or try again in a moment."
        action={
          <Button onClick={() => window.location.reload()} variant="secondary">
            Refresh dashboard
          </Button>
        }
      />
    );
  }

  const { kpis } = data;
  const isAdmin = role === "admin";
  const attendanceTrend = data.attendanceTrend || [];
  const departmentData = isAdmin
    ? data.employeesByDepartment || []
    : data.absenteeismByDepartment || [];
  const leaveUtilization = data.leaveUtilization || [];
  const pending = Number(kpis.pendingLeaves || 0);

  const attentionMessage =
    pending > 0
      ? `${pending} leave request${pending === 1 ? " needs" : "s need"} a decision.`
      : "No leave approvals are waiting.";

  return (
    <div className="space-y-5" aria-busy={loading}>
      <PageHeader
        eyebrow="Overview"
        title={isAdmin ? "Company overview" : "People operations"}
        description={
          isAdmin
            ? "Headcount, attendance and payroll at a glance."
            : "Attendance, leave and team activity for the selected period."
        }
        meta={
          <>
            <span className="hcm-chip">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatPeriodDate(data.filters.startDate)} –{" "}
              {formatPeriodDate(data.filters.endDate)}
            </span>
            <span className="hcm-chip">
              <Users className="h-3.5 w-3.5" />
              {formatNumber(kpis.totalEmployees)}{" "}
              {Number(kpis.totalEmployees) === 1 ? "person" : "people"}
            </span>
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <Button onClick={summarize} disabled={loadingSummary}>
              {loadingSummary ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loadingSummary ? "Summarizing..." : "AI summary"}
            </Button>
          </>
        }
      />

      {filtersOpen && (
        <form
          onSubmit={applyFilters}
          className="hcm-card hcm-rise-in p-4 sm:p-5"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-hcm-ink">
                Dashboard range
              </h2>
              <p className="mt-0.5 text-xs text-hcm-muted">
                Compare a period or focus on one department.
              </p>
            </div>
            <Badge tone="accent">{loading ? "Updating" : "Applied"}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr_auto]">
            <label className="hcm-label">
              From
              <input
                type="date"
                className="hcm-input"
                value={filters.startDate}
                onChange={(event) =>
                  setFilters({ ...filters, startDate: event.target.value })
                }
                required
              />
            </label>
            <label className="hcm-label">
              To
              <input
                type="date"
                className="hcm-input"
                value={filters.endDate}
                onChange={(event) =>
                  setFilters({ ...filters, endDate: event.target.value })
                }
                required
              />
            </label>
            <label className="hcm-label">
              Department
              <select
                className="hcm-select"
                value={filters.departmentId}
                onChange={(event) =>
                  setFilters({ ...filters, departmentId: event.target.value })
                }
              >
                <option value="">All departments</option>
                {(data.departments || []).map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" disabled={loading} className="self-end">
              {loading ? "Updating..." : "Apply range"}
            </Button>
          </div>
        </form>
      )}

      {isAdmin ? <AdminQuickStart /> : <CheckInCard compact />}

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Key performance indicators"
      >
        {isAdmin ? (
          <>
            <StatCard
              label="Total headcount"
              value={formatNumber(kpis.totalEmployees)}
              detail="Active people"
              icon={Users}
              emphasis
            />
            <StatCard
              label="Attendance rate"
              value={formatPercent(kpis.attendanceRate)}
              detail="Present, late and half day"
              icon={Activity}
              tone="bg-hcm-accent-soft text-hcm-accent"
            />
            <StatCard
              label="Payroll cost"
              value={formatCurrency(kpis.payrollCost)}
              detail="Finalized payroll"
              icon={Wallet}
              tone="bg-hcm-canvas-deep text-hcm-ink"
            />
            <StatCard
              label="Pending leave"
              value={formatNumber(kpis.pendingLeaves)}
              detail={attentionMessage}
              icon={FileText}
              tone="bg-amber-50 text-amber-700"
              action={
                <Link
                  to="/admin/leave"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-hcm-accent hover:underline"
                >
                  Review queue <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
          </>
        ) : (
          <>
            <StatCard
              label="Present today"
              value={formatNumber(kpis.presentToday)}
              detail="People accounted for"
              icon={CalendarCheck}
              emphasis
            />
            <StatCard
              label="Attendance rate"
              value={formatPercent(kpis.attendanceRate)}
              detail="Present, late and half day"
              icon={Activity}
              tone="bg-hcm-accent-soft text-hcm-accent"
            />
            <StatCard
              label="Late arrivals"
              value={formatNumber(kpis.lateToday)}
              detail="After the grace window"
              icon={Clock3}
              tone="bg-amber-50 text-amber-700"
            />
            <StatCard
              label="Pending leave"
              value={formatNumber(kpis.pendingLeaves)}
              detail={attentionMessage}
              icon={FileText}
              tone="bg-sky-50 text-sky-700"
              action={
                <Link
                  to="/hr/leave"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-hcm-accent hover:underline"
                >
                  Review queue <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
          </>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <ChartSection
          title="Attendance trend"
          description="Present, late and absent over time."
          className="min-w-0"
        >
          {attendanceTrend.length ? (
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#dce5e0"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  minTickGap={24}
                  tick={{ fontSize: 10, fill: "#5f7068" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "#5f7068" }}
                  axisLine={false}
                  tickLine={false}
                  width={26}
                />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke="#0f6b4f"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="late"
                  name="Late"
                  stroke="#b7791f"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke="#b4432f"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty />
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[10px] font-medium text-hcm-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-hcm-accent" /> Present
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#b7791f]" /> Late
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#b4432f]" /> Absent
            </span>
          </div>
        </ChartSection>

        <PriorityPanel kpis={kpis} role={role} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartSection
          title={
            isAdmin ? "Headcount by department" : "Absenteeism by department"
          }
          description={
            isAdmin ? "Active people by team." : "Unplanned absence by team."
          }
        >
          {departmentData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={departmentData}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#dce5e0"
                  vertical={false}
                />
                <XAxis
                  dataKey="departmentName"
                  tick={{ fontSize: 10, fill: "#5f7068" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  unit={isAdmin ? "" : "%"}
                  tick={{ fontSize: 10, fill: "#5f7068" }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <ChartTooltip unit={isAdmin ? "" : "%"} />
                <Bar
                  dataKey={isAdmin ? "employeeCount" : "absenteeismRate"}
                  name={isAdmin ? "Employees" : "Absenteeism"}
                  fill={isAdmin ? "#0f6b4f" : "#b4432f"}
                  radius={[7, 7, 0, 0]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty />
          )}
        </ChartSection>

        <SectionCard
          title="Leave utilization"
          description="Share of each annual quota used."
        >
          {leaveUtilization.length ? (
            <div className="space-y-4">
              {leaveUtilization.map((leaveType) => (
                <div key={leaveType.name}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-hcm-ink">
                      {leaveType.name}
                    </span>
                    <span className="font-semibold text-hcm-muted">
                      {formatPercent(leaveType.utilizationRate)}
                    </span>
                  </div>
                  <ProgressBar
                    value={leaveType.utilizationRate}
                    label={`${leaveType.name} utilization`}
                    className="mt-2"
                  />
                  <p className="mt-1.5 text-[10px] text-hcm-muted">
                    {leaveType.used} of {leaveType.quota} days used
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No leave utilization yet"
              description="Leave quotas will appear here once employees use them."
            />
          )}
        </SectionCard>
      </div>

      {!isAdmin && (
        <SectionCard
          title="Top late-comers"
          description="Employees with the most late arrivals."
        >
          {(data.topLateComers || []).length ? (
            <ol className="divide-y divide-hcm-line">
              {data.topLateComers.map((entry, index) => (
                <li
                  key={entry.employeeId}
                  className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hcm-canvas-deep text-[11px] font-semibold text-hcm-muted">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-hcm-ink">
                        {entry.employeeName}
                      </span>
                      <span className="block truncate text-[10px] text-hcm-muted">
                        {entry.department}
                      </span>
                    </span>
                  </span>
                  <Badge tone="warning">{entry.count} late</Badge>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No late attendance"
              description="Everyone was on time in this period."
            />
          )}
        </SectionCard>
      )}

      {summary.length > 0 && (
        <section className="hcm-rise-in rounded-2xl border border-hcm-line bg-hcm-accent-soft p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white text-hcm-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="hcm-eyebrow text-hcm-accent">AI summary</p>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-hcm-ink">
                Key takeaways
              </h2>
              <p className="mt-1 text-xs text-hcm-muted">
                Based on the KPIs above.
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {summary.map((insight, index) => (
              <li
                key={index}
                className="rounded-[10px] border border-hcm-line bg-white px-4 py-3 text-sm leading-6 text-hcm-ink"
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
