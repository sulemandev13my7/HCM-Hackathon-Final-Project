import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../contexts/useAuth";
import CheckInCard from "../../components/CheckInCard";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileText,
  Megaphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
} from "../../components/ui";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

const dateLabel = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

const quickActions = [
  {
    to: "/employee/attendance",
    label: "View my attendance",
    description: "Calendar, hours and corrections",
    icon: CalendarCheck,
  },
  {
    to: "/employee/leave",
    label: "Apply for leave",
    description: "See balance and request time off",
    icon: CalendarDays,
  },
  {
    to: "/employee/payroll",
    label: "Open payslips",
    description: "Download finalized payslips",
    icon: Wallet,
  },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    API.get("/dashboard/employee")
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Could not load your dashboard",
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 hcm-skeleton rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 hcm-skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={FileText}
        title="Your dashboard could not be loaded"
        description="Refresh the page or contact HR if this continues."
        action={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try again
          </Button>
        }
      />
    );
  }

  const weekProgress = Math.min(
    100,
    Math.round(((Number(data.hoursThisWeek) || 0) / 40) * 100),
  );
  const leaveBalances = data.leaveBalances || [];
  const leaveRemaining = leaveBalances.reduce(
    (sum, balance) => sum + Number(balance.remaining || 0),
    0,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Home"
        title={`Good to see you, ${user?.firstName || "there"}.`}
        description="Your day, leave balance and payslips."
        meta={
          <>
            <span className="hcm-chip">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateLabel}
            </span>
            <span className="hcm-chip">
              {leaveRemaining} leave days remaining
            </span>
          </>
        }
        actions={
          <Link
            to="/employee/ai"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-hcm-accent px-4 text-sm font-semibold text-white transition hover:bg-hcm-accent-strong"
          >
            <Sparkles className="h-4 w-4" />
            Ask assistant
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <CheckInCard />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon={Clock3}
            label="Hours this week"
            value={`${data.hoursThisWeek || 0} hrs`}
            detail={`${weekProgress}% of a 40 hour week`}
            tone="bg-sky-50 text-sky-700"
          />
          <StatCard
            icon={CalendarCheck}
            label="Late this month"
            value={`${data.lateCountThisMonth || 0} days`}
            detail="Based on check-in time"
            tone="bg-amber-50 text-amber-700"
          />
          <div className="hcm-card p-5 sm:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-hcm-muted">
                  Weekly rhythm
                </p>
                <p className="mt-1 text-xs leading-5 text-hcm-muted">
                  Keep each week moving toward a healthy 40 hours.
                </p>
              </div>
              <Badge tone={weekProgress >= 80 ? "lime" : "accent"}>
                {weekProgress}%
              </Badge>
            </div>
            <ProgressBar
              value={weekProgress}
              label="Weekly hours progress"
              className="mt-4"
              tone="bg-hcm-accent"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <SectionCard
          title="Leave balance"
          description="Your remaining allowance this year."
          action={
            <Link to="/employee/leave" className="hcm-link text-xs">
              Apply
            </Link>
          }
        >
          {leaveBalances.length ? (
            <div className="space-y-4">
              {leaveBalances.slice(0, 4).map((balance) => {
                const quota = Number(balance.quota) || 0;
                const remaining = Number(balance.remaining) || 0;
                const remainingPercent = quota
                  ? Math.round((remaining / quota) * 100)
                  : 0;
                return (
                  <div key={balance._id}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-hcm-ink">
                        {balance.leaveType?.name || "Leave"}
                      </span>
                      <span className="text-hcm-muted">
                        <strong className="font-semibold text-hcm-ink">
                          {remaining}
                        </strong>{" "}
                        of {quota} left
                      </span>
                    </div>
                    <ProgressBar
                      value={remainingPercent}
                      label={`${balance.leaveType?.name || "Leave"} balance`}
                      className="mt-2"
                      tone="bg-hcm-accent"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No leave balances yet"
              description="They will appear after HR sets up your profile."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Last payslip"
          description="Your latest finalized pay."
          action={
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-hcm-canvas-deep text-hcm-ink">
              <Wallet className="h-4 w-4" />
            </span>
          }
        >
          {data.lastPayslip ? (
            <>
              <p className="mt-1 font-display text-4xl tracking-[-0.04em] text-hcm-ink">
                {formatCurrency(data.lastPayslip.netPay)}
              </p>
              <p className="mt-1 text-xs text-hcm-muted">
                Net pay · {data.lastPayslip.month}/{data.lastPayslip.year}
              </p>
              <Link
                to="/employee/payroll"
                className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-hcm-accent hover:underline"
              >
                View payslips <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <p className="mt-1 text-sm leading-6 text-hcm-muted">
              No finalized payslip yet. Your next payroll run will appear here.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming"
          description="A quick read on your time."
          action={<CalendarDays className="h-4 w-4 text-hcm-muted" />}
        >
          <div className="rounded-[10px] bg-hcm-surface-soft px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-hcm-muted">
              Leave remaining
            </p>
            <p className="mt-1 font-display text-4xl tracking-[-0.04em] text-hcm-ink">
              {leaveRemaining}
            </p>
            <p className="text-xs text-hcm-muted">
              days across {leaveBalances.length} leave types
            </p>
          </div>
          <Link
            to="/employee/attendance"
            className="mt-3 flex items-center justify-between rounded-xl border border-hcm-line bg-white px-3.5 py-3 text-xs font-semibold text-hcm-ink transition hover:border-hcm-line-strong"
          >
            Review my attendance
            <ArrowRight className="h-3.5 w-3.5 text-hcm-muted" />
          </Link>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <SectionCard
          title="Quick actions"
          description="The things people ask for most."
          action={<Megaphone className="h-4 w-4 text-hcm-muted" />}
        >
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-3 rounded-[10px] border border-hcm-line bg-white px-3.5 py-3 transition hover:border-hcm-line-strong hover:bg-hcm-canvas"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hcm-accent-soft text-hcm-accent">
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-hcm-ink">
                    {action.label}
                  </span>
                  <span className="block truncate text-[10px] text-hcm-muted">
                    {action.description}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-hcm-muted/50 transition group-hover:translate-x-0.5 group-hover:text-hcm-accent" />
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Announcements"
          description="Updates from your people team."
          action={
            <Link to="/employee/announcements" className="hcm-link text-xs">
              View all
            </Link>
          }
        >
          {data.announcements?.length ? (
            <ul className="divide-y divide-hcm-line">
              {data.announcements.map((announcement) => (
                <li
                  key={announcement._id}
                  className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-hcm-accent-soft text-hcm-accent">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-hcm-ink">
                      {announcement.title}
                    </h3>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-hcm-muted">
                      {announcement.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Updates from your people team will appear here."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
