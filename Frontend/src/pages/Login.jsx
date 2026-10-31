import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import { getRoleHome } from "../utils/roleHome";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    navigate(
      user.mustChangePassword ? "/change-password" : getRoleHome(user.role),
      { replace: true },
    );
  }, [loading, user, navigate]);

  const validate = () => {
    const nextErrors = {};
    if (!email.trim()) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Enter your password.";
    }
    setFieldErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      const id = firstInvalid === "email" ? "login-email" : "login-password";
      document.getElementById(id)?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      toast.success(`Welcome back, ${data.user.firstName || "there"}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "We could not reach your workspace. Check your connection and try again."
            : "We could not sign you in. Check your details and try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-hcm-canvas text-sm text-hcm-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        {user ? "Opening your workspace..." : "Restoring your session..."}
      </div>
    );
  }

  return (
    <AuthShell variant="login">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hcm-accent/15 bg-hcm-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-hcm-accent">
          <LockKeyhole className="h-3 w-3" />
          Workspace access
        </span>
        <h2 className="mt-4 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-hcm-ink sm:text-[32px]">
          Welcome back
        </h2>
        <p className="mt-2 text-sm leading-6 text-hcm-muted">
          Sign in to continue to your workspace.
        </p>
      </div>

      {error && (
        <div
          id="login-error"
          role="alert"
          aria-live="polite"
          className="mt-5 flex items-start gap-2.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] leading-5 text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-busy={submitting}
        noValidate
        className="mt-6 space-y-4"
      >
        <AuthField
          id="login-email"
          label="Email address"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your work email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError("");
            if (fieldErrors.email) {
              setFieldErrors((current) => ({ ...current, email: "" }));
            }
          }}
          error={fieldErrors.email}
          required
        />

        <AuthField
          id="login-password"
          label="Password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (error) setError("");
            if (fieldErrors.password) {
              setFieldErrors((current) => ({ ...current, password: "" }));
            }
          }}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onBlur={() => setCapsLock(false)}
          error={fieldErrors.password}
          required
          hint={capsLock ? "Caps Lock is on" : undefined}
          action={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/25"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          }
        />

        <div className="-my-1 flex justify-end">
          <Link
            to="/forgot-password"
            className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-hcm-muted underline-offset-2 transition hover:text-hcm-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="hcm-btn-primary group flex h-12 w-full items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/20 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Signing you in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs text-hcm-muted">
        <ShieldCheck className="h-3.5 w-3.5 text-hcm-accent" />
        Your role controls what you can access.
      </p>

      <div className="mt-7 flex items-center gap-3 text-xs font-medium text-hcm-muted">
        <span className="h-px flex-1 bg-hcm-line" />
        New to HCM Lite?
        <span className="h-px flex-1 bg-hcm-line" />
      </div>

      <Link
        to="/signup"
        className="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-hcm-line bg-hcm-surface-soft px-4 text-sm font-semibold text-hcm-ink transition hover:border-hcm-line-strong hover:bg-hcm-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/10"
      >
        Create a company workspace
        <ArrowUpRight className="h-3.5 w-3.5 text-hcm-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>

      <p className="mt-5 text-center text-xs leading-5 text-hcm-muted">
        Joining an existing workspace? Ask your HR team or Admin for an account.
      </p>
    </AuthShell>
  );
}
