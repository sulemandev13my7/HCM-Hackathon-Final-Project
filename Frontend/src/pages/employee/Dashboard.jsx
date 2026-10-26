import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../contexts/useAuth";
import CheckInCard from "../../components/CheckInCard";
import toast from "react-hot-toast";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  Megaphone,
  Sparkles,
  Wallet,
} from "lucide-react";

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString()}`;

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Your dashboard could not be loaded. Refresh the page or contact HR.
      </div>
    );
  }

  const weekProgress = Math.min(
    100,
    Math.round(((Number(data.hoursThisWeek) || 0) / 40) * 100),
  );
  const leaveBalances = data.leaveBalances || [];

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              Employee workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Good to see you, {user?.firstName || "there"}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Your day, leave balance and payslips — all in one place.
            </p>
          </div>
          <Link
            to="/employee/ai"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Ask my assistant
          </Link>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <CheckInCard />
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            icon={Clock3}
            label="Hours this week"
            value={`${data.hoursThisWeek || 0} hrs`}
            detail={`${weekProgress}% of 40 hr target`}
            tone="bg-blue-50 text-blue-600"
          />
          <MetricCard
            icon={CalendarDays}
            label="Late this month"
            value={`${data.lateCountThisMonth || 0} days`}
            detail="Based on check-in time"
            tone="bg-amber-50 text-amber-600"
          />
          <div className="sm:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Weekly rhythm
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Keep each week moving toward a healthy 40 hours.
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {weekProgress}%
              </span>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Leave balance</h2>
            <Link
              to="/employee/leave"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Apply
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {leaveBalances.length ? (
              leaveBalances.slice(0, 4).map((balance) => {
                const quota = Number(balance.quota) || 0;
                const remaining = Number(balance.remaining) || 0;
                const used = quota ? Math.round((remaining / quota) * 100) : 0;
                return (
                  <div key={balance._id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {balance.leaveType?.name || "Leave"}
                      </span>
                      <span className="text-slate-500">
                        <strong className="text-slate-800">{remaining}</strong>{" "}
                        / {quota}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${used}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                Leave balances will appear after HR sets up your profile.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Last payslip</h2>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          {data.lastPayslip ? (
            <>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(data.lastPayslip.netPay)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Net pay · {data.lastPayslip.month}/{data.lastPayslip.year}
              </p>
              <Link
                to="/employee/payroll"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
              >
                View payslips <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-500">
              No finalized payslip yet. Your next finalized payroll run will
              appear here.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Quick actions</h2>
            <Megaphone className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-4 grid gap-2">
            <Link
              to="/employee/attendance"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              My attendance <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/employee/leave"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Apply for leave <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/employee/profile"
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Update profile <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Announcements</h2>
            <p className="mt-1 text-sm text-slate-500">
              Updates from your people team.
            </p>
          </div>
          <FileText className="h-5 w-5 text-slate-300" />
        </div>
        {data.announcements?.length ? (
          <ul className="mt-5 divide-y divide-slate-100">
            {data.announcements.map((announcement) => (
              <li key={announcement._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {announcement.title}
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No announcements yet.
          </p>
        )}
      </section>
    </div>
  );
}
