"use client";

import { Button } from "@/components/ui/button";
import { readSession } from "@/shared/auth/session";
import { useRequestDetail } from "@/modules/stakeholder-panel-ui/hooks/useRequestDetail";
import { useWithdraw } from "@/modules/stakeholder-panel-ui/hooks/useWithdraw";
import { ManagerDecisionPanel } from "@/modules/stakeholder-panel-ui/components/ManagerDecisionPanel";
import { HrDecisionPanel } from "@/modules/stakeholder-panel-ui/components/HrDecisionPanel";
import { PayrollTaskForm } from "@/modules/stakeholder-panel-ui/components/PayrollTaskForm";
import { ItTaskForm } from "@/modules/stakeholder-panel-ui/components/ItTaskForm";
import { FacilitiesTaskForm } from "@/modules/stakeholder-panel-ui/components/FacilitiesTaskForm";
import { HrFinalMappingPanel } from "@/modules/stakeholder-panel-ui/components/HrFinalMappingPanel";

interface RequestDetailProps {
  id: string;
}

// The base of the adaptive detail/action screen — T06-T11 plug their own
// role-specific action panels in alongside this Employee-facing content,
// all reading the same API02-shaped data (stakeholder-panel-ui.plan.md's
// Architecture Approach: one adaptive screen, not five near-duplicates).
export function RequestDetail({ id }: RequestDetailProps) {
  const { data, isLoading, isError } = useRequestDetail(id);
  const withdrawMutation = useWithdraw(id);

  if (isLoading) {
    return <p>Loading your request…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading your request.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Request {data.id}</h1>
      <p className="text-sm text-zinc-700">Status: {data.status}</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">Pending Stakeholders</h2>
        {data.pendingStakeholders.length === 0 ? (
          <p className="text-sm text-zinc-600">None — this request has reached a final state.</p>
        ) : (
          <ul className="text-sm text-zinc-700">
            {data.pendingStakeholders.map((stakeholder) => (
              <li key={stakeholder}>{stakeholder}</li>
            ))}
          </ul>
        )}
      </section>

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

      {data.status === "Pending: Manager" && (
        <Button type="button" variant="destructive" onClick={() => withdrawMutation.mutate()}>
          Withdraw
        </Button>
      )}

      {/* internal-transfer-workflow.T11's AC19 carve-out means this data only
          ever loads for a Manager when they're the assigned Manager on this
          exact request — no separate "is this viewer the assigned Manager"
          check is needed beyond role + status, the fetch itself enforces it. */}
      {readSession()?.role === "Manager" && data.status === "Pending: Manager" && (
        <ManagerDecisionPanel id={id} />
      )}

      {/* internal-transfer-workflow.T12's AC19 carve-out lets HR view a
          request while Pending: HR OR once all 3 parallel tasks are
          Completed (for T11's future Final Mapping panel) — this task's own
          scope is only the Pending: HR decision, so it gates on that status
          alone rather than "any request HR can currently view". */}
      {readSession()?.role === "HR" && data.status === "Pending: HR" && <HrDecisionPanel id={id} />}

      {/* internal-transfer-workflow.T12's Payroll carve-out only lets Payroll
          view this request while their own payrollTaskStatus is still
          Pending — same reasoning as the Manager/HR gates above, the fetch
          itself already enforces the eligibility this depends on. */}
      {readSession()?.role === "Payroll" && data.status === "Pending: Payroll, IT, Facilities" && (
        <PayrollTaskForm id={id} />
      )}

      {readSession()?.role === "IT" && data.status === "Pending: Payroll, IT, Facilities" && (
        <ItTaskForm id={id} />
      )}

      {readSession()?.role === "Facilities" && data.status === "Pending: Payroll, IT, Facilities" && (
        <FacilitiesTaskForm id={id} />
      )}

      {/* internal-transfer-workflow.AC25 (added 2026-09-20): Pending: Transfer
          is now a first-class status set once all 3 parallel tasks complete,
          replacing the earlier reliance on API02's carve-out as an indirect
          signal — this status is now the direct, authoritative one. */}
      {readSession()?.role === "HR" && data.status === "Pending: Transfer" && (
        <HrFinalMappingPanel id={id} />
      )}
    </div>
  );
}
