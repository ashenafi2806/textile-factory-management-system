"use client";

import { useAuth } from "@/context/auth-context";

/**
 * Returns true if the user has ADMIN (full access) or at least one allowed role.
 * When allowedRoles is empty, any authenticated user passes.
 */
export function hasAnyRole(
  userRoles: string[] | undefined,
  allowedRoles: string[],
): boolean {
  if (!userRoles?.length) return false;
  if (userRoles.includes("ADMIN")) return true;
  if (!allowedRoles?.length) return true;
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Returns true if the current user holds at least one of the given roles.
 * ADMIN always has access to every action.
 */
export function useCanPerform(allowedRoles: string[]): boolean {
  const { user } = useAuth();
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }
  return hasAnyRole(user.roles, allowedRoles);
}

/**
 * Returns the list of role names the current user holds, or an empty array
 * when no user is logged in.
 */
export function useUserRoles(): string[] {
  const { user } = useAuth();
  if (!user || !Array.isArray(user.roles)) {
    return [];
  }
  return user.roles;
}

/**
 * Returns true when the current user is ADMIN.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return Boolean(user?.roles?.includes("ADMIN"));
}
