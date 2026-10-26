import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import { Button, PageHeader } from "../../components/ui";
import {
  Check,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  UserX,
  Users as UsersIcon,
  X,
} from "lucide-react";

const roleTone = {
  admin: "bg-slate-900 text-white ring-slate-900/10",
  hr: "bg-blue-50 text-blue-700 ring-blue-600/20",
  employee: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tempPassword, setTempPassword] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    API.get("/users")
      .then((response) => {
        if (active) setUsers(response.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || "Failed to load users");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      hr: users.filter((user) => user.role === "hr").length,
      admin: users.filter((user) => user.role === "admin").length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (!query) return true;
      return (
        `${user.firstName || ""} ${user.lastName || ""}`
          .toLowerCase()
          .includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [users, search, roleFilter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/users/hr", formData);
      toast.success("HR user created with an employee profile");
      setShowForm(false);
      setFormData(initialForm);
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create HR user");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (id) => {
    setBusy(id);
    try {
      const response = await API.put(`/users/${id}/reset-password`);
      setTempPassword(response.data.tempPassword);
      toast.success("Temporary password generated");
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setBusy("");
    }
  };

  const toggleStatus = async (targetUser) => {
    const action = targetUser.isActive ? "deactivate" : "activate";
    if (!window.confirm(`${action} ${targetUser.email}?`)) return;
    setBusy(targetUser._id);
    try {
      await API.put(`/users/${targetUser._id}/toggle-status`);
      toast.success(`User ${action}d`);
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setBusy("");
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success("Temporary password copied");
    } catch {
      toast.error("Copy failed — select the password manually");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access control"
        title="Users & access"
        description="Create HR accounts, reset credentials and control who can sign in. Each HR user automatically receives an employee profile."
        meta={
          <>
            <span className="hcm-chip-dark">
              <UsersIcon className="h-3.5 w-3.5" />
              {stats.total} users
            </span>
            <span className="hcm-chip-dark">
              <ShieldCheck className="h-3.5 w-3.5" />
              {stats.admin} admins
            </span>
          </>
        }
        actions={
          <Button
            variant="inverse"
            onClick={() => setShowForm((value) => !value)}
          >
            <Plus className="h-4 w-4" />
            Create HR user
          </Button>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total users", value: stats.total, icon: UsersIcon },
          { label: "Active", value: stats.active, icon: CheckCircle2 },
          { label: "HR accounts", value: stats.hr, icon: UserCog },
          { label: "Admins", value: stats.admin, icon: ShieldCheck },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-slate-300" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {tempPassword && (
        <section className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <KeyRound className="h-4 w-4" /> Temporary password
            </p>
            <p className="mt-1 font-mono text-lg text-emerald-900">
              {tempPassword}
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              Share it securely. The user must change it on next sign-in.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button
              type="button"
              onClick={() => setTempPassword("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              <X className="h-3.5 w-3.5" /> Dismiss
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                New account
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Create an HR user
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                They will be able to manage employees, attendance, leave and
                payroll.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Close user form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-3 sm:grid-cols-2"
          >
            <label className="text-xs font-medium text-slate-500">
              First name
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={formData.firstName}
                onChange={(event) =>
                  setFormData({ ...formData, firstName: event.target.value })
                }
                required
              />
            </label>
            <label className="text-xs font-medium text-slate-500">
              Last name
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={formData.lastName}
                onChange={(event) =>
                  setFormData({ ...formData, lastName: event.target.value })
                }
                required
              />
            </label>
            <label className="text-xs font-medium text-slate-500 sm:col-span-2">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={formData.email}
                onChange={(event) =>
                  setFormData({ ...formData, email: event.target.value })
                }
                required
              />
            </label>
            <label className="text-xs font-medium text-slate-500 sm:col-span-2">
              Temporary password
              <input
                type="text"
                minLength={6}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                value={formData.password}
                onChange={(event) =>
                  setFormData({ ...formData, password: event.target.value })
                }
                placeholder="At least 6 characters"
                required
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 sm:col-span-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Create HR account
            </button>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              All accounts
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {filtered.length} of {users.length} accounts
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white sm:w-60"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading accounts...
          </div>
        ) : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => {
                    const isProtected =
                      user.role === "admin" || user._id === currentUser?.id;
                    return (
                      <tr key={user._id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </span>
                            <div>
                              <p className="font-medium text-slate-800">
                                {user.firstName} {user.lastName}
                                {user._id === currentUser?.id && (
                                  <span className="ml-2 text-[11px] font-normal text-slate-400">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${roleTone[user.role] || "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              user.isActive
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.isActive ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => resetPassword(user._id)}
                              disabled={busy === user._id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {busy === user._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <KeyRound className="h-3.5 w-3.5" />
                              )}
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStatus(user)}
                              disabled={isProtected || busy === user._id}
                              title={
                                isProtected
                                  ? "Admin accounts and your own account cannot be disabled"
                                  : undefined
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                              {user.isActive ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 md:hidden">
              {filtered.map((user) => {
                const isProtected =
                  user.role === "admin" || user._id === currentUser?.id;
                return (
                  <div key={user._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${roleTone[user.role] || "bg-slate-100 text-slate-600 ring-slate-500/20"}`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => resetPassword(user._id)}
                        disabled={busy === user._id}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                      >
                        {busy === user._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="h-3.5 w-3.5" />
                        )}
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(user)}
                        disabled={isProtected || busy === user._id}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 disabled:text-slate-300"
                      >
                        {user.isActive ? (
                          <UserX className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <UsersIcon className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              No accounts match
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Adjust your search or role filter.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
