import {
  Calendar,
  DollarSign,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import AppLayout from "./AppLayout";

const navItems = [
  { path: "/hr", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/hr/employees", icon: Users, label: "Employees" },
  { path: "/hr/attendance", icon: Calendar, label: "Attendance" },
  { path: "/hr/leave", icon: FileText, label: "Leave" },
  { path: "/hr/payroll", icon: DollarSign, label: "Payroll" },
  { path: "/hr/announcements", icon: Megaphone, label: "Announcements" },
  { path: "/hr/settings", icon: Settings, label: "Organization" },
  { path: "/hr/ai", icon: MessageSquare, label: "AI Assistant" },
];

export default function HRLayout() {
  return (
    <AppLayout
      navItems={navItems}
      homePath="/hr"
      roleLabel="HR"
      fallbackTitle="HR workspace"
      accent="hr"
    />
  );
}
