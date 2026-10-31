import { useCallback, useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import { Button, PageHeader } from "../../components/ui";
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
  admin: "bg-hcm-canvas-deep text-hcm-ink",
  hr: "bg-hcm-accent-soft text-hcm-accent",
  employee: "bg-hcm-accent-soft text-hcm-accent",
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
      <PageHeader
        eyebrow="Company communication"
        title="Announcements"
        description={
          canPost
            ? "Share updates with the right audience. Only targeted roles will see each post."
            : "Updates from your company, in one place."
        }
        meta={
          <>
            <span className="hcm-chip-dark">
              <Megaphone className="h-3.5 w-3.5" />
              {stats.total} posts
            </span>
            <span className="hcm-chip-dark">
              <Users className="h-3.5 w-3.5" />
              {stats.audiences} audiences
            </span>
          </>
        }
        actions={
          canPost && (
            <Button
              variant="inverse"
              onClick={() => setShowForm((value) => !value)}
            >
              <Plus className="h-4 w-4" />
              Post announcement
            </Button>
          )
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total posts", value: stats.total, icon: Megaphone },
          { label: "Latest post", value: stats.latest, icon: CalendarDays },
          { label: "Audiences", value: stats.audiences, icon: Users },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-hcm-line bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-hcm-muted">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-hcm-muted/40" />
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-hcm-ink">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {canPost && showForm && (
        <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                New post
              </p>
              <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                Write an announcement
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas"
              aria-label="Close announcement form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-hcm-muted">
              Title
              <input
                value={formData.title}
                onChange={(event) =>
                  setFormData({ ...formData, title: event.target.value })
                }
                placeholder="e.g. Eid holiday schedule"
                maxLength={140}
                className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10"
                required
              />
            </label>
            <label className="block text-xs font-medium text-hcm-muted">
              Message
              <textarea
                value={formData.content}
                onChange={(event) =>
                  setFormData({ ...formData, content: event.target.value })
                }
                rows={4}
                placeholder="Share the details..."
                className="mt-1 w-full resize-none rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10"
                required
              />
            </label>
            <div>
              <p className="text-xs font-medium text-hcm-muted">Audience</p>
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
                          ? "bg-hcm-accent text-white ring-hcm-accent"
                          : "bg-white text-hcm-muted ring-hcm-line hover:bg-hcm-canvas"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hcm-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-hcm-accent-strong disabled:opacity-60 sm:w-auto"
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
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-hcm-line bg-white p-12 text-sm text-hcm-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading announcements...
        </div>
      ) : announcements.length ? (
        <section className="space-y-3">
          {announcements.map((announcement) => (
            <article
              key={announcement._id}
              className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm transition hover:border-hcm-line-strong sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-hcm-ink">
                      {announcement.title}
                    </h2>
                    <span className="rounded-full bg-hcm-canvas-deep px-2.5 py-1 text-[11px] font-medium text-hcm-muted">
                      {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-hcm-muted">
                    {announcement.content}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(announcement.targetRoles || []).map((role) => (
                      <span
                        key={role}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${roleTone[role] || "bg-hcm-canvas-deep text-hcm-muted"}`}
                      >
                        {role === "employee" ? "Employees" : role}
                      </span>
                    ))}
                    <span className="text-xs text-hcm-muted">
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
        <div className="rounded-2xl border border-hcm-line bg-white p-12 text-center shadow-sm">
          <Megaphone className="mx-auto h-8 w-8 text-hcm-muted/40" />
          <p className="mt-2 text-sm font-medium text-hcm-ink">
            No announcements yet
          </p>
          <p className="mt-1 text-xs text-hcm-muted">
            Company updates will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
