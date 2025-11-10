import { createFileRoute, redirect } from "@tanstack/react-router";

import { WorkspaceLayout } from "@/components/tab/WorkspaceLayout";
import { requireAuth } from "@/lib/auth-utils";

// Layout route for workspace pages with tab bar
// Tabs state is now managed by Zustand + localStorage (see useTabsStore)
// This is a protected route - requires authentication
export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
  beforeLoad: async ({ context, location }) => {
    const { session } = context;
    requireAuth(session, redirect, location);
    return { session };
  },
});
