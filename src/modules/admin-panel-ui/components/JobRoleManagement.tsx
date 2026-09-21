"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  useJobRoles,
  useCreateJobRole,
  useEditJobRole,
  useDeleteJobRole,
} from "@/modules/admin-panel-ui/hooks/useJobRoles";

const jobRoleSchema = Yup.object({
  title: Yup.string().required("Title is required"),
});

// No detail view and no per-row "view detail" action — org-structure-management
// never built a Job Role detail endpoint (API10, "Not yet set — deferred"),
// same reasoning already applied to Department Management (T07).
export function JobRoleManagement() {
  const { data, isLoading, isError } = useJobRoles();
  const createJobRole = useCreateJobRole();
  const editJobRole = useEditJobRole();
  const deleteJobRole = useDeleteJobRole();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return <p>Loading job roles…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading job roles.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Job Role Management</h1>

      <Formik
        initialValues={{ title: "" }}
        validationSchema={jobRoleSchema}
        onSubmit={(values, { setStatus, resetForm }) => {
          setStatus(undefined);
          createJobRole.mutate(values, {
            onSuccess: () => resetForm(),
            onError: (error) => setStatus(error.message),
          });
        }}
      >
        {({ status }) => (
          <Form
            aria-label="Create job role"
            className="flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Field id="title" name="title" as={Input} />
              <ErrorMessage name="title" component="span" className="text-sm text-destructive" />
            </div>

            {status && (
              <p role="alert" className="w-full text-sm text-destructive">
                {status}
              </p>
            )}

            <Button type="submit">Create Job Role</Button>
          </Form>
        )}
      </Formik>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((jobRole) => (
            <TableRow key={jobRole.id}>
              <TableCell>
                {editingId === jobRole.id ? (
                  <Formik
                    initialValues={{ title: jobRole.title }}
                    validationSchema={jobRoleSchema}
                    onSubmit={(values) => {
                      editJobRole.mutate(
                        { id: jobRole.id, title: values.title },
                        { onSuccess: () => setEditingId(null) },
                      );
                    }}
                  >
                    <Form aria-label={`Edit ${jobRole.title}`} className="flex items-center gap-2">
                      <Label htmlFor={`title-${jobRole.id}`}>Title</Label>
                      <Field id={`title-${jobRole.id}`} name="title" as={Input} />
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </Form>
                  </Formik>
                ) : (
                  jobRole.title
                )}
              </TableCell>
              <TableCell className="space-x-2">
                {editingId !== jobRole.id && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(jobRole.id)}>
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteJobRole.mutate(jobRole.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
