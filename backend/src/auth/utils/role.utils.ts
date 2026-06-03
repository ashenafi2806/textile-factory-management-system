/** Normalize JWT user roles (string[] or Prisma relation objects). */
export function normalizeUserRoles(
  roles: unknown[] | undefined,
): string[] {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) =>
    typeof role === 'string' ? role : (role as { name: string }).name,
  );
}

export function isAdminUser(user: { roles?: unknown[] } | undefined): boolean {
  return normalizeUserRoles(user?.roles).includes('ADMIN');
}

/** True when user is a manager but not admin — apply department scoping. */
export function isManagerScopedUser(
  user: { roles?: unknown[] } | undefined,
): boolean {
  const roles = normalizeUserRoles(user?.roles);
  return roles.includes('MANAGER') && !roles.includes('ADMIN');
}

export function isHrOrAdminUser(
  user: { roles?: unknown[] } | undefined,
): boolean {
  const roles = normalizeUserRoles(user?.roles);
  return roles.includes('ADMIN') || roles.includes('HR_ADMIN');
}
