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
