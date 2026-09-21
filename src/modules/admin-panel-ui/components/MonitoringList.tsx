"use client";

import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useTransferRequestsList } from "@/modules/admin-panel-ui/hooks/useTransferRequestsList";

// No filtering/search — API02 supports none, per the spec's own Explicitly
// Out of Scope. Renders every returned request unfiltered.
export function MonitoringList() {
  const { data, isLoading, isError } = useTransferRequestsList();

  if (isLoading) {
    return <p>Loading transfer requests…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading the transfer request list.</p>;
  }

  if (data.length === 0) {
    return <p>No transfer requests have been submitted yet.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Transfer Request Monitoring</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <Link href={`/transfer-requests/${request.id}`} className="text-zinc-900 underline hover:no-underline">
                  {request.id}
                </Link>
              </TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell>{request.employeeId}</TableCell>
              <TableCell>{request.submittedAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
