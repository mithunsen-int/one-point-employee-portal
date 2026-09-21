"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePayrollTask } from "@/modules/stakeholder-panel-ui/hooks/usePayrollTask";

interface PayrollTaskFormProps {
  id: string;
}

const payrollTaskSchema = Yup.object({
  action: Yup.string().oneOf(["update", "no_action_needed"]).required(),
  salary: Yup.string().when("action", {
    is: "update",
    then: (schema) => schema.required("Salary is required"),
  }),
  compensation: Yup.string().when("action", {
    is: "update",
    then: (schema) => schema.required("Compensation is required"),
  }),
  tax: Yup.string().when("action", {
    is: "update",
    then: (schema) => schema.required("Tax is required"),
  }),
  costCenter: Yup.string().when("action", {
    is: "update",
    then: (schema) => schema.required("Cost center is required"),
  }),
});

const initialValues = { action: "update", salary: "", compensation: "", tax: "", costCenter: "" };

// internal-transfer-workflow.API05 documents no 400 exception on its
// payload — the server accepts and completes the task regardless of
// content, by design (see internal-transfer-workflow.T06's Gate 2 evidence).
// This form still validates client-side per its own scope, since the
// server's leniency doesn't change what a real Payroll user should enter.
export function PayrollTaskForm({ id }: PayrollTaskFormProps) {
  const taskMutation = usePayrollTask(id);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={payrollTaskSchema}
      onSubmit={(values, { setStatus }) => {
        setStatus(undefined);
        const payload =
          values.action === "no_action_needed"
            ? ({ action: "no_action_needed" } as const)
            : ({
                action: "update" as const,
                salary: values.salary,
                compensation: values.compensation,
                tax: values.tax,
                costCenter: values.costCenter,
              });
        taskMutation.mutate(payload, { onError: (error) => setStatus(error.message) });
      }}
    >
      {({ status, values }) => (
        <Form
          aria-label="Payroll task completion"
          className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="action">Action</Label>
            <Field id="action" name="action" as="select" className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
              <option value="update">Update payroll details</option>
              <option value="no_action_needed">No Action Needed</option>
            </Field>
          </div>

          {values.action === "update" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="salary">Salary</Label>
                <Field id="salary" name="salary" as={Input} />
                <ErrorMessage name="salary" component="p" className="text-sm text-destructive" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="compensation">Compensation</Label>
                <Field id="compensation" name="compensation" as={Input} />
                <ErrorMessage name="compensation" component="p" className="text-sm text-destructive" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tax">Tax</Label>
                <Field id="tax" name="tax" as={Input} />
                <ErrorMessage name="tax" component="p" className="text-sm text-destructive" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="costCenter">Cost Center</Label>
                <Field id="costCenter" name="costCenter" as={Input} />
                <ErrorMessage name="costCenter" component="p" className="text-sm text-destructive" />
              </div>
            </>
          )}

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
