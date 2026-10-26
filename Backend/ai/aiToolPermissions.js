const managementTools = [
  "get_headcount",
  "get_attendance_summary",
  "get_late_comers",
  "get_leave_summary",
  "get_my_leave_balance",
  "get_payroll_summary",
  "search_employees",
];

const roleToolPermissions = {
  admin: new Set(managementTools),
  hr: new Set(managementTools),
  employee: new Set(["get_attendance_summary", "get_my_leave_balance"]),
};

const canUseAITool = (role, toolName) =>
  roleToolPermissions[role]?.has(toolName) ?? false;

const filterAIToolsForRole = (role, availableTools) =>
  availableTools.filter((tool) => canUseAITool(role, tool.function.name));

module.exports = { canUseAITool, filterAIToolsForRole };
