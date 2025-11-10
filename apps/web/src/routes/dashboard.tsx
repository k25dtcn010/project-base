import { authClient } from "@/lib/auth-client";
import { requireAuth } from "@/lib/auth-utils";
import { Button, Box, Typography, Card, CardContent, Container } from "@mui/material";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const { session } = context;
    requireAuth(session, redirect);
    return { session };
  },
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Card>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Welcome {session.data?.user?.name || session.data?.user?.email || "Guest"}
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
