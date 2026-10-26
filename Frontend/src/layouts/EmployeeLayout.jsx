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
  {
    path: "/employee",
    icon: LayoutDashboard,
    label: "Dashboard",
    shortLabel: "Home",
    group: "My work",
  },
  {
    path: "/employee/attendance",
    icon: Calendar,
    label: "My attendance",
    shortLabel: "Time",
    group: "My work",
  },
  {
    path: "/employee/leave",
    icon: FileText,
    label: "My leave",
    shortLabel: "Leave",
    group: "My work",
  },
  {
    path: "/employee/payroll",
    icon: DollarSign,
    label: "Payslips",
    shortLabel: "Pay",
    group: "My work",
  },
  {
    path: "/employee/announcements",
    icon: Megaphone,
    label: "Announcements",
    group: "Company",
  },
  {
    path: "/employee/profile",
    icon: User,
    label: "My profile",
    group: "Company",
  },
  {
    path: "/employee/ai",
    icon: MessageSquare,
    label: "AI Assistant",
    group: "Tools",
  },
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
