'use client';

import { type ReactNode } from 'react';
import { Badge, Button, Dialog, Input, Select, Table, Textarea } from '@/components/modules/inventory/ui';

export { Badge, Button, Dialog, Input, Select, Table, Textarea };

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-[2rem] border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}