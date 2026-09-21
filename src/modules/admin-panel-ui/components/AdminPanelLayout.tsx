"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { readSession, clearSession } from "@/shared/auth/session";

interface AdminPanelLayoutProps {
  children: React.ReactNode;
}

// admin-panel-ui.AC12
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transfer-requests", label: "Monitoring" },
  { href: "/users", label: "User Management" },
  { href: "/departments", label: "Department Management" },
  { href: "/job-roles", label: "Job Role Management" },
] as const;

// Client-side gating only (admin-panel-ui.AC8/AC9) — a UX convenience, never
// a substitute for the server-side enforcement every consumed endpoint
// already performs independently.
export function AdminPanelLayout({ children }: AdminPanelLayoutProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session || session.role !== "Admin") {
      router.replace("/login");
      return;
    }
    // Session state is backed by localStorage, unavailable during SSR;
    // adopting it must be deferred to a client-only effect to avoid a
    // hydration mismatch, not derived from a prop/state value at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthorized(true);
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-zinc-950">
              {link.label}
            </Link>
          ))}
        </nav>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
