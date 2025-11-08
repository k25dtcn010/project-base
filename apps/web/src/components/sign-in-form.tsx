import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Form, Button, Container } from "react-bootstrap";
import z from "zod";
import Loader from "./loader";

export default function SignInForm() {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            navigate({
              to: "/dashboard",
            });
          },
          onError: (error) => {},
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <Container className="mt-5" style={{ maxWidth: "500px" }}>
      <h1 className="mb-4 text-center fw-bold">Welcome Back</h1>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <Form.Group className="mb-3">
              <Form.Label htmlFor={field.name}>Email</Form.Label>
              <Form.Control
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                isInvalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.map((error) => (
                <Form.Control.Feedback key={error?.message} type="invalid">
                  {error?.message}
                </Form.Control.Feedback>
              ))}
            </Form.Group>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <Form.Group className="mb-3">
              <Form.Label htmlFor={field.name}>Password</Form.Label>
              <Form.Control
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                isInvalid={field.state.meta.errors.length > 0}
              />
              {field.state.meta.errors.map((error) => (
                <Form.Control.Feedback key={error?.message} type="invalid">
                  {error?.message}
                </Form.Control.Feedback>
              ))}
            </Form.Group>
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              variant="primary"
              className="w-100"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Submitting..." : "Sign In"}
            </Button>
          )}
        </form.Subscribe>
      </Form>
    </Container>
  );
}
