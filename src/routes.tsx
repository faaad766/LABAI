import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

// Routes are managed via AppContext screen state in App.tsx
export const routes: RouteConfig[] = [];
