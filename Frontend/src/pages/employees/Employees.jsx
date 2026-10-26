import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/useAuth";
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
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  probation: "bg-amber-50 text-amber-700 ring-amber-600/20",
  terminated: "bg-rose-50 text-rose-700 ring-rose-600/20",
  resigned: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const attendanceTone = {
  present: "bg-emerald-50 text-emerald-700",
  late: "bg-amber-50 text-amber-700",
  absent: "bg-rose-50 text-rose-700",
  "half-day": "bg-orange-50 text-orange-700",
  leave: "bg-blue-50 text-blue-700",
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
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              People directory
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Employees
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {canManageEmployees
                ? "Register employees, manage records, salary structures and bulk imports."
                : "Browse the employee directory and open a complete employee profile."}
            </p>
          </div>
          {canManageEmployees && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              >
                <Download className="h-4 w-4" /> Export
              </button>
              <button
                type="button"
                onClick={() => setShowImport((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              >
                <Upload className="h-4 w-4" /> Import
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" /> Add employee
              </button>
            </div>
          )}
        </div>
      </header>

      {tempPassword && (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
              <BadgeCheck className="h-4 w-4" /> Employee login created
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Share this temporary password securely. The employee must change
              it on first sign-in.
            </p>
            <code className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-semibold text-emerald-900">
              {tempPassword}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
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
              className="rounded-xl p-2 text-emerald-700 hover:bg-emerald-100"
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

      {canManageEmployees && showImport && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <UploadCloud className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Bulk CSV import
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Validate first with a dry run. Nothing is saved until you
                  commit.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-violet-700 hover:underline"
            >
              <FileText className="h-3.5 w-3.5" /> Download template
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <input
              type="file"
              accept=".csv"
              onChange={(event) => {
                setImportFile(event.target.files?.[0] || null);
                setDryRunResult(null);
              }}
              className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
            />
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              Expected headers: firstName, lastName, email, phone, department,
              designation, joinDate, basicSalary
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runDryRun}
              disabled={importBusy !== ""}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
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
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                  {dryRunResult.totalRows} rows
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
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

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, ID or phone"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
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
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm capitalize text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
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
                className="rounded-xl px-3 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading employees...
          </div>
        ) : filtered.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-400">
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
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((employee) => (
                    <tr key={employee._id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                            {employee.firstName?.[0]}
                            {employee.lastName?.[0]}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">
                        {employee.employeeId}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-700">
                          {employee.designation?.title || "—"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {employee.department?.name || "Unassigned"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {employee.phone || "No phone"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
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
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title={`View ${employee.firstName}`}
                            aria-label={`View ${employee.firstName} ${employee.lastName}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageEmployees && (
                            <button
                              type="button"
                              onClick={() => openEdit(employee)}
                              className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
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

            <div className="divide-y divide-slate-100 lg:hidden">
              {filtered.map((employee) => (
                <div key={employee._id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                      {employee.firstName?.[0]}
                      {employee.lastName?.[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="truncate text-xs text-slate-400">
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
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {employee.department?.name || "Unassigned"} ·{" "}
                        {employee.email}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEmployee360(employee._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {canManageEmployees && (
                          <button
                            type="button"
                            onClick={() => openEdit(employee)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-700"
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
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              {filtersActive
                ? "No employees match these filters"
                : "No employees yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {filtersActive
                ? "Try clearing the search or filters."
                : "Register your first employee to get started."}
            </p>
            {canManageEmployees && !filtersActive && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                <UserPlus className="h-4 w-4" /> Add employee
              </button>
            )}
          </div>
        )}
      </section>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-form-title"
        >
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                  {editingEmployeeId ? "Update record" : "New hire"}
                </p>
                <h2
                  id="employee-form-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {editingEmployeeId ? "Edit employee" : "Register employee"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingEmployeeId
                    ? "Changes are recorded in the audit trail."
                    : "A login is generated automatically with a temporary password."}
                </p>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close employee form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Personal information
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-500">
                  First name
                  <input
                    value={formData.firstName}
                    onChange={(event) =>
                      setFormData({ ...formData, firstName: event.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Last name
                  <input
                    value={formData.lastName}
                    onChange={(event) =>
                      setFormData({ ...formData, lastName: event.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Email
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData({ ...formData, email: event.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Phone
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData({ ...formData, phone: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500 sm:col-span-2">
                  Address
                  <input
                    value={formData.address}
                    onChange={(event) =>
                      setFormData({ ...formData, address: event.target.value })
                    }
                    placeholder="Optional"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Employment
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-500">
                  Department
                  <select
                    value={formData.department}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        department: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((department) => (
                      <option key={department._id} value={department._id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Designation
                  <select
                    value={formData.designation}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        designation: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {designations.map((designation) => (
                      <option key={designation._id} value={designation._id}>
                        {designation.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium text-slate-500">
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
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-500">
                  Employment type
                  <select
                    value={formData.employmentType}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        employmentType: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </label>
                {editingEmployeeId ? (
                  <>
                    <label className="block text-xs font-medium text-slate-500">
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
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="probation">Probation</option>
                        <option value="terminated">Terminated</option>
                        <option value="resigned">Resigned</option>
                      </select>
                    </label>
                    {(formData.status === "terminated" ||
                      formData.status === "resigned") && (
                      <label className="block text-xs font-medium text-slate-500">
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
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                        />
                      </label>
                    )}
                  </>
                ) : (
                  <label className="block text-xs font-medium text-slate-500">
                    Basic salary (Rs)
                    <div className="relative mt-1">
                      <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                      />
                    </div>
                  </label>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-360-title"
        >
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Employee 360
                </p>
                <h2
                  id="employee-360-title"
                  className="mt-1 text-xl font-semibold text-slate-900"
                >
                  {employee360
                    ? `${employee360.employee.firstName} ${employee360.employee.lastName}`
                    : "Loading employee..."}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Close employee profile"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileLoading || !employee360 ? (
              <div className="flex flex-1 items-center justify-center gap-2 p-16 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 text-lg font-bold text-slate-950 shadow">
                      {employee360.employee.firstName?.[0]}
                      {employee360.employee.lastName?.[0]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {employee360.employee.employeeId}
                      </p>
                      <p className="text-xs text-slate-500">
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
                      className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="flex items-center gap-1 text-[11px] text-slate-400">
                          <item.icon className="h-3 w-3" /> {item.label}
                        </p>
                        <p className="mt-1 truncate text-sm font-medium capitalize text-slate-800">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200/80 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                          <Wallet className="h-4 w-4 text-slate-400" /> Current
                          salary
                        </h3>
                        {canManageEmployees && !showSalaryEditor && (
                          <button
                            type="button"
                            onClick={() => setShowSalaryEditor(true)}
                            className="text-xs font-medium text-blue-700 hover:underline"
                          >
                            Update
                          </button>
                        )}
                      </div>

                      {showSalaryEditor ? (
                        <form onSubmit={saveSalary} className="mt-3 space-y-3">
                          <label className="block text-xs font-medium text-slate-500">
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
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                            />
                          </label>
                          <label className="block text-xs font-medium text-slate-500">
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
                              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingSalary}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-medium text-white disabled:opacity-60"
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
                              className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-600"
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
                              className="flex justify-between text-xs text-slate-500"
                            >
                              <span>{label}</span>
                              <span>{formatCurrency(value)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold text-slate-900">
                            <span>Gross</span>
                            <span>
                              {formatCurrency(employee360.salary.gross)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                          No active salary structure.
                        </div>
                      )}

                      <h4 className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        <History className="h-3.5 w-3.5" /> Salary history
                      </h4>
                      <ul className="mt-2 space-y-1">
                        {employee360.salaryHistory.slice(0, 4).map((salary) => (
                          <li
                            key={salary._id}
                            className="flex justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs"
                          >
                            <span className="text-slate-500">
                              {formatDate(salary.effectiveDate)}
                            </span>
                            <span className="font-medium text-slate-700">
                              {formatCurrency(salary.gross)}
                              {salary.isActive ? " · Current" : ""}
                            </span>
                          </li>
                        ))}
                        {!employee360.salaryHistory.length && (
                          <li className="py-2 text-xs text-slate-400">
                            No salary history
                          </li>
                        )}
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-slate-200/80 p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <ClipboardList className="h-4 w-4 text-slate-400" />{" "}
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
                            className="flex items-start gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600"
                          >
                            <item.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="break-words">{item.value}</span>
                          </p>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200/80 p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <CalendarDays className="h-4 w-4 text-slate-400" />{" "}
                        Recent attendance
                      </h3>
                      <ul className="mt-3 space-y-1.5">
                        {employee360.attendance.map((record) => (
                          <li
                            key={record._id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs"
                          >
                            <span className="text-slate-500">
                              {formatDate(record.date)}
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="text-slate-500">
                                {record.hoursWorked || 0} hrs
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${attendanceTone[record.status] || "bg-slate-100 text-slate-600"}`}
                              >
                                {record.status}
                              </span>
                            </span>
                          </li>
                        ))}
                        {!employee360.attendance.length && (
                          <li className="py-3 text-xs text-slate-400">
                            No attendance records
                          </li>
                        )}
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-slate-200/80 p-4">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <History className="h-4 w-4 text-slate-400" /> Recent
                        leave
                      </h3>
                      <ul className="mt-3 space-y-1.5">
                        {employee360.leaveRequests.map((leave) => (
                          <li
                            key={leave._id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs"
                          >
                            <span className="text-slate-500">
                              {leave.leaveType?.name || "Leave"} ·{" "}
                              {formatDate(leave.startDate)}
                            </span>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-slate-600 ring-1 ring-inset ring-slate-200">
                              {leave.status}
                            </span>
                          </li>
                        ))}
                        {!employee360.leaveRequests.length && (
                          <li className="py-3 text-xs text-slate-400">
                            No leave requests
                          </li>
                        )}
                      </ul>
                    </section>
                  </div>

                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
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
