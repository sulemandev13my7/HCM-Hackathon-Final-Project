import {
  Calendar,
  DollarSign,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  User,
} from "lucide-react";
import AppLayout from "./AppLayout";

const navItems = [
  { path: "/employee", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/employee/attendance", icon: Calendar, label: "My attendance" },
  { path: "/employee/leave", icon: FileText, label: "My leave" },
  { path: "/employee/payroll", icon: DollarSign, label: "Payslips" },
  {
    path: "/employee/announcements",
    icon: Megaphone,
    label: "Announcements",
  },
  { path: "/employee/profile", icon: User, label: "My profile" },
  { path: "/employee/ai", icon: MessageSquare, label: "AI Assistant" },
];

export default function EmployeeLayout() {
  return (
    <AppLayout
      navItems={navItems}
      homePath="/employee"
      roleLabel="Employee"
      fallbackTitle="Employee portal"
      accent="employee"
    />
  );
}
