import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function Brand({ inverse = false }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/15"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-[12px] transition-transform duration-200 group-hover:-translate-y-0.5 ${
          inverse
            ? "bg-hcm-lime text-hcm-ink shadow-[0_8px_24px_-14px_rgba(0,133,115,0.55)]"
            : "bg-hcm-ink text-hcm-lime"
        }`}
      >
        <Building2 className="h-5 w-5" />
      </span>
      <span>
        <span
          className={`block text-[17px] font-semibold tracking-[-0.02em] ${
            inverse ? "text-white" : "text-hcm-ink"
          }`}
        >
          HCM Lite
        </span>
        <span
          className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${
            inverse ? "text-white/45" : "text-hcm-muted"
          }`}
        >
          People operations
        </span>
      </span>
    </Link>
  );
}

const panelContent = {
  login: {
    eyebrow: "One calm workspace",
    title: "People operations, without the noise.",
    description:
      "Attendance, leave, payroll and people data in one secure place your whole team can trust.",
    features: [
      {
        icon: Sparkles,
        title: "Everything in one view",
        detail: "Skip the tab-hopping and see what needs attention.",
      },
      {
        icon: ShieldCheck,
        title: "Role-aware by default",
        detail: "People only see the workspace they need to do their job.",
      },
      {
        icon: LockKeyhole,
        title: "Secure from day one",
        detail: "One-time links, protected sessions and a clear audit trail.",
      },
    ],
  },
  security: {
    eyebrow: "Account security",
    title: "Security that stays out of your way.",
    description:
      "Protected sessions, one-time recovery links and a clean audit trail keep your workspace safe.",
    features: [
      {
        icon: LockKeyhole,
        title: "One-time recovery links",
        detail: "Reset access without ever sharing a password.",
      },
      {
        icon: ShieldCheck,
        title: "Protected sessions",
        detail: "Role-based access with a clear audit trail.",
      },
      {
        icon: CheckCircle2,
        title: "You stay in control",
        detail: "Update your password whenever you need to.",
      },
    ],
  },
};

function AuthPanel({ variant }) {
  const content = panelContent[variant] || panelContent.login;

  return (
    <aside className="hcm-auth-panel relative hidden min-h-[calc(100vh-3rem)] overflow-hidden rounded-[28px] p-8 text-white lg:flex lg:flex-col xl:p-10">
      <span
        aria-hidden="true"
        className="hcm-grid-pattern-dark pointer-events-none absolute inset-0 opacity-60"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-hcm-lime/20 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-hcm-coral/20 blur-3xl"
      />

      <div className="relative">
        <Brand inverse />
      </div>

      <div className="relative my-auto max-w-[34rem] py-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-hcm-lime">
          <span className="h-1.5 w-1.5 rounded-full bg-hcm-lime" />
          {content.eyebrow}
        </p>
        <h1 className="mt-5 font-display text-[38px] font-bold leading-[1.08] tracking-[-0.04em] text-white text-balance xl:text-[44px]">
          {content.title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
          {content.description}
        </p>

        <ul className="mt-8 space-y-3">
          {content.features.map((feature) => (
            <li
              key={feature.title}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-hcm-lime/10 text-hcm-lime">
                <feature.icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-white">
                  {feature.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-5 text-white/45">
                  {feature.detail}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-[11px] text-white/35">
        <span>HCM Lite</span>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-hcm-lime/70" />
          Secure workspace
        </span>
      </div>
    </aside>
  );
}

function SetupLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hcm-canvas text-hcm-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(0,133,115,0.1),transparent_62%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[24rem] bg-[radial-gradient(ellipse_at_bottom,rgba(255,123,102,0.1),transparent_64%)]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 sm:px-6">
        <header className="flex items-center justify-between gap-4 py-5 sm:py-6">
          <Brand />
          <Link
            to="/login"
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hcm-muted transition hover:bg-hcm-surface hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
          >
            Back to sign in
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-[620px]">
            <div className="hcm-auth-card hcm-fade-in overflow-hidden rounded-[22px] border border-hcm-line bg-hcm-surface p-5 shadow-hcm-lift sm:p-8">
              {children}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-hcm-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-hcm-accent" />
              Your workspace is created once, securely.
            </p>
          </div>
        </main>

        <footer className="flex flex-col items-center justify-between gap-1.5 border-t border-hcm-line py-4 text-center text-[11px] text-hcm-muted sm:flex-row sm:text-left">
          <span>HCM Lite</span>
          <span>People operations, simplified.</span>
        </footer>
      </div>
    </div>
  );
}

export default function AuthShell({ variant = "login", children }) {
  if (variant === "setup") {
    return <SetupLayout>{children}</SetupLayout>;
  }

  const isSecurity = variant === "security";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hcm-canvas text-hcm-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_top,rgba(0,133,115,0.1),transparent_62%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[26rem] w-[26rem] bg-[radial-gradient(circle,rgba(255,123,102,0.1),transparent_64%)]"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1240px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10 lg:px-8 lg:py-6">
        <AuthPanel variant={variant} />

        <div className="flex min-h-[calc(100vh-2rem)] flex-col lg:min-h-[calc(100vh-3rem)]">
          <header className="flex items-center justify-between gap-4 py-2 lg:hidden">
            <Brand />
          </header>

          <main className="flex flex-1 items-center justify-center py-4 sm:py-6 lg:py-0">
            <div
              className={`w-full ${
                isSecurity ? "max-w-[460px]" : "max-w-[420px]"
              }`}
            >
              <div className="hcm-auth-card hcm-fade-in overflow-hidden rounded-[22px] border border-hcm-line bg-hcm-surface p-5 shadow-hcm-lift sm:p-8">
                {children}
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-hcm-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-hcm-accent" />
                {isSecurity
                  ? "Your password protects your workspace."
                  : "Secure sign-in with role-based access"}
              </p>
            </div>
          </main>

          <footer className="flex flex-col items-center justify-between gap-1.5 border-t border-hcm-line/80 py-4 text-center text-[11px] text-hcm-muted sm:flex-row sm:text-left">
            <span>HCM Lite</span>
            <span>People operations, simplified.</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
