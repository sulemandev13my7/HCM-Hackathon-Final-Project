import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../contexts/useAuth";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";

const steps = [
  { id: 1, title: "Company", description: "Organization details" },
  { id: 2, title: "Admin", description: "Your login account" },
  { id: 3, title: "Launch", description: "Confirm and start" },
];

const initialForm = {
  companyName: "",
  firstName: "",
  lastName: "",
  adminEmail: "",
  adminPassword: "",
  confirmPassword: "",
};

const fieldIds = {
  companyName: "setup-company",
  firstName: "setup-first-name",
  adminEmail: "setup-email",
  adminPassword: "setup-password",
  confirmPassword: "setup-confirm-password",
};

const passwordChecks = [
  { label: "8+ characters", test: (value) => value.length >= 8 },
  { label: "A number", test: (value) => /\d/.test(value) },
  {
    label: "Upper & lowercase",
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  { label: "A symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

function PasswordStrength({ password }) {
  const passed = passwordChecks.filter((item) => item.test(password)).length;
  const label =
    !password
      ? "Use 8 or more characters"
      : passed <= 1
        ? "Needs a little more"
        : passed === 2
          ? "Getting better"
          : passed === 3
            ? "Strong password"
            : "Excellent password";
  const tone =
    passed >= 3 ? "bg-[#2f6b50]" : passed === 2 ? "bg-[#c98a3d]" : "bg-[#cdb6a5]";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index < passed ? tone : "bg-[#e6e1d7]"
              }`}
            />
          ))}
        </div>
        <span className="w-28 text-right text-[10px] font-medium text-[#7d8882]">
          {label}
        </span>
      </div>
      <p className="text-[11px] leading-5 text-[#8a948f]">
        Add a number, mixed case or symbol for a stronger password.
      </p>
    </div>
  );
}

export default function FirstRunSetup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const { setup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    API.get("/auth/check-setup")
      .then((response) => {
        if (active && !response.data.needsSetup) {
          navigate("/", { replace: true });
        }
      })
      .catch(() => {
        if (active) setCheckError(true);
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  const update = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
    if (submitError) setSubmitError("");
  };

  const validateStep = () => {
    const nextErrors = {};

    if (step === 1 && !formData.companyName.trim()) {
      nextErrors.companyName = "Enter your company name to continue.";
    }

    if (step === 2) {
      if (!formData.firstName.trim()) {
        nextErrors.firstName = "Enter your first name.";
      }
      if (!/^\S+@\S+\.\S+$/.test(formData.adminEmail.trim())) {
        nextErrors.adminEmail = "Enter a valid email address.";
      }
      if (formData.adminPassword.length < 8) {
        nextErrors.adminPassword = "Use at least 8 characters.";
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      window.setTimeout(() => {
        document.getElementById(fieldIds[firstInvalid])?.focus();
      }, 0);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (step < 3) {
      if (validateStep()) {
        setStep((current) => Math.min(current + 1, 3));
      }
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await setup({
        companyName: formData.companyName.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPassword: formData.adminPassword,
      });
      toast.success("Workspace created. Welcome to HCM Lite!");
      navigate("/admin", { replace: true });
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "We could not create your workspace. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f1e9] text-[#14241e]">
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#10251f] text-[#d7f59f]">
          <Building2 className="h-6 w-6" />
        </span>
        <div className="flex items-center gap-2 text-sm text-[#5d6c65]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your workspace...
        </div>
      </div>
    );
  }

  return (
    <AuthShell variant="setup">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8de] bg-[#f3f8f0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#32624f]">
          <CheckCircle2 className="h-3 w-3" />
          First-run setup
        </span>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[#14241e]">
          Create your workspace.
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6f7b75]">
          Three short steps. Your admin account is created at the end.
        </p>
      </div>

      <div className="mt-6">
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((item) => (
            <span
              key={item.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step > item.id
                  ? "bg-[#2f6b50]"
                  : step === item.id
                    ? "bg-[#10251f]"
                    : "bg-[#e7e2d7]"
              }`}
            />
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {steps.map((item) => {
            const complete = step > item.id;
            const current = step === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (complete) {
                    setErrors({});
                    setSubmitError("");
                    setStep(item.id);
                  }
                }}
                disabled={!complete}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-1 py-1 text-left text-[11px] font-semibold transition ${
                  complete
                    ? "text-[#32624f] hover:bg-[#f1f6ef]"
                    : current
                      ? "text-[#14241e]"
                      : "cursor-default text-[#9aa39d]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    complete
                      ? "bg-[#e6f0e5] text-[#2f6b50]"
                      : current
                        ? "bg-[#10251f] text-white"
                        : "bg-[#eee9df] text-[#9aa39d]"
                  }`}
                >
                  {complete ? <Check className="h-3 w-3" /> : item.id}
                </span>
                {item.title}
              </button>
            );
          })}
        </div>
      </div>

      {checkError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#efd3ad] bg-[#fdf7ed] px-3.5 py-3 text-[12px] leading-5 text-[#8a5a14]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          We could not verify whether setup is already complete. Check your
          connection before continuing.
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#f0c8c4] bg-[#fef4f2] px-3.5 py-3 text-[13px] leading-5 text-[#9d2d24]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-busy={submitting}
        noValidate
        className="mt-5 space-y-4"
      >
        {step === 1 && (
          <>
            <AuthField
              id="setup-company"
              label="Company name"
              icon={Building2}
              placeholder="e.g. Saylani Welfare Trust"
              value={formData.companyName}
              onChange={(event) => update("companyName", event.target.value)}
              error={errors.companyName}
              maxLength={80}
              autoComplete="organization"
              required
              autoFocus
            />
            <div className="flex gap-2.5 rounded-xl border border-[#e6e1d7] bg-[#faf8f2] p-3.5 text-[12px] leading-5 text-[#6f7b75]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#3d7a5d]" />
              This name appears on dashboards, payslips and announcements. You
              can update it later in Settings.
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                id="setup-first-name"
                label="First name"
                icon={UserRound}
                placeholder="Ayesha"
                value={formData.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                error={errors.firstName}
                autoComplete="given-name"
                maxLength={40}
                required
                autoFocus
              />
              <AuthField
                id="setup-last-name"
                label="Last name"
                icon={UserRound}
                placeholder="Khan"
                value={formData.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                autoComplete="family-name"
                maxLength={40}
                optional
              />
            </div>

            <AuthField
              id="setup-email"
              label="Admin email"
              icon={Mail}
              type="email"
              inputMode="email"
              placeholder="you@company.com"
              value={formData.adminEmail}
              onChange={(event) => update("adminEmail", event.target.value)}
              error={errors.adminEmail}
              autoComplete="email"
              maxLength={254}
              required
            />

            <AuthField
              id="setup-password"
              label="Password"
              icon={LockKeyhole}
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.adminPassword}
              onChange={(event) => update("adminPassword", event.target.value)}
              error={errors.adminPassword}
              autoComplete="new-password"
              maxLength={72}
              required
              hint={<PasswordStrength password={formData.adminPassword} />}
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

            <AuthField
              id="setup-confirm-password"
              label="Confirm password"
              icon={LockKeyhole}
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={(event) =>
                update("confirmPassword", event.target.value)
              }
              error={errors.confirmPassword}
              autoComplete="new-password"
              maxLength={72}
              required
            />
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[#e6e1d7] bg-[#fbfaf6]">
              <div className="flex items-center gap-3 border-b border-[#e9e4da] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2f5d4d]">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a948f]">
                    Company
                  </p>
                  <p className="truncate text-sm font-semibold text-[#14241e]">
                    {formData.companyName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7d8882] transition hover:bg-white hover:text-[#14241e]"
                  aria-label="Edit company details"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2f5d4d]">
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a948f]">
                    Administrator
                  </p>
                  <p className="truncate text-sm font-semibold text-[#14241e]">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="truncate text-xs text-[#7d8882]">
                    {formData.adminEmail}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7d8882] transition hover:bg-white hover:text-[#14241e]"
                  aria-label="Edit administrator details"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-[#dfe8de] bg-[#f3f8f0] p-3.5 text-[12px] leading-5 text-[#32624f]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Completing setup creates your admin account and signs you in
              automatically. No demo data will be added.
            </div>
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setSubmitError("");
                setStep((current) => current - 1);
              }}
              disabled={submitting}
              className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#ddd7cb] bg-white px-4 text-[13px] font-semibold text-[#32433c] transition hover:border-[#c9c1b2] hover:bg-[#fbfaf6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/10 disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#10251f] px-4 text-sm font-semibold text-[#f8f5eb] transition hover:bg-[#1a3a30] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/20 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating workspace...
              </>
            ) : step === 3 ? (
              <>
                Create workspace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-[11px] text-[#8a948f]">
        Already set up?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#32624f] underline decoration-[#b8c9bd] underline-offset-2 transition hover:text-[#10251f]"
        >
          Sign in to your workspace
        </Link>
      </p>
    </AuthShell>
  );
}
