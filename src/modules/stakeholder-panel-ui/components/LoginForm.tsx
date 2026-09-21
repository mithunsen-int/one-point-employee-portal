"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/modules/stakeholder-panel-ui/hooks/useLogin";
import { persistSession, readSession, isSessionExpired } from "@/shared/auth/session";
import { homeRouteForRole } from "@/shared/auth/homeRouteForRole";

// stakeholder-panel-ui.test_cases.md's QT02 ("blocked client-side or left to
// the API's 400?") resolved by explicit user decision: block client-side.
const loginSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();

  // stakeholder-panel-ui.AC12: someone already holding a valid session who
  // navigates here directly is sent to their home page, not shown the form.
  useEffect(() => {
    if (!isSessionExpired()) {
      router.replace(homeRouteForRole(readSession()?.role));
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">One Point Employee Portal</h1>
        <Formik
          initialValues={{ username: "", password: "" }}
          validationSchema={loginSchema}
          onSubmit={(values, { setStatus }) => {
            setStatus(undefined);
            loginMutation.mutate(values, {
              onSuccess: (data) => {
                persistSession(data.access_token, data.expires_in);
                router.replace(homeRouteForRole(readSession()?.role));
              },
              onError: (error) => setStatus(error.message),
            });
          }}
        >
          {({ status }) => (
            <Form aria-label="Login" className="flex flex-col gap-4">
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

              {status && (
                <p role="alert" className="text-sm text-destructive">
                  {status}
                </p>
              )}

              <Button type="submit">Log In</Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
