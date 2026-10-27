import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
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
import { Badge, ProgressBar } from "./ui";

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
        key: "leave-types",
        title: "Leave types",
        description: "Set quotas before employees request leave.",
        done: counts.leaveTypes > 0,
        to: "/admin/settings",
        icon: Palmtree,
        value: `${counts.leaveTypes} configured`,
      },
      {
        key: "hr",
        title: "HR account",
        description: "Delegate people, attendance and payroll.",
        done: counts.hr > 0,
        to: "/admin/users",
        icon: Users,
        value: `${counts.hr} HR`,
      },
      {
        key: "employees",
        title: "First employee",
        description: "Register a team member and share the password.",
        done: counts.employees > 0,
        to: "/admin/employees",
        icon: UserPlus,
        value: `${counts.employees} employees`,
      },
      {
        key: "payroll",
        title: "First payroll",
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
      <div className="h-24 animate-pulse rounded-2xl border border-hcm-line bg-hcm-surface" />
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded="false"
        className="flex w-full items-center gap-3 rounded-2xl border border-hcm-line bg-hcm-surface px-4 py-3 text-left transition hover:border-hcm-line-strong"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-hcm-accent-soft text-hcm-accent">
          <Rocket className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-hcm-ink">
            Get started
          </span>
          <span className="block text-xs text-hcm-muted">
            {allDone
              ? "Workspace is ready"
              : `${completed} of ${steps.length} steps complete`}
          </span>
        </span>
        <span className="hidden w-24 sm:block">
          <ProgressBar
            value={progress}
            label="Workspace setup progress"
          />
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-hcm-muted" />
      </button>
    );
  }

  return (
    <section
      id="launch-checklist"
      aria-labelledby="launch-checklist-title"
      className="overflow-hidden rounded-2xl border border-hcm-line bg-hcm-surface"
    >
      <div className="flex flex-col gap-4 border-b border-hcm-line/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-hcm-accent-soft text-hcm-accent">
            <Rocket className="h-4 w-4" />
          </span>
          <div>
            <p className="hcm-eyebrow">Get started</p>
            <h2
              id="launch-checklist-title"
              className="mt-1 font-display text-lg font-bold tracking-tight text-hcm-ink"
            >
              {allDone
                ? "You're all set"
                : firstName
                  ? `${firstName}, finish setting up`
                  : "Finish setting up"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-hcm-muted">
              {allDone
                ? "Every core workflow is ready."
                : "Complete these steps for a smooth walkthrough."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <Badge tone={allDone ? "accent" : "neutral"}>
            {completed} of {steps.length} complete
          </Badge>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded="true"
            className="inline-flex items-center gap-1 text-xs font-semibold text-hcm-muted transition hover:text-hcm-ink"
          >
            Hide <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-4">
        <ProgressBar
          value={progress}
          label="Workspace setup progress"
        />
        <p className="mt-2 text-xs text-hcm-muted" role="status">
          {allDone
            ? "Setup complete."
            : `${progress}% complete. Next: ${
                steps.find((step) => step.key === nextStep)?.title
              }.`}
        </p>
      </div>

      <div className="grid gap-2 p-5 pt-3 sm:grid-cols-2">
        {steps.map((step, index) => {
          const isNext = step.key === nextStep;
          const Icon = step.icon;

          return (
            <Link
              key={step.key}
              to={step.to}
              aria-current={isNext ? "step" : undefined}
              className={`group flex items-start gap-3 rounded-[10px] border p-3.5 transition ${
                isNext
                  ? "border-hcm-accent/30 bg-hcm-accent-soft/60"
                  : "border-hcm-line bg-white hover:border-hcm-line-strong"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                  step.done
                    ? "bg-hcm-accent-soft text-hcm-accent"
                    : isNext
                      ? "bg-hcm-accent text-white"
                      : "bg-hcm-canvas-deep text-hcm-muted"
                }`}
              >
                {step.done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-hcm-muted" />
                  <span className="truncate text-[13px] font-semibold text-hcm-ink">
                    {step.title}
                  </span>
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-hcm-muted">
                  {step.description}
                </span>
                <span className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-hcm-muted">
                    {step.value}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      step.done || isNext
                        ? "text-hcm-accent"
                        : "text-hcm-muted"
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
    </section>
  );
}
