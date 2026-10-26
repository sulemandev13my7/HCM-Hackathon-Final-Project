import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
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
  Sparkles,
} from "lucide-react";

const strengthLabels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const strengthColors = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-600",
];

const homeForRole = (role) => {
  if (role === "admin") return "/admin";
  if (role === "hr") return "/hr";
  return "/employee";
};

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
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
      navigate(homeForRole(user.role), { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change password",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderPasswordInput = (name, label, key, autoComplete) => (
    <label className="block text-xs font-medium text-slate-500">
      {label}
      <div className="relative mt-1">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type={visible[key] ? "text" : "password"}
          autoComplete={autoComplete}
          value={formData[name]}
          onChange={(event) =>
            setFormData({ ...formData, [name]: event.target.value })
          }
          required={name !== "currentPassword" || !user.mustChangePassword}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
        <button
          type="button"
          onClick={() => setVisible({ ...visible, [key]: !visible[key] })}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={visible[key] ? "Hide password" : "Show password"}
        >
          {visible[key] ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-blue-300" />
            HCM Lite
          </span>
          <h1 className="mt-12 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Protect your account with a stronger password.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
            Use at least 8 characters. Mixing uppercase letters, numbers and a
            symbol makes your account significantly harder to guess.
          </p>
        </div>
        <div className="relative space-y-3">
          {[
            "Your password is stored as a secure hash.",
            "All admin and HR actions are audit logged.",
            "You can return to your dashboard right after.",
          ].map((item) => (
            <p
              key={item}
              className="flex items-center gap-2 text-sm text-slate-300"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                <Check className="h-3 w-3" />
              </span>
              {item}
            </p>
          ))}
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-slate-50 p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <Link
              to={homeForRole(user.role)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <KeyRound className="h-4 w-4" />
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                {user.mustChangePassword ? "First sign-in" : "Account security"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {user.mustChangePassword
                  ? "Choose your password"
                  : "Change password"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {user.mustChangePassword
                  ? "Your temporary password must be replaced before you can continue."
                  : "Enter your current password, then choose a new one."}
              </p>
            </div>

            {user.mustChangePassword && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                You are signed in with a temporary password. Current password is
                not required for this first change.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
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
                        met ? "text-emerald-600" : "text-slate-400"
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
                    passwordsMatch ? "text-emerald-600" : "text-rose-600"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Update password
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
