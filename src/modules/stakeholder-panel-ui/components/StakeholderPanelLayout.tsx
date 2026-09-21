"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readSession, clearSession } from "@/shared/auth/session";
import { Button } from "@/components/ui/button";

interface StakeholderPanelLayoutProps {
  children: React.ReactNode;
}

// Client-side gating only (stakeholder-panel-ui.AC10) — a UX convenience,
// never a substitute for the server-side enforcement every consumed
// endpoint already performs independently. No role restriction here (unlike
// admin-panel-ui's guard) — this panel serves every non-Admin role equally.
export function StakeholderPanelLayout({ children }: StakeholderPanelLayoutProps) {
  const router = useRouter();
  // stakeholder-panel-ui.AC13: the nav bar's Submit Request link needs the
  // viewer's role, not just an authorized/unauthorized boolean — holding the
  // role itself (null while unresolved) doubles as that same boolean.
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    // Session state is backed by localStorage, unavailable during SSR;
    // adopting it must be deferred to a client-only effect to avoid a
    // hydration mismatch, not derived from a prop/state value at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(session.role);
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (role === null) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600">
          <Link href="/my-requests" className="hover:text-zinc-950">
            My Requests
          </Link>
          {role === "Employee" && (
            <Link href="/transfer-requests/new" className="hover:text-zinc-950">
              Submit Request
            </Link>
          )}
        </nav>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
