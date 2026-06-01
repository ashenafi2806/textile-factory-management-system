"use client";

import { useAuth } from "@/context/auth-context";

/**
 * Returns true if the current user holds at least one of the given roles.
 * Always returns true when no roles are listed (i.e. the action is public).
 */
export function useCanPerform(allowedRoles: string[]): boolean {
  const { user } = useAuth();
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  return user.roles.some((role) => allowedRoles.includes(role));
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
