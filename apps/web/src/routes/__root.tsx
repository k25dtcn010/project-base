import { Box, CircularProgress } from "@mui/material";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async () => {
    // Load session data for all routes
    const session = await authClient.getSession();
    return { session };
  },
});

function RootComponent() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            bgcolor: "background.default",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <Outlet />
    </Suspense>
  );
}
