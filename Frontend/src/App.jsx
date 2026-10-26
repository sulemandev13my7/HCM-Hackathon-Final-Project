import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense, useEffect, useState } from "react";
import API from "./services/api";
import FirstRunSetup from "./pages/FirstRunSetup";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import AdminLayout from "./layouts/AdminLayout";
import HRLayout from "./layouts/HRLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const HRDashboard = lazy(() => import("./pages/hr/Dashboard"));
const EmployeeDashboard = lazy(() => import("./pages/employee/Dashboard"));
const Employees = lazy(() => import("./pages/employees/Employees"));
const Attendance = lazy(() => import("./pages/attendance/Attendance"));
const Leave = lazy(() => import("./pages/leave/Leave"));
const Payroll = lazy(() => import("./pages/payroll/Payroll"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Users = lazy(() => import("./pages/users/Users"));
const AIChat = lazy(() => import("./pages/ai/AIChat"));
const AuditLogs = lazy(() => import("./pages/audit/AuditLogs"));
const Announcements = lazy(() => import("./pages/announcements/Announcements"));
const Profile = lazy(() => import("./pages/profile/Profile"));

const PageLoading = () => (
  <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-sm text-slate-500">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
    Loading workspace...
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  if (user.mustChangePassword) return <Navigate to="/change-password" />;
  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(null);

  useEffect(() => {
    API.get("/auth/check-setup")
      .then((res) => {
        setNeedsSetup(res.data.needsSetup);
      })
      .catch(() => setNeedsSetup(false));
  }, []);

  if (needsSetup === null) return <PageLoading />;
  if (needsSetup) return <Navigate to="/setup" />;
  if (user?.role === "admin") return <Navigate to="/admin" />;
  if (user?.role === "hr") return <Navigate to="/hr" />;
  if (user?.role === "employee") return <Navigate to="/employee" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#0f172a",
              color: "#f8fafc",
              fontSize: "13px",
            },
          }}
        />
        <Suspense fallback={<PageLoading />}>
          <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/setup" element={<FirstRunSetup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="ai" element={<AIChat />} />
          </Route>

          <Route
            path="/hr"
            element={
              <ProtectedRoute roles={["hr"]}>
                <HRLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HRDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="settings" element={<Settings />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="ai" element={<AIChat />} />
          </Route>

          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={["employee"]}>
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="profile" element={<Profile />} />
            <Route path="ai" element={<AIChat />} />
          </Route>
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
