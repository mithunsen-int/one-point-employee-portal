"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useManagerDecision } from "@/modules/stakeholder-panel-ui/hooks/useManagerDecision";

interface ManagerDecisionPanelProps {
  id: string;
}

const rejectSchema = Yup.object({
  reason: Yup.string().required("Reason is required"),
});

// Approve needs no reason, so it bypasses Formik's own submit/validation
// entirely (a type="button" handler) — only Reject goes through the
// Yup-validated Form submit, per internal-transfer-workflow.API03's own
// conditional-required rule (reason required only on reject).
export function ManagerDecisionPanel({ id }: ManagerDecisionPanelProps) {
  const decisionMutation = useManagerDecision(id);

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
        <Form aria-label="Manager decision" className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
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
