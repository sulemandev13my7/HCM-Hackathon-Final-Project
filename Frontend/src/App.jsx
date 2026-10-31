import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import { Toaster } from "react-hot-toast";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./layouts/AdminLayout";
import HRLayout from "./layouts/HRLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import { getRoleHome } from "./utils/roleHome";

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
  <div className="flex min-h-screen items-center justify-center gap-2 bg-hcm-canvas text-sm text-hcm-muted">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-hcm-line border-t-hcm-accent" />
    Loading workspace...
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/" replace />;
  if (user.mustChangePassword)
    return <Navigate to="/change-password" replace />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (user) return <Navigate to={getRoleHome(user.role)} replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#072333",
              color: "#f8fafc",
              fontSize: "13px",
            },
          }}
        />
        <Suspense fallback={<PageLoading />}>
          <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/setup" element={<Navigate to="/signup" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
