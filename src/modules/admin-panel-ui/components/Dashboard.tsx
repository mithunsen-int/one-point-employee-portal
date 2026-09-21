"use client";

import { useDashboard } from "@/modules/admin-panel-ui/hooks/useDashboard";

export function Dashboard() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return <p>Loading dashboard…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading the dashboard.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">User Counts</h2>
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {Object.entries(data.userCounts).map(([role, count]) => (
            <li key={role} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              {role}: {count}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-zinc-700">Total Transfer Requests: {data.totalTransferRequests}</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">Status Breakdown</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.entries(data.statusBreakdown).map(([status, count]) => (
            <li key={status} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
              {status}: {count}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
