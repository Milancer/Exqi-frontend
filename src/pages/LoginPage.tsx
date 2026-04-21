import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import expLogo from "../assets/logo.svg";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Stack,
  Box,
  Transition,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // If the user was bounced here by ProtectedRoute, it attached the original
  // location to navigation state. Send them back to that URL after sign-in
  // so that a reviewer clicking a "/job-profiles/:id" link from their email
  // actually lands on the profile they were invited to.
  const from = (
    location.state as { from?: { pathname: string; search?: string } } | null
  )?.from;
  const redirectTo = from ? `${from.pathname}${from.search ?? ""}` : "/";

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length >= 6 ? null : "Password must be at least 6 characters",
    },
  });

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      notifications.show({
        title: "Sign in failed",
        message: error.response?.data?.message || "Invalid email or password",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #e8edf5 0%, #f0f4fa 50%, #f8f9fc 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle animated background orbs */}
      <Box
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30, 58, 95, 0.06) 0%, transparent 70%)",
          top: "-10%",
          right: "-5%",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <Box
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30, 58, 95, 0.04) 0%, transparent 70%)",
          bottom: "-5%",
          left: "-3%",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />

      <Transition mounted={!isLoading} transition="fade" duration={400}>
        {(styles) => (
          <Paper
            style={{
              ...styles,
              width: "100%",
              maxWidth: 420,
              margin: "0 auto",
              position: "relative",
              zIndex: 1,
              border: "1px solid var(--mantine-color-default-border)",
            }}
            radius="lg"
            p="xl"
          >
            <Stack align="center" gap="xs" mb="xl">
              <img
                src={expLogo}
                alt="EXQi"
                style={{ height: 64, width: 'auto' }}
              />
              <Text fw={500} size="sm" ta="center" c="dark">
                Experttech Quantum Integrator (EXQi)
              </Text>
            </Stack>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  size="md"
                  required
                  {...form.getInputProps("email")}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  size="md"
                  required
                  {...form.getInputProps("password")}
                />
                <Anchor
                  component="button"
                  type="button"
                  c="dimmed"
                  size="sm"
                  onClick={() => navigate("/forgot-password")}
                  style={{ alignSelf: "flex-end", marginTop: -8 }}
                >
                  Forgot password?
                </Anchor>
                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  variant="gradient"
                  gradient={{ from: "indigo", to: "violet", deg: 135 }}
                  mt="xs"
                >
                  Sign in
                </Button>
              </Stack>
            </form>

            <Text c="dimmed" size="xs" ta="center" mt="xl">
              EXQi Platform © {new Date().getFullYear()}
            </Text>
          </Paper>
        )}
      </Transition>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </Box>
  );
}
