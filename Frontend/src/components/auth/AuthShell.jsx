import { Link } from "react-router-dom";
import { Building2, ShieldCheck } from "lucide-react";

function Brand() {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/15"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-hcm-ink text-hcm-lime transition-transform duration-200 group-hover:-translate-y-0.5">
        <Building2 className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[17px] font-semibold tracking-[-0.02em] text-hcm-ink">
          HCM Lite
        </span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-hcm-muted">
          People operations
        </span>
      </span>
    </Link>
  );
}

export default function AuthShell({ variant = "login", children }) {
  const isSetup = variant === "setup";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hcm-canvas text-hcm-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(ellipse_at_top,rgba(15,107,79,0.1),transparent_64%)]"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-5 sm:py-6">
          <Brand />
          {isSetup && (
            <Link
              to="/login"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-hcm-muted transition hover:bg-hcm-surface hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
            >
              Back to sign in
            </Link>
          )}
        </header>

        <main className="flex flex-1 items-center justify-center py-4 sm:py-8">
          <div className={`w-full ${isSetup ? "max-w-[600px]" : "max-w-[420px]"}`}>
            <div className="rounded-[20px] border border-hcm-line bg-hcm-surface p-5 shadow-hcm sm:p-8">
              {children}
            </div>

            {!isSetup && (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-hcm-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-hcm-accent" />
                Secure sign-in with role-based access
              </p>
            )}
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
