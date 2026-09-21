"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFacilitiesTask } from "@/modules/stakeholder-panel-ui/hooks/useFacilitiesTask";

interface FacilitiesTaskFormProps {
  id: string;
}

const facilitiesTaskSchema = Yup.object({
  workspace: Yup.string().required("Workspace is required"),
  officeLogistics: Yup.string().required("Office logistics is required"),
  locationSetup: Yup.string().required("Location setup is required"),
});

const initialValues = { workspace: "", officeLogistics: "", locationSetup: "" };

// internal-transfer-workflow.API07, like API05/API06, performs no
// server-side payload validation — this form's Yup rules exist for the real
// Facilities user's data-entry experience, not a server contract.
export function FacilitiesTaskForm({ id }: FacilitiesTaskFormProps) {
  const taskMutation = useFacilitiesTask(id);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={facilitiesTaskSchema}
      onSubmit={(values, { setStatus }) => {
        setStatus(undefined);
        taskMutation.mutate(values, { onError: (error) => setStatus(error.message) });
      }}
    >
      {({ status }) => (
        <Form
          aria-label="Facilities task completion"
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspace">Workspace</Label>
            <Field id="workspace" name="workspace" as={Input} />
            <ErrorMessage name="workspace" component="p" className="text-sm text-destructive" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="officeLogistics">Office Logistics</Label>
            <Field id="officeLogistics" name="officeLogistics" as={Input} />
            <ErrorMessage name="officeLogistics" component="p" className="text-sm text-destructive" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="locationSetup">Location Setup</Label>
            <Field id="locationSetup" name="locationSetup" as={Input} />
            <ErrorMessage name="locationSetup" component="p" className="text-sm text-destructive" />
          </div>

          {status && (
            <p role="alert" className="text-sm text-destructive">
              {status}
            </p>
          )}

          <Button type="submit">Complete Task</Button>
        </Form>
      )}
    </Formik>
  );
}
