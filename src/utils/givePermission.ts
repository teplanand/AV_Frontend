export const givePermission = (module: string, right: string): boolean => {
  try {
    const raw = localStorage.getItem("permissions");
    if (!raw) return false;

    const permissions = JSON.parse(raw);
    return Array.isArray(permissions[module])
      ? permissions[module].includes(right)
      : false;
  } catch {
    return false;
  }
};
