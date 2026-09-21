"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useItTask } from "@/modules/stakeholder-panel-ui/hooks/useItTask";

interface ItTaskFormProps {
  id: string;
}

const itTaskSchema = Yup.object({
  systemsAccess: Yup.string().required("Systems access is required"),
  permissions: Yup.string().required("Permissions is required"),
  devices: Yup.string().required("Devices is required"),
});

const initialValues = { systemsAccess: "", permissions: "", devices: "" };

function toList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

// internal-transfer-workflow.API06, like API05, performs no server-side
// payload validation — this form's Yup rules exist for the real IT user's
// data-entry experience, not to satisfy a server contract that doesn't
// exist (confirmed directly against it-task/route.ts before building this).
export function ItTaskForm({ id }: ItTaskFormProps) {
  const taskMutation = useItTask(id);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={itTaskSchema}
      onSubmit={(values, { setStatus }) => {
        setStatus(undefined);
        taskMutation.mutate(
          {
            systemsAccess: toList(values.systemsAccess),
            permissions: toList(values.permissions),
            devices: toList(values.devices),
          },
          { onError: (error) => setStatus(error.message) },
        );
      }}
    >
      {({ status }) => (
        <Form aria-label="IT task completion" className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="systemsAccess">Systems Access (comma-separated)</Label>
            <Field id="systemsAccess" name="systemsAccess" as={Input} />
            <ErrorMessage name="systemsAccess" component="p" className="text-sm text-destructive" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="permissions">Permissions (comma-separated)</Label>
            <Field id="permissions" name="permissions" as={Input} />
            <ErrorMessage name="permissions" component="p" className="text-sm text-destructive" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="devices">Devices (comma-separated)</Label>
            <Field id="devices" name="devices" as={Input} />
            <ErrorMessage name="devices" component="p" className="text-sm text-destructive" />
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
