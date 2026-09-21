"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useManagersList } from "@/modules/stakeholder-panel-ui/hooks/useManagersList";
import { useHrFinalMapping } from "@/modules/stakeholder-panel-ui/hooks/useHrFinalMapping";

interface HrFinalMappingPanelProps {
  id: string;
}

const finalMappingSchema = Yup.object({
  newManagerId: Yup.string().required("Manager is required"),
});

// internal-transfer-workflow.API08's own payload treats newManagerId as
// optional (completing without a manager update if omitted) — but this
// panel exists specifically to choose one (stakeholder-panel-ui.AC9), so a
// selection is required client-side, same UX-enforcement pattern already
// used elsewhere in this module.
export function HrFinalMappingPanel({ id }: HrFinalMappingPanelProps) {
  const { data: managers, isLoading } = useManagersList();
  const finalMappingMutation = useHrFinalMapping(id);

  return (
    <Formik
      initialValues={{ newManagerId: "" }}
      validationSchema={finalMappingSchema}
      onSubmit={(values, { setStatus }) => {
        setStatus(undefined);
        finalMappingMutation.mutate(
          { newManagerId: values.newManagerId },
          { onError: (error) => setStatus(error.message) },
        );
      }}
    >
      {({ status }) => (
        <Form aria-label="HR final mapping" className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newManagerId">Manager</Label>
            <Field
              id="newManagerId"
              name="newManagerId"
              as="select"
              disabled={isLoading}
              className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
            >
              <option value="">Select a manager</option>
              {managers?.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.username}
                </option>
              ))}
            </Field>
            <ErrorMessage name="newManagerId" component="p" className="text-sm text-destructive" />
          </div>

          {status && (
            <p role="alert" className="text-sm text-destructive">
              {status}
            </p>
          )}

          <Button type="submit">Complete Final Mapping</Button>
        </Form>
      )}
    </Formik>
  );
}
