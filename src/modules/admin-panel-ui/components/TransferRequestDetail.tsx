"use client";

import { useTransferRequestDetail } from "@/modules/admin-panel-ui/hooks/useTransferRequestDetail";

interface TransferRequestDetailProps {
  id: string;
}

// Renders every field API03 returns plus the full actionHistory — not a
// partial projection (admin-panel-ui.AC3/UT03/QT08).
export function TransferRequestDetail({ id }: TransferRequestDetailProps) {
  const { data, isLoading, isError } = useTransferRequestDetail(id);

  if (isLoading) {
    return <p>Loading transfer request…</p>;
  }

  if (isError) {
    return <p>Something went wrong loading the transfer request.</p>;
  }

  if (data === null || data === undefined) {
    return <p>Transfer request not found.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Transfer Request {data.id}</h1>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <p>Status: {data.status}</p>
        <p>Department: {data.departmentId}</p>
        <p>Location: {data.location}</p>
        <p>Job Role: {data.jobRoleId}</p>
        <p>Effective Date: {data.effectiveDate}</p>
        {data.reason && <p>Reason: {data.reason}</p>}
        <p>Assigned Manager: {data.assignedManagerId}</p>
        <p>Submitted: {data.submittedAt}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">Action History</h2>
        {data.actionHistory.length === 0 ? (
          <p className="text-sm text-zinc-600">No actions yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-zinc-700">
            {data.actionHistory.map((entry, index) => (
              <li key={`${entry.actor}-${entry.action}-${index}`}>
                {entry.actor} — {entry.action} — {entry.timestamp}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
