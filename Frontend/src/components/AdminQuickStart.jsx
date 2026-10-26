import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Palmtree,
  Rocket,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import API from "../services/api";
import { useAuth } from "../contexts/useAuth";

const COLLAPSE_KEY = "hcm_launch_checklist_collapsed";

export default function AdminQuickStart() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    leaveTypes: 0,
    hr: 0,
    employees: 0,
    payrollRuns: 0,
  });
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "true",
  );

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      API.get("/leave-types"),
      API.get("/users"),
      API.get("/payroll"),
    ]).then(([leaveTypesResult, usersResult, payrollResult]) => {
      if (!active) return;

      const leaveTypes =
        leaveTypesResult.status === "fulfilled"
          ? (leaveTypesResult.value.data || []).length
          : 0;
      const users =
        usersResult.status === "fulfilled"
          ? usersResult.value.data || []
          : [];
      const payrollRuns =
        payrollResult.status === "fulfilled"
          ? payrollResult.value.data || []
          : [];

      setCounts({
        leaveTypes,
        hr: users.filter((item) => item.role === "hr").length,
        employees: users.filter((item) => item.role === "employee").length,
        payrollRuns: payrollRuns.length,
      });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const steps = useMemo(
    () => [
      {
        key: "workspace",
        title: "Workspace created",
        description: "Company profile and admin account are ready.",
        done: true,
        to: "/admin/settings",
        icon: CheckCircle2,
        value: "Ready",
      },
      {
        key: "leave-types",
        title: "Configure leave types",
        description: "Add quotas before employees request leave.",
        done: counts.leaveTypes > 0,
        to: "/admin/settings",
        icon: Palmtree,
        value: `${counts.leaveTypes} configured`,
      },
      {
        key: "hr",
        title: "Create an HR account",
        description: "HR can manage people, attendance, leave and payroll.",
        done: counts.hr > 0,
        to: "/admin/users",
        icon: Users,
        value: `${counts.hr} HR`,
      },
      {
        key: "employees",
        title: "Add your first employee",
        description: "Register a team member and share the temporary password.",
        done: counts.employees > 0,
        to: "/admin/employees",
        icon: UserPlus,
        value: `${counts.employees} employees`,
      },
      {
        key: "payroll",
        title: "Run your first payroll",
        description: "Create a draft, review it and finalize payslips.",
        done: counts.payrollRuns > 0,
        to: "/admin/payroll",
        icon: Wallet,
        value: `${counts.payrollRuns} runs`,
      },
    ],
    [counts],
  );

  const completed = steps.filter((step) => step.done).length;
  const progress = Math.round((completed / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done)?.key;
  const allDone = completed === steps.length;
  const firstName = user?.firstName?.trim();

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      localStorage.setItem(COLLAPSE_KEY, String(!current));
      return !current;
    });
  };

  if (loading) {
    return (
      <div className="h-28 animate-pulse rounded-3xl border border-slate-200/80 bg-white" />
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded="false"
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left shadow-sm transition hover:border-slate-300"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Rocket className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">
            Launch checklist
          </span>
          <span className="block text-xs text-slate-500">
            {allDone
              ? "Workspace is demo-ready"
              : `${completed} of ${steps.length} steps complete`}
          </span>
        </span>
        <span className="hidden w-28 sm:block">
          <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
    );
  }

  return (
    <section
      id="launch-checklist"
      aria-labelledby="launch-checklist-title"
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-5 sm:p-6">
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-blue-300">
              <Rocket className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                Launch checklist
              </p>
              <h2
                id="launch-checklist-title"
                className="mt-1 text-lg font-semibold tracking-tight text-slate-900"
              >
                {allDone
                  ? "Your workspace is demo-ready"
                  : `${firstName ? `${firstName}, let’s` : "Let’s"} launch your workspace`}
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                {allDone
                  ? "Every core workflow is set up. Open any module to explore the full product."
                  : "Complete these steps in order for a smooth end-to-end walkthrough."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {completed} of {steps.length} complete
            </span>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded="true"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-slate-700"
            >
              Hide <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-200/80"
            role="progressbar"
            aria-label="Workspace setup progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                allDone ? "bg-emerald-600" : "bg-blue-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500" role="status">
            {allDone
              ? "Setup complete. Your judge walkthrough is ready."
              : `${progress}% complete. Next: ${
                  steps.find((step) => step.key === nextStep)?.title
                }.`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {steps.map((step, index) => {
          const isNext = step.key === nextStep;
          const Icon = step.icon;

          return (
            <Link
              key={step.key}
              to={step.to}
              aria-current={isNext ? "step" : undefined}
              className={`group flex items-start gap-3 rounded-2xl border p-4 transition ${
                isNext
                  ? "border-blue-300 bg-blue-50/60 ring-4 ring-blue-500/10"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  step.done
                    ? "bg-emerald-100 text-emerald-700"
                    : isNext
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {step.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {step.title}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {step.description}
                </span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {step.value}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      step.done
                        ? "text-emerald-700"
                        : isNext
                          ? "text-blue-700"
                          : "text-slate-500"
                    }`}
                  >
                    {step.done ? "Review" : isNext ? "Start" : "Open"}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs leading-5 text-slate-500 sm:px-6">
        Tip: configure leave types before testing employee leave, and add a
        salary structure before running payroll.
      </div>
    </section>
  );
}
