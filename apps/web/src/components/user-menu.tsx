import { Dropdown, Button, Spinner } from "react-bootstrap";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Spinner animation="border" size="sm" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  }

  if (!session) {
    return (
      <Button variant="outline-primary" size="sm" as={Link} to="/login">
        Sign In
      </Button>
    );
  }

  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary" size="sm" id="user-dropdown">
        {session.user.name}
      </Dropdown.Toggle>

      <Dropdown.Menu align="end">
        <Dropdown.Header>My Account</Dropdown.Header>
        <Dropdown.Item disabled>{session.user.email}</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({
                    to: "/",
                  });
                },
              },
            });
          }}
          className="text-danger"
        >
          Sign Out
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
