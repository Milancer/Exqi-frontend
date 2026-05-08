import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingOverlay, Box } from "@mantine/core";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box pos="relative" mih="100vh">
        <LoadingOverlay
          visible
          zIndex={1000}
          overlayProps={{ blur: 2 }}
          loaderProps={{ type: "dots", size: "xl" }}
        />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Preserve the originally-requested URL so LoginPage can send the user
    // back there after a successful sign-in (e.g. a reviewer clicking a
    // "/job-profiles/:id" link from an email).
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

// Admin-only route guard
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box pos="relative" mih="100vh">
        <LoadingOverlay
          visible
          zIndex={1000}
          overlayProps={{ blur: 2 }}
          loaderProps={{ type: "dots", size: "xl" }}
        />
      </Box>
    );
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Module-based route guard. Module access is derived from the user's role:
//   ADMIN, OFFICE_MANAGER → both modules
//   OFFICE_REVIEWER, JOB_PROFILE_USER → Job Profile
//   CBI_USER → Competency Based Interview
export function ModuleRoute({
  children,
  module
}: {
  children: React.ReactNode;
  module: string;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box pos="relative" mih="100vh">
        <LoadingOverlay
          visible
          zIndex={1000}
          overlayProps={{ blur: 2 }}
          loaderProps={{ type: "dots", size: "xl" }}
        />
      </Box>
    );
  }

  const role = user?.role;
  const allowed: Record<string, string[]> = {
    ADMIN: ["Job Profile", "Competency Based Interview"],
    OFFICE_MANAGER: ["Job Profile", "Competency Based Interview"],
    OFFICE_REVIEWER: ["Job Profile"],
    JOB_PROFILE_USER: ["Job Profile"],
    CBI_USER: ["Competency Based Interview"],
  };

  const userAllowed = (role && allowed[role]) || [];
  if (userAllowed.includes(module)) {
    return <>{children}</>;
  }

  // Redirect to the user's primary landing page.
  const fallback =
    role === "CBI_USER"
      ? "/interviews"
      : role === "OFFICE_REVIEWER" || role === "JOB_PROFILE_USER"
        ? "/job-profiles"
        : "/";
  return <Navigate to={fallback} replace />;
}
