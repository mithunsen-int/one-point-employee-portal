"use client";

import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useMyRequests } from "@/modules/stakeholder-panel-ui/hooks/useMyRequests";

// Renders exactly what API10 returns — no client-side filtering, since the
// server already scopes results to the caller's role (stakeholder-panel-ui.AC2c).
// Each row links to /my-requests/{id}, not /transfer-requests/{id} — that
// path belongs to admin-panel-ui's own, different detail screen (see
// stakeholder-panel-ui.plan.md's 2026-09-20 route correction).
export function MyRequestsList() {
  const { data, isLoading, isError } = useMyRequests();

  if (isLoading) {
    return <p>Loading your requests…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading your requests.</p>;
  }

  if (data.length === 0) {
    return <p>No requests to show right now.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">My Requests</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <Link href={`/my-requests/${request.id}`} className="text-zinc-900 underline hover:no-underline">
                  {request.id}
                </Link>
              </TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell>{request.submittedAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
