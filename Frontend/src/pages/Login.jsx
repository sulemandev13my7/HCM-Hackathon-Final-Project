import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import API from "../services/api";
import { getRoleHome } from "../utils/roleHome";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [setupPending, setSetupPending] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    API.get("/auth/check-setup")
      .then((response) => {
        if (active) setSetupPending(Boolean(response.data?.needsSetup));
      })
      .catch(() => {
        if (active) setSetupPending(false);
      });
    return () => {
      active = false;
    };
  }, []);

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
      <div className="flex min-h-screen items-center justify-center gap-2 bg-[#f4f1e9] text-sm text-[#5d6c65]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {user ? "Opening your workspace..." : "Restoring your session..."}
      </div>
    );
  }

  return (
    <AuthShell variant="login">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8de] bg-[#f3f8f0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#32624f]">
          <LockKeyhole className="h-3 w-3" />
          Workspace access
        </span>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[#14241e]">
          Welcome back.
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6f7b75]">
          Sign in with the account your workspace admin created for you.
        </p>
      </div>

      {error && (
        <div
          id="login-error"
          role="alert"
          aria-live="polite"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#f0c8c4] bg-[#fef4f2] px-3.5 py-3 text-[13px] leading-5 text-[#9d2d24]"
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
          placeholder="you@company.com"
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
          autoFocus
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
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7d8882] transition hover:bg-[#f1eee6] hover:text-[#14241e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d4d]/30"
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

        <div className="-mt-1 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-[11px] font-semibold text-[#5d6c65] underline-offset-2 transition hover:text-[#14241e] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d4d]/25"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#10251f] px-4 text-sm font-semibold text-[#f8f5eb] transition hover:bg-[#1a3a30] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/20 disabled:cursor-wait disabled:opacity-70"
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

      <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-[#87918c]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#3d7a5d]" />
        Your role controls exactly what you can see and do.
      </p>

      {setupPending && (
        <>
          <div className="mt-7 flex items-center gap-3 text-[11px] font-medium text-[#98a19c]">
            <span className="h-px flex-1 bg-[#e7e2d7]" />
            New to HCM Lite?
            <span className="h-px flex-1 bg-[#e7e2d7]" />
          </div>

          <button
            type="button"
            onClick={() => navigate("/setup")}
            className="group mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#ddd7cb] bg-white px-4 text-[13px] font-semibold text-[#32433c] transition hover:border-[#c9c1b2] hover:bg-[#fbfaf6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/10"
          >
            <Building2 className="h-4 w-4 text-[#6f7b75]" />
            Set up a company workspace
            <ArrowRight className="h-3.5 w-3.5 text-[#98a19c] transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      <p className="mt-5 text-center text-[11px] leading-5 text-[#8a948f]">
        Need an account? Ask your workspace administrator.
      </p>
    </AuthShell>
  );
}
