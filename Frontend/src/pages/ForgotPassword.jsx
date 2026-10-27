import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";

const steps = [
  {
    icon: Mail,
    title: "Ask your admin",
    description: "Request a reset link from your workspace admin.",
  },
  {
    icon: KeyRound,
    title: "Open the link",
    description: "The link expires after 30 minutes and works once.",
  },
  {
    icon: ShieldCheck,
    title: "Set a new password",
    description: "Then sign in with your new password.",
  },
];

export default function ForgotPassword() {
  return (
    <AuthShell variant="security">
      <Link
        to="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-hcm-muted transition hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-hcm-accent/15 bg-hcm-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-hcm-accent">
        <KeyRound className="h-3 w-3" />
        Password recovery
      </span>
      <h2 className="mt-4 font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-hcm-ink">
        Forgot your password?
      </h2>
      <p className="mt-2 text-sm leading-6 text-hcm-muted">
        Your admin can create a secure, one-time reset link. They never see your
        password.
      </p>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-[10px] border border-hcm-line bg-hcm-surface-soft p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-white text-hcm-accent ring-1 ring-hcm-line">
              <step.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-hcm-ink">
                {index + 1}. {step.title}
              </p>
              <p className="mt-0.5 text-[12px] leading-5 text-hcm-muted">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        to="/login"
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-hcm-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-hcm-accent-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/15"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to sign in
      </Link>
    </AuthShell>
  );
}
