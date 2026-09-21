"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useHrDecision } from "@/modules/stakeholder-panel-ui/hooks/useHrDecision";

interface HrDecisionPanelProps {
  id: string;
}

const rejectSchema = Yup.object({
  reason: Yup.string().required("Reason is required"),
});

// Same structure as ManagerDecisionPanel — Approve bypasses Formik's
// validation entirely (no reason needed), only Reject is Yup-validated,
// per internal-transfer-workflow.API04's own conditional-required rule.
export function HrDecisionPanel({ id }: HrDecisionPanelProps) {
  const decisionMutation = useHrDecision(id);

  return (
    <Formik
      initialValues={{ reason: "" }}
      validationSchema={rejectSchema}
      onSubmit={(values, { setStatus }) => {
        setStatus(undefined);
        decisionMutation.mutate(
          { decision: "reject", reason: values.reason },
          { onError: (error) => setStatus(error.message) },
        );
      }}
    >
      {({ status, setStatus }) => (
        <Form aria-label="HR decision" className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">Reason (required to reject)</Label>
            <Field id="reason" name="reason" as="textarea" className="rounded-md border border-zinc-300 p-2 text-sm" />
            <ErrorMessage name="reason" component="p" className="text-sm text-destructive" />
          </div>
          {status && (
            <p role="alert" className="text-sm text-destructive">
              {status}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                setStatus(undefined);
                decisionMutation.mutate(
                  { decision: "approve" },
                  { onError: (error) => setStatus(error.message) },
                );
              }}
            >
              Approve
            </Button>
            <Button type="submit" variant="destructive">
              Reject
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
