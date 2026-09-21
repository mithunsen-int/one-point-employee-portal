"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { readSession, isSessionExpired } from "@/shared/auth/session";
import { homeRouteForRole } from "@/shared/auth/homeRouteForRole";

// stakeholder-panel-ui.AC12: this route is never meant to be seen — it
// redirects immediately to Login (no/expired session) or the role's home
// page (valid session), the same decision LoginForm makes on a fresh login.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isSessionExpired()) {
      router.replace("/login");
    } else {
      router.replace(homeRouteForRole(readSession()?.role));
    }
  }, [router]);

  return null;
}
