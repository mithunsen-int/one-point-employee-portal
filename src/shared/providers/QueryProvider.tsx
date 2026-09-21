"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Client-component boundary for TanStack Query, mounted once at the root
// layout — constitution.md's Architectural Constraints name TanStack Query
// as the sole server-state mechanism for every screen, not just Admin Panel
// UI's, so this lives at the app root rather than per-module.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
