import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import {
  CalendarDays,
  Loader2,
  Megaphone,
  Plus,
  Send,
  Users,
  X,
} from "lucide-react";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR" },
  { value: "employee", label: "Employees" },
];

const roleTone = {
  admin: "bg-slate-100 text-slate-700",
  hr: "bg-blue-50 text-blue-700",
  employee: "bg-emerald-50 text-emerald-700",
};

const initialForm = {
  title: "",
  content: "",
  targetRoles: ["admin", "hr", "employee"],
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function Announcements() {
  const { user } = useAuth();
  const canPost = user?.role === "admin" || user?.role === "hr";
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await API.get("/announcements");
      setAnnouncements(response.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load announcements",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    API.get("/announcements")
      .then((response) => {
        if (active) setAnnouncements(response.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load announcements",
          );
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
      total: announcements.length,
      latest: announcements.length
        ? formatDate(announcements[0].createdAt)
        : "—",
      audiences: new Set(
        announcements.flatMap((announcement) => announcement.targetRoles || []),
      ).size,
    }),
    [announcements],
  );

  const toggleRole = (role) => {
    setFormData((current) => {
      const selected = current.targetRoles.includes(role);
      return {
        ...current,
        targetRoles: selected
          ? current.targetRoles.filter((item) => item !== role)
          : [...current.targetRoles, role],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.targetRoles.length) {
      toast.error("Select at least one audience");
      return;
    }
    setSubmitting(true);
    try {
      await API.post("/announcements", formData);
      toast.success("Announcement posted");
      setShowForm(false);
      setFormData(initialForm);
      await refresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to post announcement",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
              Company communication
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Announcements
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {canPost
                ? "Share updates with the right audience. Only targeted roles will see each post."
                : "Updates from your company, in one place."}
            </p>
          </div>
          {canPost && (
            <button
              type="button"
              onClick={() => setShowForm((value) => !value)}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              Post announcement
            </button>
          )}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total posts", value: stats.total, icon: Megaphone },
          { label: "Latest post", value: stats.latest, icon: CalendarDays },
          { label: "Audiences", value: stats.audiences, icon: Users },
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

      {canPost && showForm && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                New post
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Write an announcement
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              aria-label="Close announcement form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-slate-500">
              Title
              <input
                value={formData.title}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                placeholder="e.g. Eid holiday schedule"
                maxLength={140}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Message
              <textarea
                value={formData.content}
                onChange={(event) =>
                  setFormData({ ...formData, content: event.target.value })
                }
                rows={4}
                placeholder="Share the details..."
                className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              />
            </label>
            <div>
              <p className="text-xs font-medium text-slate-500">Audience</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleOptions.map((role) => {
                  const selected = formData.targetRoles.includes(role.value);
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => toggleRole(role.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                        selected
                          ? "bg-slate-900 text-white ring-slate-900"
                          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publish announcement
            </button>
          </form>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading announcements...
        </div>
      ) : announcements.length ? (
        <section className="space-y-3">
          {announcements.map((announcement) => (
            <article
              key={announcement._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-slate-300 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {announcement.title}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {announcement.content}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(announcement.targetRoles || []).map((role) => (
                      <span
                        key={role}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${roleTone[role] || "bg-slate-100 text-slate-600"}`}
                      >
                        {role === "employee" ? "Employees" : role}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400">
                      Posted by {announcement.postedBy?.firstName || "Admin"}{" "}
                      {announcement.postedBy?.lastName || ""}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            No announcements yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Company updates will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
