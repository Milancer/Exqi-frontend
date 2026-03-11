import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LoadingOverlay, Box } from "@mantine/core";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

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
    return <Navigate to="/login" replace />;
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

// Module-based route guard
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

  // Admins have access to all modules
  if (user?.role === "ADMIN") {
    return <>{children}</>;
  }

  // Check if user's client has the required module
  const hasModule = user?.modules?.includes(module);
  if (!hasModule) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
