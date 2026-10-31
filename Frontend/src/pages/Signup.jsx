import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import { getRoleHome } from "../utils/roleHome";

const initialForm = {
  companyName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const fieldIds = {
  companyName: "signup-company",
  firstName: "signup-first-name",
  lastName: "signup-last-name",
  email: "signup-email",
  password: "signup-password",
};

const passwordChecks = [
  { label: "12+ characters", test: (value) => value.length >= 12 },
  { label: "A number", test: (value) => /\d/.test(value) },
  {
    label: "Upper & lowercase",
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { label: "A symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

function PasswordStrength({ password }) {
  const passed = passwordChecks.filter((item) => item.test(password)).length;
  const complete = passed === passwordChecks.length;

  return (
    <div className="space-y-2.5">
      <div className="flex gap-1" aria-hidden="true">
        {passwordChecks.map((item, index) => (
          <span
            key={item.label}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index < passed
                ? complete
                  ? "bg-hcm-accent"
                  : "bg-amber-500"
                : "bg-hcm-canvas-deep"
            }`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {passwordChecks.map((item) => {
          const met = item.test(password);
          return (
            <li
              key={item.label}
              className={`flex items-center gap-1.5 text-xs ${
                met ? "text-hcm-accent" : "text-hcm-muted"
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                  met ? "bg-hcm-accent-soft" : "bg-hcm-canvas"
                }`}
              >
                {met ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Signup() {
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const { signup, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    navigate(
      user.mustChangePassword ? "/change-password" : getRoleHome(user.role),
      { replace: true },
    );
  }, [loading, user, navigate]);

  const update = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
    if (submitError) setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.companyName.trim()) {
      nextErrors.companyName = "Enter your company name.";
    }
    if (!formData.firstName.trim()) {
      nextErrors.firstName = "Enter your first name.";
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid work email.";
    }
    if (!passwordChecks.every((item) => item.test(formData.password))) {
      nextErrors.password = "Meet all password requirements.";
    }

    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(fieldIds[firstInvalid])?.focus();
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data = await signup({
        companyName: formData.companyName.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success(`Welcome to HCM Lite, ${data.user.firstName || "there"}!`);
      navigate(getRoleHome(data.user.role), { replace: true });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          (error.request
            ? "We could not reach the server. Check your connection and try again."
            : "We could not create your workspace. Try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-hcm-canvas text-sm text-hcm-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        {user ? "Opening your workspace..." : "Preparing signup..."}
      </div>
    );
  }

  return (
    <AuthShell variant="signup">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hcm-accent/15 bg-hcm-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-hcm-accent">
          <Building2 className="h-3 w-3" />
          Company workspace
        </span>
        <h2 className="mt-4 font-display text-[30px] font-bold leading-tight tracking-[-0.03em] text-hcm-ink sm:text-[32px]">
          Create your company workspace
        </h2>
        <p className="mt-2 text-sm leading-6 text-hcm-muted">
          Add your company and Admin details to get started.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-5 flex items-start gap-2.5 rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] leading-5 text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-busy={submitting}
        noValidate
        className="mt-7 space-y-4"
      >
        <AuthField
          id="signup-company"
          label="Company name"
          icon={Building2}
          type="text"
          autoComplete="organization"
          placeholder="Enter your company"
          className="placeholder:text-hcm-ink-soft"
          value={formData.companyName}
          onChange={(event) => update("companyName", event.target.value)}
          error={errors.companyName}
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <AuthField
            id="signup-first-name"
            label="First name"
            icon={UserRound}
            type="text"
            autoComplete="given-name"
            placeholder="Your first name"
            className="placeholder:text-hcm-ink-soft"
            value={formData.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            error={errors.firstName}
            required
          />
          <AuthField
            id="signup-last-name"
            label="Last name"
            icon={UserRound}
            type="text"
            autoComplete="family-name"
            placeholder="Your last name"
            className="placeholder:text-hcm-ink-soft"
            value={formData.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            optional
          />
        </div>

        <AuthField
          id="signup-email"
          label="Work email"
          icon={Mail}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your work email"
          className="placeholder:text-hcm-ink-soft"
          value={formData.email}
          onChange={(event) => update("email", event.target.value)}
          error={errors.email}
          required
        />

        <AuthField
          id="signup-password"
          label="Password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Create a secure password"
          className="placeholder:text-hcm-ink-soft"
          value={formData.password}
          onChange={(event) => update("password", event.target.value)}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onBlur={() => setCapsLock(false)}
          error={errors.password}
          hint={capsLock ? "Caps Lock is on" : undefined}
          required
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

        <PasswordStrength password={formData.password} />

        <button
          type="submit"
          disabled={submitting}
          className="hcm-btn-primary group flex h-12 w-full items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/20 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              Creating workspace...
            </>
          ) : (
            <>
              Create workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-hcm-accent/15 bg-hcm-accent-soft/70 px-3.5 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-hcm-accent" />
        <div>
          <p className="text-xs font-semibold text-hcm-accent-strong">
            Private company workspace
          </p>
          <p className="mt-0.5 text-xs leading-5 text-hcm-muted">
            Your company records stay separate from other organizations.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 text-xs font-medium text-hcm-muted">
        <span className="h-px flex-1 bg-hcm-line" />
        Already have a workspace?
        <span className="h-px flex-1 bg-hcm-line" />
      </div>

      <Link
        to="/login"
        className="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-hcm-line bg-hcm-surface-soft px-4 text-sm font-semibold text-hcm-ink transition hover:border-hcm-line-strong hover:bg-hcm-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/10"
      >
        Sign in to your account
        <ArrowUpRight className="h-3.5 w-3.5 text-hcm-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </Link>
    </AuthShell>
  );
}
