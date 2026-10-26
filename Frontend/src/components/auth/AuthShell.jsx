import { Link } from "react-router-dom";
import { Building2, ShieldCheck, Users } from "lucide-react";

function Brand() {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/15"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#10251f] text-[#d7f59f] shadow-[0_12px_28px_-18px_rgba(16,37,31,0.8)] transition-transform duration-200 group-hover:-translate-y-0.5">
        <Building2 className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[17px] font-semibold tracking-[-0.02em] text-[#14241e]">
          HCM Lite
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d8882]">
          People operations
        </span>
      </span>
    </Link>
  );
}

function TrustItem({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-[#2f6b50]" />
      {children}
    </span>
  );
}

export default function AuthShell({ variant = "login", children }) {
  const isSetup = variant === "setup";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f4f1e9] text-[#16251f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(215,245,159,0.42),transparent_30%),radial-gradient(circle_at_88%_88%,rgba(47,93,77,0.14),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(16,37,31,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,37,31,0.04)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d7f59f]/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1120px] flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-5 sm:py-6">
          <Brand />
          {isSetup ? (
            <Link
              to="/login"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#5d6c65] transition hover:bg-white/70 hover:text-[#10251f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d4d]/25"
            >
              Back to sign in
            </Link>
          ) : (
            <span className="hidden items-center gap-1.5 rounded-full border border-[#ded8cb] bg-white/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#5d6c65] sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2f6b50]" />
              Secure workspace access
            </span>
          )}
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-6 sm:py-10">
          <div className={`w-full ${isSetup ? "max-w-[560px]" : "max-w-[440px]"}`}>
            <div className="rounded-[26px] border border-[#e2dcd0] bg-[#fffdf8] p-5 shadow-[0_30px_90px_-50px_rgba(16,37,31,0.55)] sm:p-8">
              {children}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#7d8882]">
              <TrustItem icon={ShieldCheck}>Role-based access</TrustItem>
              <TrustItem icon={Users}>Admin, HR and employee views</TrustItem>
            </div>
          </div>
        </main>

        <footer className="flex flex-col items-center justify-between gap-1.5 border-t border-[#e5ded2]/80 py-4 text-center text-[11px] text-[#8a948f] sm:flex-row sm:text-left">
          <span>HCM Lite</span>
          <span>Built for people teams</span>
        </footer>
      </div>
    </div>
  );
}
