import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../contexts/useAuth";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import { getRoleHome } from "../utils/roleHome";

const strengthLabels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const strengthColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-hcm-accent",
  "bg-hcm-accent",
];

export default function ChangePassword() {
  const { user, updateUser, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const checks = [
    formData.newPassword.length >= 12,
    /[a-z]/.test(formData.newPassword) && /[A-Z]/.test(formData.newPassword),
    /[0-9]/.test(formData.newPassword),
    /[^A-Za-z0-9]/.test(formData.newPassword),
  ];
  const strength = checks.filter(Boolean).length;
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.newPassword === formData.confirmPassword;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-hcm-canvas text-sm text-hcm-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.newPassword.length < 12) {
      toast.error("Use at least 12 characters for your new password");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }
    if (!user.mustChangePassword && !formData.currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    setSubmitting(true);
    try {
      await API.put("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      updateUser({ mustChangePassword: false });
      toast.success("Password changed successfully");
      navigate(getRoleHome(user.role), { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change password",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordInput = (name, label, key, autoComplete) => (
    <AuthField
      id={`change-${name}`}
      label={label}
      icon={LockKeyhole}
      type={visible[key] ? "text" : "password"}
      autoComplete={autoComplete}
      value={formData[name]}
      onChange={(event) =>
        setFormData((current) => ({
          ...current,
          [name]: event.target.value,
        }))
      }
      required={name !== "currentPassword" || !user.mustChangePassword}
      action={
        <button
          type="button"
          onClick={() => setVisible({ ...visible, [key]: !visible[key] })}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-hcm-muted transition hover:bg-hcm-canvas hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/25"
          aria-label={visible[key] ? "Hide password" : "Show password"}
        >
          {visible[key] ? (
            <EyeOff className="h-[18px] w-[18px]" />
          ) : (
            <Eye className="h-[18px] w-[18px]" />
          )}
        </button>
      }
    />
  );

  return (
    <AuthShell variant="security">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hcm-accent/15 bg-hcm-accent-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-hcm-accent">
            <ShieldCheck className="h-3 w-3" />
            {user.mustChangePassword ? "First sign-in" : "Account security"}
          </span>
          {!user.mustChangePassword && (
            <button
              type="button"
              onClick={() => navigate(getRoleHome(user.role))}
              className="-mr-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold text-hcm-muted transition hover:text-hcm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hcm-accent/20"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to workspace
            </button>
          )}
        </div>

        <h2 className="mt-5 font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-hcm-ink">
          {user.mustChangePassword ? "Choose your password." : "Change password."}
        </h2>
        <p className="mt-2 text-sm leading-6 text-hcm-muted">
          {user.mustChangePassword
            ? "Replace your temporary password to continue."
            : "Enter your current password, then choose a new one."}
        </p>
      </div>

      {user.mustChangePassword && (
        <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-hcm-accent/15 bg-hcm-accent-soft p-3.5 text-[12px] leading-5 text-hcm-accent">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          You are signed in with a temporary password. Current password is not
          required for this first change.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={user.email || ""}
          readOnly
          tabIndex={-1}
          className="sr-only"
        />
        {!user.mustChangePassword &&
          renderPasswordInput(
            "currentPassword",
            "Current password",
            "current",
            "current-password",
          )}
        {renderPasswordInput(
          "newPassword",
          "New password",
          "next",
          "new-password",
        )}

        <div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  index < strength
                    ? strengthColors[strength - 1]
                    : "bg-hcm-canvas-deep"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 flex items-center justify-between text-[11px] text-hcm-muted">
            <span>{strengthLabels[strength]}</span>
            <span>{formData.newPassword.length}/12+ characters</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
            {[
              ["12+ characters", checks[0]],
              ["Upper & lowercase", checks[1]],
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

        {renderPasswordInput(
          "confirmPassword",
          "Confirm new password",
          "confirm",
          "new-password",
        )}
        {formData.confirmPassword.length > 0 && (
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
          className="hcm-btn-primary group flex h-11 w-full items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hcm-accent/20 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          Update password
        </button>
      </form>
    </AuthShell>
  );
}
