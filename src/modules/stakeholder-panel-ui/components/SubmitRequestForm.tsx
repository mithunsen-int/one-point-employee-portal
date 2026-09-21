"use client";

import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { location as LOCATIONS } from "@/shared/constants/referenceValues";
import { useDepartmentOptions, useJobRoleOptions } from "@/modules/stakeholder-panel-ui/hooks/useOrgStructureOptions";
import { useSubmitRequest } from "@/modules/stakeholder-panel-ui/hooks/useSubmitRequest";
import { readSession } from "@/shared/auth/session";

const submitRequestSchema = Yup.object({
  departmentId: Yup.string().required("Department is required"),
  location: Yup.string().required("Location is required"),
  jobRoleId: Yup.string().required("Job role is required"),
  effectiveDate: Yup.string().required("Effective date is required"),
  reason: Yup.string().notRequired(),
});

const initialValues = {
  departmentId: "",
  location: "",
  jobRoleId: "",
  effectiveDate: "",
  reason: "",
};

export function SubmitRequestForm() {
  const router = useRouter();
  const { data: departments, isLoading: departmentsLoading } = useDepartmentOptions();
  const { data: jobRoles, isLoading: jobRolesLoading } = useJobRoleOptions();
  const submitRequestMutation = useSubmitRequest();

  // Client-side UX only — internal-transfer-workflow.API01's own 403 for
  // any role other than Employee is the real enforcement. This just avoids
  // a non-Employee filling out the whole form before hitting that error.
  if (readSession()?.role !== "Employee") {
    return <p>This screen is only available to Employees.</p>;
  }

  if (departmentsLoading || jobRolesLoading) {
    return <p>Loading form…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Submit Transfer Request</h1>
      <Formik
        initialValues={initialValues}
        validationSchema={submitRequestSchema}
        onSubmit={(values, { setStatus }) => {
          setStatus(undefined);
          submitRequestMutation.mutate(values, {
            onSuccess: () => router.replace("/my-requests"),
            onError: (error) => setStatus(error.message),
          });
        }}
      >
        {({ status }) => (
          <Form
            aria-label="Submit transfer request"
            className="flex max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="departmentId">Department</Label>
              <Field
                id="departmentId"
                name="departmentId"
                as="select"
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
              >
                <option value="">Select a department</option>
                {departments?.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="departmentId" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Field
                id="location"
                name="location"
                as="select"
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
              >
                <option value="">Select a location</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="location" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobRoleId">Job Role</Label>
              <Field
                id="jobRoleId"
                name="jobRoleId"
                as="select"
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
              >
                <option value="">Select a job role</option>
                {jobRoles?.map((jobRole) => (
                  <option key={jobRole.id} value={jobRole.id}>
                    {jobRole.title}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="jobRoleId" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Field id="effectiveDate" name="effectiveDate" type="date" as={Input} />
              <ErrorMessage name="effectiveDate" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Field id="reason" name="reason" as={Input} />
            </div>

            {status && (
              <p role="alert" className="text-sm text-destructive">
                {status}
              </p>
            )}

            <Button type="submit">Submit Request</Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
