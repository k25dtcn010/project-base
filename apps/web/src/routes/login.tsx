import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/components/LoginForm";
import { redirectIfAuthenticated } from "@/lib/auth-utils";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const { session } = context;
    redirectIfAuthenticated(session, redirect);
  },
});

function RouteComponent() {
  return <LoginForm />;
}
