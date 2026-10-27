import { useEffect, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import { PageHeader } from "../../components/ui";
import {
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Loader2,
  MapPin,
  Network,
  Palmtree,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "attendance", label: "Time & attendance", icon: Clock3 },
  { id: "organization", label: "Organization", icon: Network },
];

const emptySettings = {
  companyName: "",
  officeStartTime: "09:00",
  graceMinutes: 15,
  halfDayHours: 5,
  weekendDays: [0, 6],
  officeLat: "",
  officeLng: "",
  officeRadius: 150,
};

export default function Settings() {
  const { user } = useAuth();
  const canEdit = user?.role === "admin";
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState(emptySettings);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: "" });
  const [designationForm, setDesignationForm] = useState({
    title: "",
    department: "",
  });
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "" });
  const [leaveForm, setLeaveForm] = useState({
    name: "",
    quota: 12,
    isPaid: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingOrg, setSavingOrg] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      API.get("/settings"),
      API.get("/departments"),
      API.get("/designations"),
      API.get("/leave-types"),
      API.get("/holidays"),
    ])
      .then(([settingsRes, depsRes, desigRes, leaveRes, holidayRes]) => {
        if (!active) return;
        setSettings({ ...emptySettings, ...settingsRes.data });
        setDepartments(depsRes.data || []);
        setDesignations(desigRes.data || []);
        setLeaveTypes(leaveRes.data || []);
        setHolidays(holidayRes.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load settings",
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

  const reload = async (path) => {
    const response = await API.get(path);
    return response.data || [];
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await API.put("/settings", {
        ...settings,
        graceMinutes: Number(settings.graceMinutes),
        halfDayHours: Number(settings.halfDayHours),
        weekendDays: settings.weekendDays.map(Number),
        officeLat: settings.officeLat === "" ? null : Number(settings.officeLat),
        officeLng: settings.officeLng === "" ? null : Number(settings.officeLng),
        officeRadius: Number(settings.officeRadius),
      });
      setSettings({ ...emptySettings, ...response.data });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = async (event) => {
    event.preventDefault();
    setSavingOrg("department");
    try {
      await API.post("/departments", deptForm);
      setDeptForm({ name: "" });
      setDepartments(await reload("/departments"));
      toast.success("Department added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add department");
    } finally {
      setSavingOrg("");
    }
  };

  const addDesignation = async (event) => {
    event.preventDefault();
    setSavingOrg("designation");
    try {
      await API.post("/designations", {
        ...designationForm,
        department: designationForm.department || undefined,
      });
      setDesignationForm({ title: "", department: "" });
      setDesignations(await reload("/designations"));
      toast.success("Designation added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add designation");
    } finally {
      setSavingOrg("");
    }
  };

  const addLeaveType = async (event) => {
    event.preventDefault();
    setSavingOrg("leave");
    try {
      await API.post("/leave-types", {
        ...leaveForm,
        quota: Number(leaveForm.quota),
      });
      setLeaveForm({ name: "", quota: 12, isPaid: true });
      setLeaveTypes(await reload("/leave-types"));
      toast.success("Leave type added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add leave type");
    } finally {
      setSavingOrg("");
    }
  };

  const addHoliday = async (event) => {
    event.preventDefault();
    setSavingOrg("holiday");
    try {
      await API.post("/holidays", {
        ...holidayForm,
        date: new Date(`${holidayForm.date}T00:00:00.000Z`),
      });
      setHolidayForm({ name: "", date: "" });
      setHolidays(await reload("/holidays"));
      toast.success("Holiday added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add holiday");
    } finally {
      setSavingOrg("");
    }
  };

  const toggleWeekend = (dayIndex) => {
    setSettings((current) => {
      const selected = current.weekendDays.includes(dayIndex);
      return {
        ...current,
        weekendDays: selected
          ? current.weekendDays.filter((day) => day !== dayIndex)
          : [...current.weekendDays, dayIndex].sort((a, b) => a - b),
      };
    });
  };

  const hasGeofence =
    settings.officeLat !== "" &&
    settings.officeLat != null &&
    settings.officeLng !== "" &&
    settings.officeLng != null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-2xl bg-hcm-canvas-deep" />
        <div className="h-96 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace configuration"
        title={settings.companyName || "Company settings"}
        description={
          canEdit
            ? "Manage company profile, attendance rules and organization lists."
            : "Read-only view. Only an Admin can change company settings."
        }
        meta={
          <>
            <span className="hcm-chip-dark">
              <Building2 className="h-3.5 w-3.5" />
              {departments.length} departments
            </span>
            <span className="hcm-chip-dark">
              <Users className="h-3.5 w-3.5" />
              {designations.length} designations
            </span>
          </>
        }
        actions={
          !canEdit && (
            <span className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-hcm-line bg-hcm-surface px-4 text-xs font-semibold text-hcm-muted">
              <ShieldCheck className="h-4 w-4 text-hcm-lime" />
              HR read-only access
            </span>
          )
        }
      />

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-hcm-line bg-white p-1.5 shadow-sm">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === item.id
                ? "bg-hcm-accent text-white shadow-sm"
                : "text-hcm-muted hover:bg-hcm-canvas"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {tab !== "organization" ? (
        <form onSubmit={saveSettings} className="space-y-4">
          {tab === "general" && (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-600">
                  Company profile
                </p>
                <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                  Basic information
                </h2>
                <div className="mt-5 space-y-4">
                  <label className="block text-xs font-medium text-hcm-muted">
                    Company name
                    <div className="relative mt-1">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
                      <input
                        value={settings.companyName}
                        disabled={!canEdit}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            companyName: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10 disabled:opacity-70"
                        required
                      />
                    </div>
                  </label>
                  <label className="block text-xs font-medium text-hcm-muted">
                    Office start time
                    <div className="relative mt-1">
                      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
                      <input
                        type="time"
                        value={settings.officeStartTime}
                        disabled={!canEdit}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            officeStartTime: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white focus:ring-4 focus:ring-hcm-accent/10 disabled:opacity-70"
                      />
                    </div>
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-muted">
                      Overview
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                      Workspace summary
                    </h2>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hcm-canvas-deep text-hcm-muted">
                    <Settings2 className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Departments", value: departments.length },
                    { label: "Designations", value: designations.length },
                    { label: "Leave types", value: leaveTypes.length },
                    { label: "Holidays", value: holidays.length },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-hcm-surface-soft p-3"
                    >
                      <p className="text-[11px] text-hcm-muted">{item.label}</p>
                      <p className="mt-1 text-xl font-semibold text-hcm-ink">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === "attendance" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-accent">
                  Attendance rules
                </p>
                <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                  Hours & late policy
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-hcm-muted">
                    Grace minutes
                    <div className="relative mt-1">
                      <Timer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
                      <input
                        type="number"
                        min="0"
                        value={settings.graceMinutes}
                        disabled={!canEdit}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            graceMinutes: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white disabled:opacity-70"
                      />
                    </div>
                  </label>
                  <label className="block text-xs font-medium text-hcm-muted">
                    Half-day hours
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={settings.halfDayHours}
                      disabled={!canEdit}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          halfDayHours: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white disabled:opacity-70"
                    />
                  </label>
                </div>

                <p className="mt-5 text-xs font-medium text-hcm-muted">
                  Weekend days
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {weekdays.map((day, index) => {
                    const selected = (settings.weekendDays || []).includes(index);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleWeekend(index)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition disabled:cursor-not-allowed ${
                          selected
                            ? "bg-hcm-accent text-white ring-hcm-accent"
                            : "bg-white text-hcm-muted ring-hcm-line hover:bg-hcm-canvas"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-accent">
                      Camera attendance
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-hcm-ink">
                      Office geofence
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-hcm-muted">
                      Set office coordinates so camera check-ins can verify
                      employees are on site.
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hcm-accent-soft text-hcm-accent">
                    <MapPin className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-hcm-muted">
                    Latitude
                    <input
                      type="number"
                      step="any"
                      value={settings.officeLat ?? ""}
                      disabled={!canEdit}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          officeLat: event.target.value,
                        })
                      }
                      placeholder="24.8607"
                      className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white disabled:opacity-70"
                    />
                  </label>
                  <label className="block text-xs font-medium text-hcm-muted">
                    Longitude
                    <input
                      type="number"
                      step="any"
                      value={settings.officeLng ?? ""}
                      disabled={!canEdit}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          officeLng: event.target.value,
                        })
                      }
                      placeholder="67.0011"
                      className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white disabled:opacity-70"
                    />
                  </label>
                  <label className="col-span-2 block text-xs font-medium text-hcm-muted">
                    Allowed radius (meters)
                    <div className="relative mt-1">
                      <Compass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
                      <input
                        type="number"
                        min="1"
                        value={settings.officeRadius ?? 150}
                        disabled={!canEdit}
                        onChange={(event) =>
                          setSettings({
                            ...settings,
                            officeRadius: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white disabled:opacity-70"
                      />
                    </div>
                  </label>
                </div>

                <div
                  className={`mt-4 rounded-xl border p-3 text-xs leading-5 ${
                    hasGeofence
                      ? "border-hcm-accent/15 bg-hcm-accent-soft text-hcm-accent"
                      : "border-amber-100 bg-amber-50 text-amber-800"
                  }`}
                >
                  <p className="flex items-center gap-1.5 font-medium">
                    <Check className="h-3.5 w-3.5" />
                    {hasGeofence
                      ? "Geofence configured — camera check-in will validate location."
                      : "Camera check-in stays unavailable until both coordinates are set."}
                  </p>
                </div>
              </section>
            </div>
          )}

          {canEdit && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-hcm-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-hcm-accent-strong disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save changes
              </button>
            </div>
          )}
        </form>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-hcm-ink">
                  Departments
                </h2>
                <p className="text-sm text-hcm-muted">
                  {departments.length} configured
                </p>
              </div>
              <Network className="h-5 w-5 text-hcm-muted/40" />
            </div>
            {canEdit && (
              <form onSubmit={addDepartment} className="mt-4 flex gap-2">
                <input
                  value={deptForm.name}
                  onChange={(event) => setDeptForm({ name: event.target.value })}
                  placeholder="Department name"
                  required
                  className="min-w-0 flex-1 rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={savingOrg === "department"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingOrg === "department" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </button>
              </form>
            )}
            <ul className="mt-4 space-y-1.5">
              {departments.map((department) => (
                <li
                  key={department._id}
                  className="flex items-center gap-2 rounded-xl bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink"
                >
                  <Building2 className="h-3.5 w-3.5 text-hcm-muted" />
                  {department.name}
                </li>
              ))}
              {!departments.length && (
                <li className="py-4 text-center text-sm text-hcm-muted">
                  No departments yet
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-hcm-ink">
                  Designations
                </h2>
                <p className="text-sm text-hcm-muted">
                  {designations.length} configured
                </p>
              </div>
              <Users className="h-5 w-5 text-hcm-muted/40" />
            </div>
            {canEdit && (
              <form onSubmit={addDesignation} className="mt-4 space-y-2">
                <input
                  value={designationForm.title}
                  onChange={(event) =>
                    setDesignationForm({
                      ...designationForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="Job title"
                  required
                  className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                />
                <div className="flex gap-2">
                  <select
                    value={designationForm.department}
                    onChange={(event) =>
                      setDesignationForm({
                        ...designationForm,
                        department: event.target.value,
                      })
                    }
                    className="min-w-0 flex-1 rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  >
                    <option value="">No department</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={savingOrg === "designation"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {savingOrg === "designation" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add
                  </button>
                </div>
              </form>
            )}
            <ul className="mt-4 space-y-1.5">
              {designations.map((designation) => (
                <li
                  key={designation._id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink"
                >
                  <span>{designation.title}</span>
                  <span className="text-xs text-hcm-muted">
                    {designation.department?.name || "Unassigned"}
                  </span>
                </li>
              ))}
              {!designations.length && (
                <li className="py-4 text-center text-sm text-hcm-muted">
                  No designations yet
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-hcm-ink">
                  Leave types
                </h2>
                <p className="text-sm text-hcm-muted">
                  {leaveTypes.length} configured
                </p>
              </div>
              <Palmtree className="h-5 w-5 text-hcm-muted/40" />
            </div>
            {canEdit && (
              <form onSubmit={addLeaveType} className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={leaveForm.name}
                    onChange={(event) =>
                      setLeaveForm({ ...leaveForm, name: event.target.value })
                    }
                    placeholder="e.g. Annual leave"
                    required
                    className="min-w-0 flex-1 rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                  <input
                    type="number"
                    min="0"
                    value={leaveForm.quota}
                    onChange={(event) =>
                      setLeaveForm({ ...leaveForm, quota: event.target.value })
                    }
                    aria-label="Annual quota in days"
                    className="w-24 rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs text-hcm-muted">
                    <input
                      type="checkbox"
                      checked={leaveForm.isPaid}
                      onChange={(event) =>
                        setLeaveForm({
                          ...leaveForm,
                          isPaid: event.target.checked,
                        })
                      }
                      className="rounded border-hcm-line-strong"
                    />
                    Paid leave
                  </label>
                  <button
                    type="submit"
                    disabled={savingOrg === "leave"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {savingOrg === "leave" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add
                  </button>
                </div>
              </form>
            )}
            <ul className="mt-4 space-y-1.5">
              {leaveTypes.map((leaveType) => (
                <li
                  key={leaveType._id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink"
                >
                  <span>{leaveType.name}</span>
                  <span className="text-xs text-hcm-muted">
                    {leaveType.quota} days · {leaveType.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </li>
              ))}
              {!leaveTypes.length && (
                <li className="py-4 text-center text-sm text-hcm-muted">
                  No leave types yet
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-hcm-ink">
                  Public holidays
                </h2>
                <p className="text-sm text-hcm-muted">
                  {holidays.length} configured
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-hcm-muted/40" />
            </div>
            {canEdit && (
              <form onSubmit={addHoliday} className="mt-4 space-y-2">
                <input
                  value={holidayForm.name}
                  onChange={(event) =>
                    setHolidayForm({ ...holidayForm, name: event.target.value })
                  }
                  placeholder="Holiday name"
                  required
                  className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(event) =>
                      setHolidayForm({
                        ...holidayForm,
                        date: event.target.value,
                      })
                    }
                    required
                    className="min-w-0 flex-1 rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={savingOrg === "holiday"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-3.5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {savingOrg === "holiday" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Add
                  </button>
                </div>
              </form>
            )}
            <ul className="mt-4 space-y-1.5">
              {holidays.map((holiday) => (
                <li
                  key={holiday._id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink"
                >
                  <span>{holiday.name}</span>
                  <span className="text-xs text-hcm-muted">
                    {new Date(holiday.date).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
              {!holidays.length && (
                <li className="py-4 text-center text-sm text-hcm-muted">
                  No holidays yet
                </li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
