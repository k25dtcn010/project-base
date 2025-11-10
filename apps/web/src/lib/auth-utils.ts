import type { redirect as redirectFn } from "@tanstack/react-router";
import type { authClient } from "./auth-client";

/**
 * Type for session data from better-auth
 */
export type Session = Awaited<ReturnType<typeof authClient.getSession>>;

/**
 * Type for the route context with session
 */
export interface AuthRouteContext {
  session: Session;
}

/**
 * Helper function to check if user is authenticated
 */
export function isAuthenticated(session: Session): boolean {
  return !!session?.data?.user;
}

/**
 * Helper to get redirect object for protected routes
 */
export function requireAuth(
  session: Session,
  redirect: typeof redirectFn,
  location?: { href: string }
) {
  if (!isAuthenticated(session)) {
    throw redirect({
      to: "/login",
      search: location
        ? {
            redirect: location.href,
          }
        : undefined,
    });
  }
}

/**
 * Helper to redirect authenticated users away from auth pages
 */
export function redirectIfAuthenticated(
  session: Session,
  redirect: typeof redirectFn,
  to: string = "/dashboard"
) {
  if (isAuthenticated(session)) {
    throw redirect({
      to,
    });
  }
}
