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
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Users & HR" },
  { path: "/admin/employees", icon: Users, label: "Employees" },
  { path: "/admin/attendance", icon: Calendar, label: "Attendance" },
  { path: "/admin/leave", icon: FileText, label: "Leave" },
  { path: "/admin/payroll", icon: DollarSign, label: "Payroll" },
  { path: "/admin/settings", icon: Settings, label: "Settings" },
  { path: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  { path: "/admin/audit", icon: Shield, label: "Audit logs" },
  { path: "/admin/ai", icon: MessageSquare, label: "AI Assistant" },
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
