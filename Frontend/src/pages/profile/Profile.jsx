import { useEffect, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { PageHeader } from "../../components/ui";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString([], {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const titleCase = (value) =>
  (value || "—").replaceAll("-", " ").replace(/\b\w/g, (char) =>
    char.toUpperCase(),
  );

export default function Profile() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ phone: "", address: "" });

  useEffect(() => {
    let active = true;
    API.get("/employees/me")
      .then((response) => {
        if (!active) return;
        setEmployee(response.data);
        setFormData({
          phone: response.data.phone || "",
          address: response.data.address || "",
        });
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load your profile",
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await API.put("/employees/me/update", formData);
      setEmployee(response.data);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-44 hcm-skeleton rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="h-80 hcm-skeleton rounded-2xl" />
          <div className="h-80 hcm-skeleton rounded-2xl" />
          <div className="h-80 hcm-skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Your employee profile could not be loaded. Contact HR if this continues.
      </div>
    );
  }

  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employee profile"
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.employeeId} · ${employee.designation?.title || "No designation"} · ${employee.department?.name || "No department"}`}
        leading={
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-hcm-lime text-xl font-bold text-hcm-ink shadow-lg">
            {initials}
          </span>
        }
        actions={
          <span className="hcm-chip-dark h-10 gap-2 px-4 text-xs font-semibold capitalize">
            <CheckCircle2 className="h-4 w-4 text-hcm-accent-strong" />
            {titleCase(employee.status)}
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-muted">
                Employment
              </p>
              <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                Your details
              </h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hcm-accent-soft text-hcm-accent">
              <BadgeCheck className="h-5 w-5" />
            </span>
          </div>

          <dl className="mt-5 space-y-2">
            {[
              {
                label: "Email",
                value: employee.email,
                icon: Mail,
              },
              {
                label: "Phone",
                value: employee.phone || "Not provided",
                icon: Phone,
              },
              {
                label: "Address",
                value: employee.address || "Not provided",
                icon: MapPin,
              },
              {
                label: "Department",
                value: employee.department?.name || "—",
                icon: UserRound,
              },
              {
                label: "Designation",
                value: employee.designation?.title || "—",
                icon: Briefcase,
              },
              {
                label: "Employment type",
                value: titleCase(employee.employmentType),
                icon: Clock3,
              },
              {
                label: "Joining date",
                value: formatDate(employee.joinDate),
                icon: CalendarDays,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-start gap-3 rounded-xl bg-hcm-surface-soft px-3.5 py-3"
              >
                <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-hcm-muted" />
                <div className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-hcm-muted">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 break-words text-sm text-hcm-ink">
                    {row.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-hcm-muted">
            <ShieldCheck className="h-3.5 w-3.5" />
            Employment details are managed by HR.
          </p>
        </section>

        <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-accent">
              Contact information
            </p>
            <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
              Update your contact details
            </h2>
            <p className="mt-1 text-sm leading-6 text-hcm-muted">
              Keep your phone and address current so HR can reach you when it
              matters.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-xs font-medium text-hcm-muted">
              Phone number
              <div className="relative mt-1">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData({ ...formData, phone: event.target.value })
                  }
                  placeholder="+92 300 0000000"
                  className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none transition focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10"
                />
              </div>
            </label>
            <label className="block text-xs font-medium text-hcm-muted">
              Home address
              <textarea
                rows={4}
                value={formData.address}
                onChange={(event) =>
                  setFormData({ ...formData, address: event.target.value })
                }
                placeholder="House, street, city"
                className="mt-1 w-full resize-none rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none transition focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-hcm-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-hcm-accent-strong disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save changes
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-hcm-line/80 bg-hcm-surface-soft p-3 text-xs leading-5 text-hcm-muted">
            Changing your email or job title? HR manages those through the
            employee directory.
          </div>
        </section>
      </div>
    </div>
  );
}
