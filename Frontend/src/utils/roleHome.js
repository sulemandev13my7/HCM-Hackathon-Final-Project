const roleHomes = {
  admin: "/admin",
  hr: "/hr",
  employee: "/employee",
};

export const getRoleHome = (role) => roleHomes[role] || "/login";
