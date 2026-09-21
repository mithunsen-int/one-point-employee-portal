"use client";

import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useUsers, useCreateUser, useEditUser, useDeleteUser } from "@/modules/admin-panel-ui/hooks/useUsers";
import { CreateUserPayload } from "@/modules/admin-panel-ui/services/usersService";

const ROLES = ["Employee", "HR", "Manager", "Payroll", "IT", "Facilities"] as const;

const createUserSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
  role: Yup.string().oneOf(ROLES).required("Role is required"),
  dateOfJoining: Yup.string().required("Date of joining is required"),
  managerId: Yup.string().when("role", {
    is: "Employee",
    then: (schema) => schema.required("Manager is required for the Employee role"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const editRoleSchema = Yup.object({
  role: Yup.string().oneOf(ROLES).required("Role is required"),
});

const initialCreateValues: CreateUserPayload = {
  username: "",
  password: "",
  role: "",
  dateOfJoining: "",
  managerId: "",
};

export function UserManagement() {
  const { data, isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const editUser = useEditUser();
  const deleteUser = useDeleteUser();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return <p>Loading users…</p>;
  }

  if (isError || !data) {
    return <p>Something went wrong loading users.</p>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">User Management</h1>

      <Formik
        initialValues={initialCreateValues}
        validationSchema={createUserSchema}
        onSubmit={(values, { setStatus }) => {
          setStatus(undefined);
          createUser.mutate(values, {
            onError: (error) => setStatus(error.message),
          });
        }}
      >
        {({ values, status }) => (
          <Form aria-label="Create user" className="flex flex-wrap items-end gap-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Field id="username" name="username" as={Input} />
              <ErrorMessage name="username" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Field id="password" name="password" type="password" as={Input} />
              <ErrorMessage name="password" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Field id="role" name="role" as="select" className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
                <option value="">Select a role</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="role" component="span" className="text-sm text-destructive" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dateOfJoining">Date of Joining</Label>
              <Field id="dateOfJoining" name="dateOfJoining" type="date" as={Input} />
              <ErrorMessage name="dateOfJoining" component="span" className="text-sm text-destructive" />
            </div>

            {values.role === "Employee" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="managerId">Manager</Label>
                <Field
                  id="managerId"
                  name="managerId"
                  as="select"
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                >
                  <option value="">Select a manager</option>
                  {data
                    .filter((candidate) => candidate.role === "Manager")
                    .map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.username}
                      </option>
                    ))}
                </Field>
                <ErrorMessage name="managerId" component="span" className="text-sm text-destructive" />
              </div>
            )}

            {status && (
              <p role="alert" className="w-full text-sm text-destructive">
                {status}
              </p>
            )}

            <Button type="submit">Create User</Button>
          </Form>
        )}
      </Formik>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                {editingId === user.id ? (
                  <Formik
                    initialValues={{ role: user.role }}
                    validationSchema={editRoleSchema}
                    onSubmit={(values) => {
                      editUser.mutate(
                        { id: user.id, role: values.role },
                        { onSuccess: () => setEditingId(null) },
                      );
                    }}
                  >
                    <Form aria-label={`Edit ${user.username}`} className="flex items-center gap-2">
                      <Label htmlFor={`role-${user.id}`}>Role</Label>
                      <Field
                        id={`role-${user.id}`}
                        name="role"
                        as="select"
                        className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </Field>
                      <Button type="submit" size="sm">
                        Save
                      </Button>
                    </Form>
                  </Formik>
                ) : (
                  user.role
                )}
              </TableCell>
              <TableCell className="space-x-2">
                {editingId !== user.id && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(user.id)}>
                    Edit
                  </Button>
                )}
                <Button type="button" variant="destructive" size="sm" onClick={() => deleteUser.mutate(user.id)}>
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
