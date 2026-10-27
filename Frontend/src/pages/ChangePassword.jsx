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
  "bg-emerald-500",
  "bg-emerald-600",
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
    formData.newPassword.length >= 8,
    /[A-Z]/.test(formData.newPassword),
    /[0-9]/.test(formData.newPassword),
    /[^A-Za-z0-9]/.test(formData.newPassword),
  ];
  const strength = checks.filter(Boolean).length;
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.newPassword === formData.confirmPassword;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-[#f4f1e9] text-sm text-[#5d6c65]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.newPassword.length < 8) {
      toast.error("Use at least 8 characters for your new password");
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
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7d8882] transition hover:bg-[#f1eee6] hover:text-[#14241e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d4d]/30"
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
        {!user.mustChangePassword && (
          <button
            type="button"
            onClick={() => navigate(getRoleHome(user.role))}
            className="mb-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#7d8882] transition hover:text-[#14241e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f5d4d]/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to dashboard
          </button>
        )}

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8de] bg-[#f3f8f0] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#32624f]">
          <KeyRound className="h-3 w-3" />
          {user.mustChangePassword ? "First sign-in" : "Account security"}
        </span>
        <h2 className="mt-4 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-[#14241e]">
          {user.mustChangePassword ? "Choose your password." : "Change password."}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6f7b75]">
          {user.mustChangePassword
            ? "Your temporary password must be replaced before you can continue."
            : "Enter your current password, then choose a new one."}
        </p>
      </div>

      {user.mustChangePassword && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#dfe8de] bg-[#f3f8f0] p-3.5 text-[12px] leading-5 text-[#32624f]">
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
                className={`h-1.5 flex-1 rounded-full ${
                  index < strength
                    ? strengthColors[strength - 1]
                    : "bg-[#e7e2d7]"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 flex items-center justify-between text-[11px] text-[#8a948f]">
            <span>{strengthLabels[strength]}</span>
            <span>{formData.newPassword.length}/8+ characters</span>
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
                  met ? "text-[#2f6b50]" : "text-[#9aa39d]"
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
              passwordsMatch ? "text-[#2f6b50]" : "text-[#b42318]"
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
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#10251f] px-4 text-sm font-semibold text-[#f8f5eb] transition hover:bg-[#1a3a30] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2f5d4d]/20 disabled:cursor-wait disabled:opacity-70"
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
