import { Link } from "react-router-dom";
import {
  Building2,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const content = {
  login: {
    eyebrow: "HCM Lite for modern teams",
    title: "A better day at work starts here.",
    description:
      "Run attendance, leave, payroll and people insights from one calm, connected workspace.",
  },
  setup: {
    eyebrow: "First-run setup · about 2 minutes",
    title: "Start with the real thing.",
    description:
      "Create your company, add the first admin and launch a clean people-operations system from day one.",
  },
};

function Brand() {
  return (
    <Link to="/" className="inline-flex items-center gap-3 rounded-lg">
      <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#d7f59f] text-[#10251f]">
        <Building2 className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[17px] font-semibold tracking-[-0.02em] text-[#f7f3e9]">
          HCM Lite
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fa49b]">
          People operations
        </span>
      </span>
    </Link>
  );
}

function Preview() {
  return (
    <div className="mt-10 max-w-[31rem] rounded-[22px] border border-white/10 bg-white/[0.055] p-2 backdrop-blur-sm">
      <div className="rounded-[16px] bg-[#fbfaf6] p-5 text-[#16251f] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d8882]">
              Today at a glance
            </p>
            <p className="mt-1 text-sm font-semibold">Good morning, Ayesha</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce6dd] bg-[#f2f8f1] px-2.5 py-1 text-[10px] font-semibold text-[#2f6b50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4d9d6f]" />
            Live preview
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between">
          <p className="text-[42px] font-semibold leading-none tracking-[-0.05em]">
            92<span className="ml-0.5 text-xl font-medium">%</span>
          </p>
          <p className="pb-1 text-xs text-[#7d8882]">team present today</p>
        </div>
        <div className="mt-3 flex gap-1">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index < 12 ? "bg-[#2f5d4d]" : "bg-[#e6e1d7]"
              }`}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-[#ebe6dc] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a948f]">
                Leave
              </p>
              <Clock3 className="h-3.5 w-3.5 text-[#c27b35]" />
            </div>
            <p className="mt-2 text-xl font-semibold tracking-tight">04</p>
            <p className="mt-0.5 text-[11px] text-[#7d8882]">
              requests to review
            </p>
          </div>
          <div className="rounded-xl border border-[#ebe6dc] bg-white p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a948f]">
                Payroll
              </p>
              <Sparkles className="h-3.5 w-3.5 text-[#2f6b50]" />
            </div>
            <p className="mt-2 text-xl font-semibold tracking-tight">Oct</p>
            <p className="mt-0.5 text-[11px] text-[#7d8882]">
              draft ready to run
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-[#ebe6dc] bg-white px-3.5 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5efe7] text-[11px] font-semibold text-[#2f5d4d]">
            HA
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Camera check-in</p>
            <p className="text-[11px] text-[#7d8882]">08:59 AM · On time</p>
          </div>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eaf4e9] text-[#2f6b50]">
            <Check className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({ variant = "login", children }) {
  const copy = content[variant];
  const isSetup = variant === "setup";

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#16251f]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(470px,0.92fr)]">
        <aside className="relative hidden overflow-hidden bg-[#10251f] px-10 py-9 text-[#f7f3e9] lg:flex lg:flex-col lg:px-12 xl:px-16 xl:py-11">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.075)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="pointer-events-none absolute -bottom-44 -right-32 h-[30rem] w-[30rem] rounded-full border border-[#d7f59f]/15" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-[22rem] w-[22rem] rounded-full border border-[#d7f59f]/10" />

          <div className="relative">
            <Brand />

            <div className="mt-12 max-w-[35rem] xl:mt-16">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b9c9c1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d7f59f]" />
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.045em] xl:text-[3.35rem]">
                {copy.title}
              </h1>
              <p className="mt-4 max-w-[29rem] text-[15px] leading-7 text-[#aebfb7]">
                {copy.description}
              </p>
            </div>

            <Preview />
          </div>

          <div className="relative mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[11px] font-medium text-[#9cafA6]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#d7f59f]" />
              Role-based access
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#d7f59f]" />
              Admin, HR and employee views
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#d7f59f]" />
              No demo data
            </span>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between px-5 pb-2 pt-5 sm:px-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#10251f] text-[#d7f59f]">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.02em]">
                HCM Lite
              </span>
            </Link>
            <Link
              to={isSetup ? "/login" : "/setup"}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#5d6c65] transition hover:bg-white/60 hover:text-[#10251f]"
            >
              {isSetup ? "Sign in" : "Create workspace"}
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 py-7 sm:px-8 lg:px-10 lg:py-10">
            <div
              className={`w-full ${
                isSetup ? "max-w-[520px]" : "max-w-[440px]"
              }`}
            >
              <div className="rounded-[24px] border border-[#e2dcd0] bg-[#fffdf8] p-5 shadow-[0_28px_80px_-48px_rgba(16,37,31,0.42)] sm:p-8">
                {children}
              </div>
            </div>
          </div>

          <footer className="px-5 pb-5 text-center text-[11px] text-[#8a948f] sm:px-8">
            © {new Date().getFullYear()} HCM Lite · Built for people teams
          </footer>
        </main>
      </div>
    </div>
  );
}
