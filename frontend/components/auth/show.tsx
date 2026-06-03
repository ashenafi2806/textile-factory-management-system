'use client';

import { useAuth } from '@/context/auth-context';
import { hasAnyRole } from '@/hooks/useCanPerform';
import { ReactNode } from 'react';

interface ShowProps {
  forRole?: string | string[];
  children: ReactNode;
}

export const Show = ({ forRole, children }: ShowProps) => {
  const { user } = useAuth();

  if (!user) return null;

  if (forRole) {
    const roles = Array.isArray(forRole) ? forRole : [forRole];
    if (!hasAnyRole(user.roles, roles)) return null;
  }

  return <>{children}</>;
};
