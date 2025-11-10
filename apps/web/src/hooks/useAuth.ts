import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

/**
 * Hook for authentication functionality
 */
export const useAuth = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await authClient.signOut();
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout error:", error);
      // Navigate to login anyway on error
      navigate({ to: "/login" });
    }
  };

  return {
    logout,
  };
};
