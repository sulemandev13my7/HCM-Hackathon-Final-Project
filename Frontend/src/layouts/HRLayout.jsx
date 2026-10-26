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
  {
    path: "/hr",
    icon: LayoutDashboard,
    label: "Dashboard",
    shortLabel: "Home",
    group: "Overview",
  },
  {
    path: "/hr/employees",
    icon: Users,
    label: "Employees",
    shortLabel: "People",
    group: "People",
  },
  {
    path: "/hr/attendance",
    icon: Calendar,
    label: "Attendance",
    shortLabel: "Time",
    group: "Operations",
  },
  {
    path: "/hr/leave",
    icon: FileText,
    label: "Leave",
    shortLabel: "Leave",
    group: "Operations",
  },
  {
    path: "/hr/payroll",
    icon: DollarSign,
    label: "Payroll",
    shortLabel: "Pay",
    group: "Operations",
  },
  {
    path: "/hr/announcements",
    icon: Megaphone,
    label: "Announcements",
    group: "Workspace",
  },
  {
    path: "/hr/settings",
    icon: Settings,
    label: "Organization",
    group: "Workspace",
  },
  {
    path: "/hr/ai",
    icon: MessageSquare,
    label: "AI Assistant",
    shortLabel: "Assistant",
    group: "Workspace",
  },
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
