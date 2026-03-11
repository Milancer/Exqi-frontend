import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Box,
  ThemeIcon,
  Transition,
  Loader,
  Center,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconBrain, IconLock, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import api from "../services/api";

type PageState = "loading" | "valid" | "invalid" | "success";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [userEmail, setUserEmail] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: {
      password: (value) => {
        if (value.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(value)) return "Password must contain at least one number";
        return null;
      },
      confirmPassword: (value, values) =>
        value !== values.password ? "Passwords do not match" : null,
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setPageState("invalid");
        return;
      }

      try {
        const response = await api.get(`/auth/verify-reset-token?token=${token}`);
        if (response.data.valid) {
          setUserEmail(response.data.email || "");
          setPageState("valid");
        } else {
          setPageState("invalid");
        }
      } catch {
        setPageState("invalid");
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) return;

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: values.password,
      });
      setPageState("success");
      notifications.show({
        title: "Password set successfully",
        message: "You can now sign in with your new password",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch (error: any) {
      notifications.show({
        title: "Failed to set password",
        message: error.response?.data?.message || "Something went wrong. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (pageState) {
      case "loading":
        return (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">Verifying your link...</Text>
            </Stack>
          </Center>
        );

      case "invalid":
        return (
          <Stack align="center" gap="md">
            <ThemeIcon size={56} radius="xl" color="red" variant="light">
              <IconAlertCircle size={28} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} ta="center">
              Invalid or Expired Link
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              This password reset link is invalid or has expired. Please request a new one.
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: "indigo", to: "violet", deg: 135 }}
              onClick={() => navigate("/login")}
              mt="md"
            >
              Back to Sign In
            </Button>
          </Stack>
        );

      case "success":
        return (
          <Stack align="center" gap="md">
            <ThemeIcon size={56} radius="xl" color="green" variant="light">
              <IconCheck size={28} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} ta="center">
              Password Set Successfully
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Your password has been set. You can now sign in to your account.
            </Text>
            <Button
              variant="gradient"
              gradient={{ from: "indigo", to: "violet", deg: 135 }}
              onClick={() => navigate("/login")}
              mt="md"
              fullWidth
            >
              Sign In
            </Button>
          </Stack>
        );

      case "valid":
        return (
          <>
            <Stack align="center" gap="xs" mb="xl">
              <ThemeIcon
                size={56}
                radius="xl"
                variant="gradient"
                gradient={{ from: "indigo", to: "violet", deg: 135 }}
              >
                <IconLock size={28} stroke={1.5} />
              </ThemeIcon>
              <Title order={2} fw={800} ta="center">
                Set Your Password
              </Title>
              {userEmail && (
                <Text c="dimmed" size="sm" ta="center">
                  for {userEmail}
                </Text>
              )}
            </Stack>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <PasswordInput
                  label="New Password"
                  placeholder="Enter your new password"
                  size="md"
                  required
                  {...form.getInputProps("password")}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  size="md"
                  required
                  {...form.getInputProps("confirmPassword")}
                />

                <Alert variant="light" color="gray" mt="xs">
                  <Text size="xs">
                    Password must be at least 8 characters and include uppercase, lowercase, and a number.
                  </Text>
                </Alert>

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  variant="gradient"
                  gradient={{ from: "indigo", to: "violet", deg: 135 }}
                  mt="xs"
                >
                  Set Password
                </Button>
              </Stack>
            </form>
          </>
        );
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

      <Transition mounted={true} transition="fade" duration={400}>
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
            {renderContent()}

            <Text c="dimmed" size="xs" ta="center" mt="xl">
              Nexus Platform © {new Date().getFullYear()}
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
