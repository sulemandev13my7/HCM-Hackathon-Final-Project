import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
import { Button, PageHeader } from "../../components/ui";
import {
  AlertTriangle,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarX,
  Check,
  CircleDollarSign,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileCheck,
  FileText,
  History,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  Upload,
  UploadCloud,
  UserPlus,
  UserRoundCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  department: "",
  designation: "",
  joinDate: "",
  terminationDate: "",
  employmentType: "full-time",
  status: "active",
  basicSalary: "",
};

const statusTone = {
  active: "bg-hcm-accent-soft text-hcm-accent ring-hcm-accent/20",
  probation: "bg-amber-50 text-amber-700 ring-amber-600/20",
  terminated: "bg-rose-50 text-rose-700 ring-rose-600/20",
  resigned: "bg-hcm-canvas-deep text-hcm-muted ring-hcm-muted/20",
};

const attendanceTone = {
  present: "bg-hcm-accent-soft text-hcm-accent",
  late: "bg-amber-50 text-amber-700",
  absent: "bg-rose-50 text-rose-700",
  "half-day": "bg-orange-50 text-orange-700",
  leave: "bg-hcm-accent-soft text-hcm-accent",
};

const formatCurrency = (value) =>
  `Rs ${Number(value || 0).toLocaleString()}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

export default function Employees() {
  const { user } = useAuth();
  const canManageEmployees = user?.role === "hr";

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [importBusy, setImportBusy] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [employee360, setEmployee360] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [salaryForm, setSalaryForm] = useState({
    basic: "",
    effectiveDate: "",
  });
  const [showSalaryEditor, setShowSalaryEditor] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      API.get("/employees"),
      API.get("/departments"),
      API.get("/designations"),
    ])
      .then(([employeesRes, departmentsRes, designationsRes]) => {
        if (!active) return;
        setEmployees(employeesRes.data.employees || []);
        setDepartments(departmentsRes.data || []);
        setDesignations(designationsRes.data || []);
      })
      .catch((error) => {
        if (active) {
          toast.error(
            error.response?.data?.message || "Failed to load employees",
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

  const refreshEmployees = async () => {
    const response = await API.get("/employees");
    setEmployees(response.data.employees || []);
  };

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((employee) => employee.status === "active")
        .length,
      probation: employees.filter((employee) => employee.status === "probation")
        .length,
      departments: new Set(
        employees
          .map((employee) => employee.department?._id)
          .filter(Boolean),
      ).size,
    }),
    [employees],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      if (statusFilter !== "all" && employee.status !== statusFilter)
        return false;
      if (
        departmentFilter !== "all" &&
        employee.department?._id !== departmentFilter
      )
        return false;
      if (!query) return true;
      return [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.employeeId,
        employee.phone,
        employee.designation?.title,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [employees, search, statusFilter, departmentFilter]);

  const filtersActive =
    search !== "" || statusFilter !== "all" || departmentFilter !== "all";

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingEmployeeId(null);
    setFormOpen(false);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setEditingEmployeeId(null);
    setFormOpen(true);
  };

  const openEdit = (employee) => {
    setFormData({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      department: employee.department?._id || "",
      designation: employee.designation?._id || "",
      joinDate: toDateInput(employee.joinDate),
      terminationDate: toDateInput(employee.terminationDate),
      employmentType: employee.employmentType || "full-time",
      status: employee.status || "active",
      basicSalary: "",
    });
    setEditingEmployeeId(employee._id);
    setProfileOpen(false);
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingEmployeeId) {
        await API.put(`/employees/${editingEmployeeId}`, {
          ...formData,
          basicSalary: undefined,
          terminationDate: formData.terminationDate || null,
        });
        toast.success("Employee updated");
      } else {
        const response = await API.post("/employees", formData);
        setTempPassword(response.data.tempPassword);
        setCopied(false);
        toast.success("Employee created and login generated");
      }
      resetForm();
      await refreshEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Temporary password copied");
    } catch {
      toast.error("Could not copy password");
    }
  };

  const openEmployee360 = async (employeeId) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setEmployee360(null);
    setShowSalaryEditor(false);
    try {
      const response = await API.get(`/employees/${employeeId}/360`);
      setEmployee360(response.data);
      setSalaryForm({
        basic: response.data.salary?.basic || "",
        effectiveDate: "",
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load employee profile",
      );
      setProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const saveSalary = async (event) => {
    event.preventDefault();
    setSavingSalary(true);
    try {
      await API.put(
        `/employees/${employee360.employee._id}/salary`,
        salaryForm,
      );
      toast.success("Salary structure updated");
      await openEmployee360(employee360.employee._id);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update salary",
      );
    } finally {
      setSavingSalary(false);
    }
  };

  const exportCsv = async () => {
    try {
      const response = await API.get("/employees/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "text/csv" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.csv";
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || "CSV export failed");
    }
  };

  const downloadTemplate = () => {
    const template =
      "firstName,lastName,email,phone,department,designation,joinDate,basicSalary\n";
    const url = window.URL.createObjectURL(
      new Blob([template], { type: "text/csv" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-import-template.csv";
    link.click();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const runDryRun = async () => {
    if (!importFile) {
      toast.error("Select a CSV file first");
      return;
    }
    setImportBusy("dry");
    try {
      const payload = new FormData();
      payload.append("file", importFile);
      const response = await API.post("/employees/import/dry-run", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDryRunResult(response.data);
      toast.success("Validation complete");
    } catch (error) {
      toast.error(error.response?.data?.message || "Dry run failed");
    } finally {
      setImportBusy("");
    }
  };

  const commitImport = async () => {
    setImportBusy("commit");
    try {
      const payload = new FormData();
      payload.append("file", importFile);
      const response = await API.post("/employees/import/commit", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data.message || "Employees imported");
      setShowImport(false);
      setDryRunResult(null);
      setImportFile(null);
      await refreshEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setImportBusy("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People directory"
        title="Employees"
        description={
          canManageEmployees
            ? "Register employees, manage records, salary structures and bulk imports."
            : "Browse the employee directory and open a complete employee profile."
        }
        meta={
          <>
            <span className="hcm-chip-dark">
              <Users className="h-3.5 w-3.5" />
              {employees.length} people
            </span>
            <span className="hcm-chip-dark">
              <Building2 className="h-3.5 w-3.5" />
              {departments.length} departments
            </span>
          </>
        }
        actions={
          canManageEmployees && (
            <>
              <Button variant="inverse-ghost" onClick={exportCsv}>
                <Download className="h-4 w-4" /> Export
              </Button>
              <Button
                variant="inverse-ghost"
                onClick={() => setShowImport((value) => !value)}
              >
                <Upload className="h-4 w-4" /> Import
              </Button>
              <Button variant="inverse" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add employee
              </Button>
            </>
          )
        }
      />

      {tempPassword && (
        <div className="flex flex-col gap-3 rounded-2xl border border-hcm-accent/20 bg-hcm-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-hcm-accent-strong">
              <BadgeCheck className="h-4 w-4" /> Employee login created
            </p>
            <p className="mt-1 text-xs leading-5 text-hcm-accent">
              Share this temporary password securely. The employee must change
              it on first sign-in.
            </p>
            <code className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-semibold text-hcm-accent-strong">
              {tempPassword}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex items-center gap-1.5 rounded-xl border border-hcm-accent/20 bg-white px-3 py-2 text-xs font-medium text-hcm-accent hover:bg-hcm-accent-soft"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => setTempPassword("")}
              className="rounded-xl p-2 text-hcm-accent hover:bg-hcm-accent-soft"
              aria-label="Dismiss temporary password"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total employees", value: stats.total, icon: Users },
          { label: "Active", value: stats.active, icon: UserRoundCheck },
          { label: "On probation", value: stats.probation, icon: CalendarDays },
          { label: "Departments", value: stats.departments, icon: Building2 },
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

      {canManageEmployees && showImport && (
        <section className="rounded-2xl border border-hcm-line bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hcm-accent-soft text-hcm-accent">
                <UploadCloud className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-hcm-ink">
                  Bulk CSV import
                </h2>
                <p className="mt-0.5 text-sm text-hcm-muted">
                  Validate first with a dry run. Nothing is saved until you
                  commit.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-hcm-accent hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> Download template
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-hcm-line-strong bg-hcm-surface-soft p-4">
            <input
              type="file"
              accept=".csv"
              onChange={(event) => {
                setImportFile(event.target.files?.[0] || null);
                setDryRunResult(null);
              }}
              className="block w-full text-sm text-hcm-muted file:mr-3 file:rounded-lg file:border-0 file:bg-hcm-accent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-hcm-accent-strong"
            />
            <p className="mt-2 text-[11px] leading-5 text-hcm-muted">
              Expected headers: firstName, lastName, email, phone, department,
              designation, joinDate, basicSalary
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runDryRun}
              disabled={importBusy !== ""}
              className="inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {importBusy === "dry" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4" />
              )}
              Run dry run
            </button>
            {dryRunResult?.validRows > 0 && (
              <button
                type="button"
                onClick={commitImport}
                disabled={importBusy !== ""}
                className="inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {importBusy === "commit" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Import {dryRunResult.validRows} valid rows
              </button>
            )}
          </div>

          {dryRunResult && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full bg-hcm-canvas-deep px-3 py-1.5 text-hcm-ink">
                  {dryRunResult.totalRows} rows
                </span>
                <span className="rounded-full bg-hcm-accent-soft px-3 py-1.5 text-hcm-accent">
                  {dryRunResult.validRows} valid
                </span>
                <span className="rounded-full bg-rose-50 px-3 py-1.5 text-rose-700">
                  {dryRunResult.errors?.length || 0} errors
                </span>
              </div>
              {dryRunResult.errors?.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5" /> Fix these rows
                    before importing
                  </p>
                  <ul className="mt-2 space-y-1">
                    {dryRunResult.errors.map((error, index) => (
                      <li
                        key={`${error.row}-${error.field}-${index}`}
                        className="text-xs text-rose-700"
                      >
                        Row {error.row} · {error.field}: {error.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-hcm-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-hcm-line/80 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, ID or phone"
              className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white"
            >
              <option value="all">All departments</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm capitalize text-hcm-ink outline-none focus:border-hcm-accent/50 focus:bg-white"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="terminated">Terminated</option>
              <option value="resigned">Resigned</option>
            </select>
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setDepartmentFilter("all");
                }}
                className="rounded-xl px-3 py-2.5 text-xs font-medium text-hcm-muted hover:bg-hcm-canvas"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-hcm-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading employees...
          </div>
        ) : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-hcm-surface-soft text-left text-[11px] uppercase tracking-wide text-hcm-muted">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hcm-line">
                  {filtered.map((employee) => (
                    <tr key={employee._id} className="hover:bg-hcm-surface-soft">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hcm-accent text-xs font-semibold text-white">
                            {employee.firstName?.[0]}
                            {employee.lastName?.[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-hcm-ink">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="truncate text-xs text-hcm-muted">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-hcm-muted">
                        {employee.employeeId}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-hcm-ink">
                          {employee.designation?.title || "—"}
                        </p>
                        <p className="text-xs text-hcm-muted">
                          {employee.department?.name || "Unassigned"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-hcm-muted">
                        {employee.phone || "No phone"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-hcm-muted">
                        {formatDate(employee.joinDate)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${statusTone[employee.status] || statusTone.resigned}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEmployee360(employee._id)}
                            className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas hover:text-hcm-ink"
                            title={`View ${employee.firstName}`}
                            aria-label={`View ${employee.firstName} ${employee.lastName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageEmployees && (
                            <button
                              type="button"
                              onClick={() => openEdit(employee)}
                              className="rounded-lg p-2 text-hcm-accent hover:bg-hcm-accent-soft"
                              title={`Edit ${employee.firstName}`}
                              aria-label={`Edit ${employee.firstName} ${employee.lastName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-hcm-line lg:hidden">
              {filtered.map((employee) => (
                <div key={employee._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hcm-accent text-xs font-semibold text-white">
                      {employee.firstName?.[0]}
                      {employee.lastName?.[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-hcm-ink">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="truncate text-xs text-hcm-muted">
                            {employee.employeeId} ·{" "}
                            {employee.designation?.title || "No designation"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusTone[employee.status] || statusTone.resigned}`}
                        >
                          {employee.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-hcm-muted">
                        {employee.department?.name || "Unassigned"} ·{" "}
                        {employee.email}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEmployee360(employee._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-hcm-line px-3 py-1.5 text-xs font-medium text-hcm-ink"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {canManageEmployees && (
                          <button
                            type="button"
                            onClick={() => openEdit(employee)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-hcm-line px-3 py-1.5 text-xs font-medium text-hcm-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-hcm-muted/40" />
            <p className="mt-2 text-sm font-medium text-hcm-ink">
              {filtersActive
                ? "No employees match these filters"
                : "No employees yet"}
            </p>
            <p className="mt-1 text-xs text-hcm-muted">
              {filtersActive
                ? "Try clearing the search or filters."
                : "Register your first employee to get started."}
            </p>
            {canManageEmployees && !filtersActive && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-hcm-accent px-4 py-2.5 text-sm font-medium text-white"
              >
                <UserPlus className="h-4 w-4" /> Add employee
              </button>
            )}
          </div>
        )}
      </section>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-hcm-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-form-title"
        >
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-hcm-surface shadow-hcm sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-hcm-line/80 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                  {editingEmployeeId ? "Update record" : "New hire"}
                </p>
                <h2
                  id="employee-form-title"
                  className="mt-1 text-xl font-semibold text-hcm-ink"
                >
                  {editingEmployeeId ? "Edit employee" : "Register employee"}
                </h2>
                <p className="mt-1 text-sm text-hcm-muted">
                  {editingEmployeeId
                    ? "Changes are recorded in the audit trail."
                    : "A login is generated automatically with a temporary password."}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas"
                aria-label="Close employee form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-hcm-muted">
                Personal information
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-hcm-muted">
                  First name
                  <input
                    value={formData.firstName}
                    onChange={(event) =>
                      setFormData({ ...formData, firstName: event.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-hcm-muted">
                  Last name
                  <input
                    value={formData.lastName}
                    onChange={(event) =>
                      setFormData({ ...formData, lastName: event.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-hcm-muted">
                  Email
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData({ ...formData, email: event.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-hcm-muted">
                  Phone
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData({ ...formData, phone: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-hcm-muted sm:col-span-2">
                  Address
                  <input
                    value={formData.address}
                    onChange={(event) =>
                      setFormData({ ...formData, address: event.target.value })
                    }
                    placeholder="Optional"
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </label>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-hcm-muted">
                Employment
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-hcm-muted">
                  Department
                  <select
                    value={formData.department}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        department: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-hcm-muted">
                  Designation
                  <select
                    value={formData.designation}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        designation: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {designations.map((designation) => (
                      <option key={designation._id} value={designation._id}>
                        {designation.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-hcm-muted">
                  Joining date
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        joinDate: event.target.value,
                      })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-hcm-muted">
                  Employment type
                  <select
                    value={formData.employmentType}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        employmentType: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </label>
                {editingEmployeeId ? (
                  <>
                    <label className="block text-xs font-medium text-hcm-muted">
                      Status
                      <select
                        value={formData.status}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            status: event.target.value,
                            terminationDate:
                              event.target.value === "active" ||
                              event.target.value === "probation"
                                ? ""
                                : formData.terminationDate,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="probation">Probation</option>
                        <option value="terminated">Terminated</option>
                        <option value="resigned">Resigned</option>
                      </select>
                    </label>
                    {(formData.status === "terminated" ||
                      formData.status === "resigned") && (
                      <label className="block text-xs font-medium text-hcm-muted">
                        Termination date
                        <input
                          type="date"
                          value={formData.terminationDate}
                          onChange={(event) =>
                            setFormData({
                              ...formData,
                              terminationDate: event.target.value,
                            })
                          }
                          required
                          className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                        />
                      </label>
                    )}
                  </>
                ) : (
                  <label className="block text-xs font-medium text-hcm-muted">
                    Basic salary (Rs)
                    <div className="relative mt-1">
                      <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-hcm-muted" />
                      <input
                        type="number"
                        min="1"
                        value={formData.basicSalary}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            basicSalary: event.target.value,
                          })
                        }
                        required
                        className="w-full rounded-xl border border-hcm-line bg-hcm-surface-soft py-2.5 pl-9 pr-3 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                      />
                    </div>
                  </label>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-hcm-line px-4 py-2.5 text-sm font-medium text-hcm-ink hover:bg-hcm-canvas"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-hcm-accent px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editingEmployeeId ? "Save changes" : "Create employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-hcm-ink/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-360-title"
        >
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-hcm-surface shadow-hcm sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-hcm-line/80 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hcm-muted">
                  Employee 360
                </p>
                <h2
                  id="employee-360-title"
                  className="mt-1 text-xl font-semibold text-hcm-ink"
                >
                  {employee360
                    ? `${employee360.employee.firstName} ${employee360.employee.lastName}`
                    : "Loading employee..."}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg p-2 text-hcm-muted hover:bg-hcm-canvas"
                aria-label="Close employee profile"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileLoading || !employee360 ? (
              <div className="flex flex-1 items-center justify-center gap-2 p-16 text-sm text-hcm-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-hcm-line/80 bg-hcm-surface-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-hcm-ink text-lg font-bold text-white">
                      {employee360.employee.firstName?.[0]}
                      {employee360.employee.lastName?.[0]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-hcm-ink">
                        {employee360.employee.employeeId}
                      </p>
                      <p className="text-xs text-hcm-muted">
                        {employee360.employee.designation?.title || "—"} ·{" "}
                        {employee360.employee.department?.name || "—"}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusTone[employee360.employee.status] || statusTone.resigned}`}
                      >
                        {employee360.employee.status}
                      </span>
                    </div>
                  </div>
                  {canManageEmployees && (
                    <button
                      type="button"
                      onClick={() => openEdit(employee360.employee)}
                      className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-hcm-line bg-white px-3.5 py-2 text-sm font-medium text-hcm-ink hover:bg-hcm-canvas"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit employee
                    </button>
                  )}
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Joined",
                        value: formatDate(employee360.employee.joinDate),
                        icon: CalendarDays,
                      },
                      {
                        label: "Employment",
                        value: employee360.employee.employmentType || "—",
                        icon: Briefcase,
                      },
                      {
                        label: "Login",
                        value: employee360.user?.isActive
                          ? "Active"
                          : "Inactive",
                        icon: UserRoundCheck,
                      },
                      {
                        label: "Phone",
                        value: employee360.employee.phone || "—",
                        icon: Phone,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-hcm-line/80 bg-hcm-surface-soft p-3"
                      >
                        <p className="flex items-center gap-1 text-[11px] text-hcm-muted">
                          <item.icon className="h-3 w-3" /> {item.label}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium capitalize text-hcm-ink">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-hcm-line p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-hcm-ink">
                          <Wallet className="h-4 w-4 text-hcm-muted" /> Current
                          salary
                        </h3>
                        {canManageEmployees && !showSalaryEditor && (
                          <button
                            type="button"
                            onClick={() => setShowSalaryEditor(true)}
                            className="text-xs font-medium text-hcm-accent hover:underline"
                          >
                            Update
                          </button>
                        )}
                      </div>

                      {showSalaryEditor ? (
                        <form onSubmit={saveSalary} className="mt-3 space-y-3">
                          <label className="block text-xs font-medium text-hcm-muted">
                            Basic salary
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              required
                              value={salaryForm.basic}
                              onChange={(event) =>
                                setSalaryForm({
                                  ...salaryForm,
                                  basic: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                            />
                          </label>
                          <label className="block text-xs font-medium text-hcm-muted">
                            Effective date
                            <input
                              type="date"
                              value={salaryForm.effectiveDate}
                              onChange={(event) =>
                                setSalaryForm({
                                  ...salaryForm,
                                  effectiveDate: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded-xl border border-hcm-line bg-hcm-surface-soft px-3 py-2.5 text-sm outline-none focus:border-hcm-accent/50 focus:bg-white"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingSalary}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-hcm-accent px-3 py-2.5 text-xs font-medium text-white disabled:opacity-60"
                            >
                              {savingSalary ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}
                              Save salary
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSalaryEditor(false);
                                setSalaryForm({
                                  basic: employee360.salary?.basic || "",
                                  effectiveDate: "",
                                });
                              }}
                              className="rounded-xl border border-hcm-line px-3 py-2.5 text-xs font-medium text-hcm-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : employee360.salary ? (
                        <div className="mt-3 space-y-1.5">
                          {[
                            ["Basic", employee360.salary.basic],
                            ["HRA", employee360.salary.hra],
                            ["Medical", employee360.salary.medicalAllowance],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between text-xs text-hcm-muted"
                            >
                              <span>{label}</span>
                              <span>{formatCurrency(value)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-hcm-line/80 pt-2 text-sm font-semibold text-hcm-ink">
                            <span>Gross</span>
                            <span>
                              {formatCurrency(employee360.salary.gross)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl bg-hcm-surface-soft p-3 text-xs text-hcm-muted">
                          No active salary structure.
                        </div>
                      )}

                      <h4 className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hcm-muted">
                        <History className="h-3.5 w-3.5" /> Salary history
                      </h4>
                      <ul className="mt-2 space-y-1">
                        {employee360.salaryHistory.slice(0, 4).map((salary) => (
                          <li
                            key={salary._id}
                            className="flex justify-between gap-2 rounded-lg bg-hcm-surface-soft px-2.5 py-2 text-xs"
                          >
                            <span className="text-hcm-muted">
                              {formatDate(salary.effectiveDate)}
                            </span>
                            <span className="font-medium text-hcm-ink">
                              {formatCurrency(salary.gross)}
                              {salary.isActive ? " · Current" : ""}
                            </span>
                          </li>
                        ))}
                        {!employee360.salaryHistory.length && (
                          <li className="py-2 text-xs text-hcm-muted">
                            No salary history
                          </li>
                        )}
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-hcm-line p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-hcm-ink">
                        <ClipboardList className="h-4 w-4 text-hcm-muted" />{" "}
                        Contact details
                      </h3>
                      <div className="mt-3 space-y-2">
                        {[
                          {
                            icon: Mail,
                            value: employee360.employee.email,
                          },
                          {
                            icon: Phone,
                            value:
                              employee360.employee.phone || "No phone number",
                          },
                          {
                            icon: MapPin,
                            value:
                              employee360.employee.address || "No address",
                          },
                          {
                            icon: CalendarX,
                            value: employee360.employee.terminationDate
                              ? `Leaves ${formatDate(employee360.employee.terminationDate)}`
                              : "Currently employed",
                          },
                        ].map((item, index) => (
                          <p
                            key={index}
                            className="flex items-start gap-2 rounded-lg bg-hcm-surface-soft px-2.5 py-2 text-xs text-hcm-muted"
                          >
                            <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-hcm-muted" />
                            <span className="break-words">{item.value}</span>
                          </p>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-hcm-line p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-hcm-ink">
                        <CalendarDays className="h-4 w-4 text-hcm-muted" />{" "}
                        Recent attendance
                      </h3>
                      <ul className="mt-3 space-y-1.5">
                        {employee360.attendance.map((record) => (
                          <li
                            key={record._id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-hcm-surface-soft px-2.5 py-2 text-xs"
                          >
                            <span className="text-hcm-muted">
                              {formatDate(record.date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-hcm-muted">
                                {record.hoursWorked || 0} hrs
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${attendanceTone[record.status] || "bg-hcm-canvas-deep text-hcm-muted"}`}
                              >
                                {record.status}
                              </span>
                            </span>
                          </li>
                        ))}
                        {!employee360.attendance.length && (
                          <li className="py-3 text-xs text-hcm-muted">
                            No attendance records
                          </li>
                        )}
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-hcm-line p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-hcm-ink">
                        <History className="h-4 w-4 text-hcm-muted" /> Recent
                        leave
                      </h3>
                      <ul className="mt-3 space-y-1.5">
                        {employee360.leaveRequests.map((leave) => (
                          <li
                            key={leave._id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-hcm-surface-soft px-2.5 py-2 text-xs"
                          >
                            <span className="text-hcm-muted">
                              {leave.leaveType?.name || "Leave"} ·{" "}
                              {formatDate(leave.startDate)}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-hcm-muted ring-1 ring-inset ring-hcm-line">
                              {leave.status}
                            </span>
                          </li>
                        ))}
                        {!employee360.leaveRequests.length && (
                          <li className="py-3 text-xs text-hcm-muted">
                            No leave requests
                          </li>
                        )}
                      </ul>
                    </section>
                  </div>

                  <p className="flex items-center gap-1.5 text-[11px] text-hcm-muted">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Employee profile, salary and activity snapshots are visible
                    to Admin and HR only.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
