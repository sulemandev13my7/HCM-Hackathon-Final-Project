import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Link2Off,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import API from "../services/api";
import { useAuth } from "../contexts/useAuth";

const tokenPattern = /^[a-f0-9]{64}$/;
const strengthLabels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const strengthColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-hcm-accent",
  "bg-hcm-accent",
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const validToken = tokenPattern.test(token);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checks = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[0-9]/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ];
  const strength = checks.filter(Boolean).length;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const validate = () => {
    const nextErrors = {};
    if (newPassword.length < 8) {
      nextErrors.newPassword = "Use at least 8 characters.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`reset-${firstInvalid}`)?.focus();
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
      await API.post("/auth/reset-password", {
        token,
        newPassword,
      });
      logout();
      toast.success("Password reset. Sign in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.request
            ? "We could not reach your workspace. Check your connection and try again."
            : "We could not reset your password. Ask your admin for a new link."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!validToken) {
    return (
      <AuthShell variant="security">
        <div>
          <Link
            to="/login"
            className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-hcm-muted transition hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-800">
            <Link2Off className="h-3 w-3" />
            Invalid link
          </span>
          <h2 className="mt-4 font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-hcm-ink">
            This link can’t be used.
          </h2>
          <p className="mt-2 text-sm leading-6 text-hcm-muted">
            The link is missing, incomplete, or no longer valid. Ask your admin
            for a fresh one-time link.
          </p>
        </div>

        <Link
          to="/forgot-password"
          className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-hcm-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-hcm-accent-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/15"
        >
          <KeyRound className="h-4 w-4" />
          Password recovery help
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="security">
      <div>
        <Link
          to="/login"
          className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-hcm-muted transition hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-hcm-accent/15 bg-hcm-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-hcm-accent">
          <KeyRound className="h-3 w-3" />
          Secure reset
        </span>
        <h2 className="mt-4 font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-hcm-ink">
          Choose a new password.
        </h2>
        <p className="mt-2 text-sm leading-6 text-hcm-muted">
          This one-time link stops working after your password is updated.
        </p>
      </div>

      {error && (
        <div
          id="reset-error"
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
        <input
          type="text"
          name="username"
          autoComplete="username"
          value=""
          readOnly
          tabIndex={-1}
          className="sr-only"
          aria-hidden="true"
        />

        <AuthField
          id="reset-newPassword"
          label="New password"
          icon={LockKeyhole}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            if (error) setError("");
            if (fieldErrors.newPassword) {
              setFieldErrors((current) => ({ ...current, newPassword: "" }));
            }
          }}
          error={fieldErrors.newPassword}
          required
          autoFocus
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

        <div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index < strength
                    ? strengthColors[strength - 1]
                    : "bg-hcm-canvas-deep"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 flex items-center justify-between text-[11px] text-hcm-muted">
            <span>{strengthLabels[strength]}</span>
            <span>{newPassword.length}/8+ characters</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              ["8+ characters", checks[0]],
              ["Uppercase letter", checks[1]],
              ["Number", checks[2]],
              ["Symbol", checks[3]],
            ].map(([label, met]) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1 ${
                  met ? "text-hcm-accent" : "text-hcm-muted"
                }`}
              >
                <Check
                  className={`h-3 w-3 ${met ? "opacity-100" : "opacity-30"}`}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        <AuthField
          id="reset-confirmPassword"
          label="Confirm new password"
          icon={LockKeyhole}
          type={showConfirm ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repeat your new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (error) setError("");
            if (fieldErrors.confirmPassword) {
              setFieldErrors((current) => ({
                ...current,
                confirmPassword: "",
              }));
            }
          }}
          error={fieldErrors.confirmPassword}
          required
          action={
            <button
              type="button"
              onClick={() => setShowConfirm((current) => !current)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/25"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
            >
              {showConfirm ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          }
        />

        {confirmPassword.length > 0 && (
          <p
            className={`flex items-center gap-1.5 text-xs ${
              passwordsMatch ? "text-hcm-accent" : "text-rose-700"
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {passwordsMatch
              ? "Passwords match"
              : "Passwords do not match yet"}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-hcm-accent px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-hcm-accent-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/15 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Set new password
            </>
          )}
        </button>
      </form>

      <p className="mt-4 flex items-start justify-center gap-1.5 text-center text-[11px] leading-5 text-hcm-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hcm-accent" />
        Need a new link? Ask your workspace admin.
      </p>
    </AuthShell>
  );
}
