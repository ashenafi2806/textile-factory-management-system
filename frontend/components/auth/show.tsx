'use client';

import { useAuth } from '@/context/auth-context';
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
    const hasRole = user.roles.some((role) => roles.includes(role));
    if (!hasRole) return null;
  }

  return <>{children}</>;
};
