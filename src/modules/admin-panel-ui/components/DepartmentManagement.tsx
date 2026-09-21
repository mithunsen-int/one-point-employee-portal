"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  useDepartments,
  useCreateDepartment,
  useEditDepartment,
  useDeleteDepartment,
} from "@/modules/admin-panel-ui/hooks/useDepartments";

const departmentSchema = Yup.object({
  name: Yup.string().required("Name is required"),
});

// No detail view — org-structure-management.API05 was deliberately never
// built ("Not yet set — deferred"); this screen only offers what the
// backend actually supports: list, create, edit, delete.
export function DepartmentManagement() {
  const { data, isLoading, isError } = useDepartments();
  const createDepartment = useCreateDepartment();
  const editDepartment = useEditDepartment();
  const deleteDepartment = useDeleteDepartment();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return <p>Loading departments…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading departments.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Department Management</h1>

      <Formik
        initialValues={{ name: "" }}
        validationSchema={departmentSchema}
        onSubmit={(values, { setStatus, resetForm }) => {
          setStatus(undefined);
          createDepartment.mutate(values, {
            onSuccess: () => resetForm(),
            onError: (error) => setStatus(error.message),
          });
        }}
      >
        {({ status }) => (
          <Form
            aria-label="Create department"
            className="flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Field id="name" name="name" as={Input} />
              <ErrorMessage name="name" component="span" className="text-sm text-destructive" />
            </div>

            {status && (
              <p role="alert" className="w-full text-sm text-destructive">
                {status}
              </p>
            )}

            <Button type="submit">Create Department</Button>
          </Form>
        )}
      </Formik>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((department) => (
            <TableRow key={department.id}>
              <TableCell>
                {editingId === department.id ? (
                  <Formik
                    initialValues={{ name: department.name }}
                    validationSchema={departmentSchema}
                    onSubmit={(values) => {
                      editDepartment.mutate(
                        { id: department.id, name: values.name },
                        { onSuccess: () => setEditingId(null) },
                      );
                    }}
                  >
                    <Form aria-label={`Edit ${department.name}`} className="flex items-center gap-2">
                      <Label htmlFor={`name-${department.id}`}>Name</Label>
                      <Field id={`name-${department.id}`} name="name" as={Input} />
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </Form>
                  </Formik>
                ) : (
                  department.name
                )}
              </TableCell>
              <TableCell className="space-x-2">
                {editingId !== department.id && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(department.id)}>
                    Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteDepartment.mutate(department.id)}
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
