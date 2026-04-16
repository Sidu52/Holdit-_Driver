export const getInitials = (first?: string, last?: string) => {
  const initials = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  return initials || "U";
};
