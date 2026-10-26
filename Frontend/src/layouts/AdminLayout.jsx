import {
  Calendar,
  DollarSign,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import AppLayout from "./AppLayout";

const navItems = [
  {
    path: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    shortLabel: "Home",
    group: "Overview",
  },
  {
    path: "/admin/users",
    icon: Users,
    label: "Users & HR",
    shortLabel: "Users",
    group: "People",
  },
  {
    path: "/admin/employees",
    icon: Users,
    label: "Employees",
    shortLabel: "People",
    group: "People",
  },
  {
    path: "/admin/attendance",
    icon: Calendar,
    label: "Attendance",
    shortLabel: "Time",
    group: "Operations",
  },
  {
    path: "/admin/leave",
    icon: FileText,
    label: "Leave",
    shortLabel: "Leave",
    group: "Operations",
  },
  {
    path: "/admin/payroll",
    icon: DollarSign,
    label: "Payroll",
    shortLabel: "Pay",
    group: "Operations",
  },
  {
    path: "/admin/settings",
    icon: Settings,
    label: "Settings",
    group: "Workspace",
  },
  {
    path: "/admin/announcements",
    icon: Megaphone,
    label: "Announcements",
    group: "Workspace",
  },
  {
    path: "/admin/audit",
    icon: Shield,
    label: "Audit logs",
    group: "Workspace",
  },
  {
    path: "/admin/ai",
    icon: MessageSquare,
    label: "AI Assistant",
    shortLabel: "Assistant",
    group: "Workspace",
  },
];

export default function AdminLayout() {
  return (
    <AppLayout
      navItems={navItems}
      homePath="/admin"
      roleLabel="Admin"
      fallbackTitle="Admin workspace"
      accent="admin"
    />
  );
}
