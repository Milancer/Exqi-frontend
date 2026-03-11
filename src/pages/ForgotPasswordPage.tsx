import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Stack,
  Box,
  ThemeIcon,
  Transition,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMail, IconArrowLeft, IconCheck } from "@tabler/icons-react";
import api from "../services/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      setSubmitted(true);
      notifications.show({
        title: "Check your email",
        message: "If an account exists, we've sent a password reset link",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch {
      // Don't reveal if email exists - still show success
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (submitted) {
      return (
        <Stack align="center" gap="md">
          <ThemeIcon size={56} radius="xl" color="green" variant="light">
            <IconCheck size={28} stroke={1.5} />
          </ThemeIcon>
          <Title order={3} ta="center">
            Check Your Email
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            If an account exists for {form.values.email}, we've sent instructions to reset your password.
          </Text>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate("/login")}
            mt="md"
          >
            Back to Sign In
          </Button>
        </Stack>
      );
    }

    return (
      <>
        <Stack align="center" gap="xs" mb="xl">
          <ThemeIcon
            size={56}
            radius="xl"
            variant="gradient"
            gradient={{ from: "indigo", to: "violet", deg: 135 }}
          >
            <IconMail size={28} stroke={1.5} />
          </ThemeIcon>
          <Title order={2} fw={800} ta="center">
            Forgot Password?
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            Enter your email and we'll send you a reset link
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
            <Button
              type="submit"
              fullWidth
              size="md"
              loading={loading}
              variant="gradient"
              gradient={{ from: "indigo", to: "violet", deg: 135 }}
              mt="xs"
            >
              Send Reset Link
            </Button>
          </Stack>
        </form>

        <Anchor
          component="button"
          type="button"
          c="dimmed"
          size="sm"
          ta="center"
          mt="lg"
          style={{ display: "block", width: "100%" }}
          onClick={() => navigate("/login")}
        >
          <IconArrowLeft size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Back to Sign In
        </Anchor>
      </>
    );
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
