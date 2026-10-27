import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Timer } from "lucide-react";
import AuthShell from "../components/auth/AuthShell";

const steps = [
  {
    icon: Mail,
    title: "Contact your workspace admin",
    description:
      "Use the same email address your admin created for your account.",
  },
  {
    icon: KeyRound,
    title: "Ask for a one-time reset link",
    description:
      "Your admin creates it from Users & access. It expires after 30 minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Open the link and set a new password",
    description:
      "The link works once, then you can sign in with your new password.",
  },
];

export default function ForgotPassword() {
  return (
    <AuthShell variant="security">
      <div>
        <Link
          to="/login"
          className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#7d8882] transition hover:text-[#14241e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d4d]/25"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8de] bg-[#f3f8f0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#32624f]">
          <KeyRound className="h-3 w-3" />
          Password recovery
        </span>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[#14241e]">
          Forgot your password?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6f7b75]">
          This workspace uses secure, admin-issued reset links. Your admin can
          create one without seeing your old password.
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-xl border border-[#e7e2d7] bg-[#fbfaf6] p-3.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2f6b50] ring-1 ring-[#dfe8de]">
              <step.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#32433c]">
                {index + 1}. {step.title}
              </p>
              <p className="mt-0.5 text-[12px] leading-5 text-[#7d8882]">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#dfe8de] bg-[#f3f8f0] p-3.5 text-[12px] leading-5 text-[#32624f]">
        <Timer className="mt-0.5 h-4 w-4 shrink-0" />
        Reset links are single use and expire after 30 minutes. Ask for a fresh
        one if yours stops working.
      </div>

      <Link
        to="/login"
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#10251f] px-4 text-sm font-semibold text-[#f8f5eb] transition hover:bg-[#1a3a30] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to sign in
      </Link>
    </AuthShell>
  );
}
