import { createFileRoute, Navigate, redirect } from "@tanstack/react-router";

import { requireAuth } from "@/lib/auth-utils";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
  beforeLoad: async ({ context }) => {
    const { session } = context;
    requireAuth(session, redirect);
  },
});

function IndexRedirect() {
  return <Navigate to="/dashboard" />;
}
