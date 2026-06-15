'use client';

import { createContext, useContext } from 'react';

export interface EventShellCtx {
  slug: string;
  features: Record<string, boolean>;
}

export const EventShellContext = createContext<EventShellCtx>({ slug: '', features: {} });

export function useEventShell() {
  return useContext(EventShellContext);
}
